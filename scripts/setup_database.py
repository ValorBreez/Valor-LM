import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_database():
    """Create the framework_chunks table with proper schema for vector storage"""
    
    # SQL to create the table with pgvector support
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS framework_chunks (
        id SERIAL PRIMARY KEY,
        step_number INTEGER,
        step_name TEXT,
        sub_step TEXT,
        sub_step_name TEXT,
        text TEXT NOT NULL,
        category TEXT,
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create a vector index for similarity search
    CREATE INDEX IF NOT EXISTS framework_chunks_embedding_idx 
    ON framework_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
    """
    
    try:
        # Execute the SQL to create table and index
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✅ Database table 'framework_chunks' created successfully!")
        print("✅ Vector index created for similarity search!")
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        print("Note: You may need to enable the pgvector extension in your Supabase project first.")
        print("Go to your Supabase dashboard → Database → Extensions → Enable 'pgvector'")

if __name__ == "__main__":
    print("Setting up database table for framework chunks...")
    setup_database() 