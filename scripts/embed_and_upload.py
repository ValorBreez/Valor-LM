import os
import json
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

# Step 1: Load relationship_framework_chunks.json
def load_chunks(json_path):
    with open(json_path, 'r') as f:
        chunks = json.load(f)
    return chunks

# Step 2: Get embeddings from OpenAI
def get_embedding(text):
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

# Step 3: Upload chunks to Supabase
def upload_chunks(chunks):
    """Upload chunks with embeddings to Supabase"""
    print(f"Uploading {len(chunks)} chunks to Supabase...")
    
    for i, chunk in enumerate(chunks):
        try:
            # Prepare data for upload with only basic columns
            upload_data = {
                'text': chunk['text'],
                'embedding': chunk['embedding']
            }
            
            # Insert into Supabase
            result = supabase.table('framework_chunks').insert(upload_data).execute()
            
            print(f"✅ Uploaded chunk {i+1}/{len(chunks)}: {chunk['sub_step_name']}")
            
        except Exception as e:
            print(f"❌ Error uploading chunk {i+1}: {e}")
            print(f"Chunk: {chunk['sub_step_name']}")
    
    print("🎉 Upload complete!")

if __name__ == "__main__":
    # Load chunks
    chunks = load_chunks('data/relationship_framework_chunks.json')
    print(f"Loaded {len(chunks)} chunks.")
    
    # Get embeddings for each chunk
    print("Generating embeddings...")
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk['text'])
        chunk['embedding'] = embedding
        print(f"Generated embedding {i+1}/{len(chunks)}")
    
    print("Embeddings generated for all chunks.")
    
    # Upload to Supabase
    upload_chunks(chunks) 