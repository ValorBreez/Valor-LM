# Valor LM: Custom AI Assistant

This project builds a custom AI assistant that answers questions using your personal Relationship Management and Leadership frameworks. It uses OpenAI for embeddings and completions, and Supabase (with pgvector) as the vector database.

## Project Structure

- `data/relationship_framework_chunks.json`: Your framework chunks
- `scripts/embed_and_upload.py`: Embeds & uploads chunks to Supabase
- `scripts/retrieve_and_respond.py`: Retrieves relevant chunks & generates responses
- `.env`: API keys for OpenAI & Supabase
- `requirements.txt`: Python dependencies

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Add your OpenAI and Supabase credentials to a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   ```
3. Place your framework JSON in `data/relationship_framework_chunks.json`.

## Usage

- Run `scripts/embed_and_upload.py` to upload your framework chunks to Supabase.
- Run `scripts/retrieve_and_respond.py` to query and generate responses. 