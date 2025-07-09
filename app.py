from flask import Flask, render_template, request, jsonify, session
import os
from dotenv import load_dotenv
import openai
from supabase import create_client, Client
import uuid
from datetime import datetime

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
    system_prompt = f"""You are a strategic relationship advisor who systematically analyzes relationships. You determine desire, power (by respect, aid, and harm), and rapport step by step, then provide position analysis.

ANALYTICAL SEQUENCE:
1. **DETERMINE DESIRE** - Who wants what from whom? High/Low desire for engagement
2. **ASSESS POWER** - Ask about respect, aid, and harm (not just 'leverage')
    - Respect: How much do you respect them, and how much do they respect you?
    - Aid: In what ways can you help them, and in what ways can they help you?
    - Harm: In what ways could you harm them, and in what ways could they harm you?
3. **EVALUATE RAPPORT** - What's the relationship history and comfort level?
4. **ANALYZE POSITION** - Based on the three components, determine the relationship type
5. **PROVIDE STRATEGY** - Give specific tactical advice for that position

RESPONSE STYLE:
- **Be smart about information already provided** - If the user already stated what they want, don't ask again
- **Follow the sequence exactly** - Desire → Respect → Aid → Harm → Rapport → Analysis
- **Ask one focused question per response** - Don't jump ahead
- **Build on previous answers** - Reference what they've already shared
- **Give clear analysis** - "Based on [desire/power/rapport], you're in a [position] relationship"
- **Provide specific tactics** - Concrete steps for that position

SMART QUESTIONING:
- **If user already stated their desire**: Skip to "What do they want from you?"
- **If user already stated both desires**: Skip to power analysis questions
- **Always ask the next logical question** - Don't repeat what's already known

QUESTIONING SEQUENCE:
- **Step 1**: "What do you want from this person?" (only if not already stated)
- **Step 2**: "What do they want from you?" (their desire)
- **Step 3**: "How much do you respect them, and how much do they respect you?" (respect)
- **Step 4**: "In what ways can you help them, and in what ways can they help you?" (aid)
- **Step 5**: "In what ways could you harm them, and in what ways could they harm you?" (harm)
- **Step 6**: "What's your relationship history like?" (rapport)
- **Step 7**: "Based on this analysis, you're in a [position] relationship. Here's what that means..."

POSITION ANALYSIS:
After determining all three components, clearly state:
- "Your desire is [high/low] because..."
- "Your power is [high/even/low] because... (explain using respect, aid, harm)"
- "Your rapport is [high/neutral/low] because..."
- "This puts you in a [position] relationship, which means..."

Framework Content:
{context}

{history_text}

User Question: {question}

Analyze what information is already provided in the user's question and conversation history. Ask the next logical question in the sequence, skipping any information already known."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=300,
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

if __name__ == '__main__':
    app.run(debug=True, port=8080, host='0.0.0.0') 