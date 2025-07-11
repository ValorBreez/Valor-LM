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
        "Use values like 'high', 'even', 'low' for power fields and 'high', 'neutral', 'low' for rapport. "
        "If a fact is not present, omit it. Be conversationally aware: infer facts from context, not just direct statements. "
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
You are a relationship strategist. Your job is to ask clarifying questions to understand the situation before giving advice.

ANALYSIS PROCESS:
1. FIRST: Ask 1-2 specific questions to understand the relationship dynamics
2. ONLY AFTER getting answers: Provide position analysis and tactics

KEY QUESTIONS TO ASK:
- What do you want from this person? (Desire: High/Low)
- What leverage do you have over them? (Power: High/Even/Low) 
- What's your history together? (Rapport: High/Low)

FRAMEWORK: 12 relationship types based on Desire, Power, and Rapport:
- Dominant (High Desire, High Power, High Rapport): Lead with relationship strength
- Subjugative (High Desire, High Power, Low Rapport): Direct engagement, build rapport
- Collaborative (High Desire, Even Power, High Rapport): Partnership approach, leverage rapport
- Compromising (High Desire, Even Power, Low Rapport): Negotiation with value exchange
- Appealing (High Desire, Low Power, High Rapport): Leverage rapport to compensate for power
- Supplicating (High Desire, Low Power, Low Rapport): Build value and rapport first
- Protective (Low Desire, High Power, High Rapport): Gentle deflection using rapport
- Dismissive (Low Desire, High Power, Low Rapport): Minimal engagement, clear boundaries
- Resistant (Low Desire, Even Power, High Rapport): Gentle resistance, preserve connection
- Avoidant (Low Desire, Even Power, Low Rapport): Defensive engagement, clear resistance
- Defensive (Low Desire, Low Power, High Rapport): Gentle resistance, preserve relationship
- Accommodating (Low Desire, Low Power, Low Rapport): Minimal engagement, damage control

FRAMEWORK TACTICS:
- Exploitation: Use their character flaws (intellectual: dim/naive/uninformed, emotional: empathetic/insecure/egotistic)
- Persuasion: Change their perception of value/cost (true offensive/defensive, false when flaws present)
- Manipulation: Use fear of your power (offensive/defensive through rapport/harm/aid)
- Power Building: Increase respect/harm/aid power through value demonstration, leverage creation, or network building

RESPONSE FORMAT:
If missing key info: Ask 1-2 specific questions about desire, power, or rapport
If you have enough info: 
1. Identify position type and reasoning
2. Suggest 2-3 SPECIFIC framework tactics (exploitation, persuasion, manipulation, power building)
3. Give 1 positional improvement strategy
4. Mention 1 framework warning

IMPORTANT: Use framework tactics, not generic advice. Suggest specific ways to improve position or employ framework tactics.

When giving advice:
- Use bullet points
- Limit each tactic to one sentence
- Keep the entire response under 100 words
- Do not elaborate unless the user asks for more detail

Framework Content:
{context}

{history_text}

User Message: {question}

Ask questions first, then give advice."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=300,  # Reduced for more concise responses
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