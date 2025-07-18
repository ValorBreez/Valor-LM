from flask import Flask, render_template, request, jsonify, session
import os
from dotenv import load_dotenv
import openai
from supabase import create_client, Client
import uuid
from datetime import datetime
import re

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not OPENAI_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_KEY must be set in .env file")

openai.api_key = OPENAI_API_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this in production

# In-memory storage for conversation history (in production, use a database)
conversation_history = {}

def get_embedding(text):
    """Get embedding for text using OpenAI"""
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def search_similar_chunks(question_embedding, limit=5):
    """Search for similar chunks in Supabase using vector similarity"""
    try:
        # Use pgvector's cosine similarity to find the most relevant chunks
        result = supabase.rpc(
            'match_documents',
            {
                'query_embedding': question_embedding,
                'match_threshold': 0.7,
                'match_count': limit
            }
        ).execute()
        
        return result.data
    except Exception as e:
        print(f"Error searching chunks: {e}")
        # Fallback: get all chunks if the RPC function doesn't exist
        result = supabase.table('framework_chunks').select('*').execute()
        return result.data[:limit]

def extract_relationship_facts(user_message, conversation_history=None):
    """Use OpenAI to extract or update relationship subject and facts from a user message."""
    system_prompt = (
        "You are an assistant that extracts relationship subjects and facts from user messages. "
        "For each message, return a JSON object with: "
        "'subject' (the person/role the user is talking about, e.g. 'boss', 'neighbor'), "
        "and any facts you can infer: 'power_respect', 'power_aid', 'power_harm', 'rapport', 'notes'. "
        "Use values like 'high', 'even', 'low' for power fields. "
        "For rapport, use: 'low' (cold, hostile, dismissive, adversarial), 'neutral' (professional, respectful, distant, indifferent), 'high' (friendly, warm, trusting, personal). "
        "For offensive engagements (user is the initiator and wants something), ONLY the target's level of desire is relevant for 'desire' (ignore the user's desire). "
        "If the subject is not clear, return null for subject."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    if conversation_history:
        for msg in conversation_history[-3:]:
            messages.insert(1, {"role": "user", "content": msg['user']})
            messages.insert(2, {"role": "assistant", "content": msg['assistant']})
    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            max_tokens=300,
            temperature=0.2
        )
        import json
        text = response.choices[0].message.content or ""
        # Try to extract JSON from the response
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            facts = json.loads(match.group(0))
            return facts
        return None
    except Exception as e:
        print(f"Error extracting relationship facts: {e}")
        return None

def generate_response(question, relevant_chunks, conversation_history=None):
    """Generate a response using GPT-4-turbo with the relevant framework chunks and conversation history"""
    
    # Prepare the context from relevant chunks
    context = "\n\n".join([
        f"Framework Section {i+1}:\n{chunk['text']}"
        for i, chunk in enumerate(relevant_chunks)
    ])
    
    # Prepare conversation history
    history_text = ""
    if conversation_history and len(conversation_history) > 0:
        history_text = "\n\nPrevious Conversation:\n" + "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}"
            for msg in conversation_history[-5:]  # Keep last 5 exchanges for context
        ])
    
    # Create the prompt
    system_prompt = f"""
You are Valor LM, a professional relationship strategist. Provide executive-level relationship analysis and strategic guidance.

EXECUTIVE TOP SHEET FORMAT:
When you have enough information, structure your response as:

**RELATIONSHIP POSITION**
[Position Type] - [Brief Description]
Score: [X/10] (if applicable)

**KEY DYNAMICS**
• Desire: [High/Medium/Low] - [Brief reasoning; for offensive engagements, use only the target's level of interest]
• Power: [High/Even/Low] - [Brief reasoning]
• Rapport: [High/Neutral/Low] - [Low = cold/hostile/dismissive/adversarial, Neutral = professional/respectful/distant/indifferent, High = friendly/warm/trusting/personal]

**STRATEGIC RECOMMENDATIONS**
1. [Primary tactical approach]
2. [Secondary tactical approach]
3. [Positional improvement strategy]

**ENGAGEMENT APPROACH**
• Opening: [How to start the engagement]
• Middle Game: [Core strategy]
• Closing: [How to conclude]

**WARNING SIGNS**
• [If rapport is neutral and desire is medium, warn about fadeout or losing to a competitor. Only show conflict/confrontation warnings if input indicates hostility.]

FRAMEWORK GUIDANCE:
- For Medium Desire (target), Even Power, Neutral Rapport, classify as 'The Negotiation' or similar.
- Tactical priorities for this profile: build alignment, seek internal champion support, present strategic value and differentiation from competitors.

FRAMEWORK CONTENT:
{context}

{history_text}

User Message: {question}

If missing key information, ask 1-2 specific questions about:
- What you want from them (Desire)
- Your leverage over them (Power)
- Your relationship history (Rapport)

Keep responses concise and executive-level. Focus on strategic positioning and tactical guidance."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=500,  # Increased for executive format
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating response: {e}"

@app.route('/')
def index():
    # Generate a unique session ID for this user
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
        conversation_history[session['session_id']] = []
    
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({'error': 'Please provide a question'}), 400
        
        # Get or create session ID
        session_id = session.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            session['session_id'] = session_id
        
        # Get conversation history for this session
        history = conversation_history.get(session_id, [])
        
        # --- New: Extract relationship facts and update Supabase ---
        facts = extract_relationship_facts(question, history)
        if facts and facts.get('subject'):
            # Check if subject exists
            rel_name = facts['subject'].strip().title()
            rels = supabase.table('relationships').select('id').eq('name', rel_name).execute().data
            if not rels:
                # Add new relationship
                supabase.table('relationships').insert({'name': rel_name}).execute()
            # Update facts if present (only columns that exist in the table)
            valid_fields = ['power_respect', 'power_aid', 'power_harm', 'rapport', 'notes']
            update_fields = {k: v for k, v in facts.items() if k in valid_fields and v is not None}
            if update_fields:
                supabase.table('relationships').update(update_fields).eq('name', rel_name).execute()
        # --- End new logic ---

        # Step 1: Get embedding for the question
        question_embedding = get_embedding(question)
        
        # Step 2: Search for relevant chunks
        relevant_chunks = search_similar_chunks(question_embedding)
        
        # Step 3: Generate response with conversation history
        response = generate_response(question, relevant_chunks, history)
        
        # Step 4: Update conversation history
        history.append({
            'user': question,
            'assistant': response,
            'timestamp': str(datetime.now())
        })
        conversation_history[session_id] = history
        
        return jsonify({
            'response': response,
            'chunks_used': len(relevant_chunks),
            'conversation_length': len(history)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500

@app.route('/clear_history', methods=['POST'])
def clear_history():
    """Clear conversation history for the current session"""
    session_id = session.get('session_id')
    if session_id and session_id in conversation_history:
        conversation_history[session_id] = []
    
    return jsonify({'message': 'Conversation history cleared'})

# --- Relationship Management Endpoints ---

@app.route('/api/relationships', methods=['GET'])
def list_relationships():
    try:
        result = supabase.table('relationships').select('*').order('created_at', desc=False).execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/relationships', methods=['POST'])
def add_relationship():
    try:
        data = request.get_json()
        name = data.get('name')
        power_respect = data.get('power_respect')
        power_aid = data.get('power_aid')
        power_harm = data.get('power_harm')
        rapport = data.get('rapport')
        notes = data.get('notes')
        new_rel = {
            'name': name,
            'power_respect': power_respect,
            'power_aid': power_aid,
            'power_harm': power_harm,
            'rapport': rapport,
            'notes': notes
        }
        result = supabase.table('relationships').insert(new_rel).execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/relationships/<uuid:rel_id>', methods=['GET'])
def get_relationship(rel_id):
    try:
        result = supabase.table('relationships').select('*').eq('id', str(rel_id)).single().execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/relationships/<uuid:rel_id>', methods=['PUT'])
def update_relationship(rel_id):
    try:
        data = request.get_json()
        update_fields = {k: v for k, v in data.items() if k in ['name', 'power_respect', 'power_aid', 'power_harm', 'rapport', 'notes']}
        result = supabase.table('relationships').update(update_fields).eq('id', str(rel_id)).execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080, host='0.0.0.0') 