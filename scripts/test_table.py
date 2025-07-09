import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_table():
    try:
        # Try to insert a simple test record
        test_data = {
            'step_number': 1,
            'step_name': 'Test',
            'sub_step': '1.1',
            'sub_step_name': 'Test Step',
            'text': 'This is a test',
            'embedding': [0.1] * 1536  # Simple test embedding
        }
        
        result = supabase.table('framework_chunks').insert(test_data).execute()
        print("✅ Test insert successful!")
        print("Table structure supports the basic columns.")
        
        # Clean up test data
        supabase.table('framework_chunks').delete().eq('text', 'This is a test').execute()
        print("✅ Test data cleaned up.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("This will help us understand what columns are missing.")

if __name__ == "__main__":
    test_table() 