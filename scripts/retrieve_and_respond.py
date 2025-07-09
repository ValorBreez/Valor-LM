import os
from dotenv import load_dotenv
import openai
from supabase import create_client, Client

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not OPENAI_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_KEY must be set in .env file")

openai.api_key = OPENAI_API_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

def generate_response(question, relevant_chunks):
    """Generate a response using GPT-4-turbo with the relevant framework chunks"""
    
    # Prepare the context from relevant chunks
    context = "\n\n".join([
        f"Framework Section {i+1}:\n{chunk['text']}"
        for i, chunk in enumerate(relevant_chunks)
    ])
    
    # Create the prompt
    system_prompt = f"""You are a custom AI assistant that answers questions using ONLY the provided Relationship Management and Leadership frameworks. 

IMPORTANT RULES:
1. Base your answers ONLY on the framework content provided
2. Do not use any external knowledge or general advice
3. If the question cannot be answered using the provided framework, say so clearly
4. Be specific and reference the framework concepts when possible
5. Keep responses focused and actionable based on the framework

Framework Content:
{context}

User Question: {question}

Please provide a response based ONLY on the framework content above."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating response: {e}"

def answer_question(question):
    """Main function to answer a question using the framework"""
    print(f"Question: {question}")
    print("Processing...")
    
    # Step 1: Get embedding for the question
    question_embedding = get_embedding(question)
    print("✅ Question embedded")
    
    # Step 2: Search for relevant chunks
    relevant_chunks = search_similar_chunks(question_embedding)
    print(f"✅ Found {len(relevant_chunks)} relevant framework chunks")
    
    # Step 3: Generate response
    response = generate_response(question, relevant_chunks)
    
    print("\n" + "="*50)
    print("RESPONSE:")
    print("="*50)
    print(response)
    print("="*50)
    
    return response

if __name__ == "__main__":
    # Test with a sample question
    test_question = "How should I approach a difficult conversation with someone who has more power than me?"
    answer_question(test_question) 