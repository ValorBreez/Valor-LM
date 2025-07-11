# Supabase Setup Guide for Valor LM

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `valor-lm`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to initialize (2-3 minutes)

## Step 2: Get Project Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon Key** (public key for client-side access)
   - **Service Role Key** (private key for server-side access)

## Step 3: Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `supabase_schema.sql`
3. Paste into the SQL editor
4. Click "Run" to execute the schema

## Step 4: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'relationship_types', 'scenarios', 'ai_responses');

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'scenarios', 'ai_responses');
```

## Step 5: Insert Relationship Types Data

Run this to populate the relationship types:

```sql
INSERT INTO relationship_types (type_name, desire_level, power_level, rapport_level, characteristics, tactical_priorities, warning_signs) VALUES
('The Leveraged Ally', 'High', 'High', 'High', 
 '["Strong mutual benefit", "High trust", "Clear power advantage"]',
 '["Maintain rapport", "Leverage influence strategically", "Build long-term partnership"]',
 '["Over-reliance", "Power abuse", "Neglected relationship maintenance"]'),

('The Reluctant Resource', 'High', 'High', 'Low',
 '["You need something", "You have power", "Low trust/rapport"]',
 '["Build rapport gradually", "Use power carefully", "Create mutual benefit"]',
 '["Resistance", "Resentment", "Power backlash"]'),

('The Collaborative Partner', 'High', 'Even', 'High',
 '["Mutual need", "Equal power", "Good rapport"]',
 '["Collaborate openly", "Share information", "Build trust"]',
 '["Competition", "Hidden agendas", "Trust breakdown"]'),

('The Stalemate', 'High', 'Even', 'Low',
 '["Mutual need", "Equal power", "Low rapport"]',
 '["Find common ground", "Build trust slowly", "Create small wins"]',
 '["Gridlock", "Escalating conflict", "No progress"]'),

('The Benevolent Patron', 'High', 'Low', 'High',
 '["You need something", "They have power", "Good rapport"]',
 '["Appeal to goodwill", "Show value", "Maintain relationship"]',
 '["Dependency", "Charity fatigue", "Power imbalance"]'),

('The Desperate Seeker', 'High', 'Low', 'Low',
 '["You need something", "They have power", "Low rapport"]',
 '["Build rapport urgently", "Show value", "Find leverage"]',
 '["Desperation", "Rejection", "No leverage"]'),

('The Valued Mentor', 'Low', 'High', 'High',
 '["Low need", "You have power", "Good rapport"]',
 '["Maintain relationship", "Offer value", "Build network"]',
 '["Neglect", "One-sided relationship", "Lost opportunity"]'),

('The Unwanted Authority', 'Low', 'High', 'Low',
 '["Low need", "You have power", "Low rapport"]',
 '["Minimize interaction", "Avoid conflict", "Maintain boundaries"]',
 '["Resentment", "Power struggles", "Unnecessary conflict"]'),

('The Trusted Peer', 'Low', 'Even', 'High',
 '["Low need", "Equal power", "Good rapport"]',
 '["Maintain friendship", "Share information", "Support each other"]',
 '["Neglect", "Lost opportunities", "Relationship decay"]'),

('The Neutral Acquaintance', 'Low', 'Even', 'Low',
 '["Low need", "Equal power", "Low rapport"]',
 '["Minimal interaction", "Professional courtesy", "Avoid conflict"]',
 '["Unnecessary conflict", "Missed opportunities", "Poor reputation"]'),

('The Supportive Friend', 'Low', 'Low', 'High',
 '["Low need", "They have power", "Good rapport"]',
 '["Maintain friendship", "Offer support", "Build network"]',
 '["One-sided relationship", "Dependency", "Lost opportunities"]'),

('The Distant Contact', 'Low', 'Low', 'Low',
 '["Low need", "They have power", "Low rapport"]',
 '["Minimal interaction", "Professional courtesy", "Avoid conflict"]',
 '["Unnecessary conflict", "Poor reputation", "Missed opportunities"]');
```

## Step 6: Environment Variables

Create a `.env` file in your project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Slack (for later)
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_APP_TOKEN=your-slack-app-token
```

## Step 7: Test Database Connection

Create a simple test script to verify everything works:

```javascript
// test_supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    // Test reading relationship types
    const { data, error } = await supabase
      .from('relationship_types')
      .select('*')
      .limit(3);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful!');
    console.log('Relationship types found:', data.length);
    console.log('Sample relationship type:', data[0]);
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

testConnection();
```

## Next Steps After Setup

1. **Run the test script** to verify connection
2. **Set up authentication** if needed
3. **Create a simple web interface** for testing
4. **Test the AI integration** with a basic scenario

Let me know when you've completed the Supabase setup and I'll help you with the next steps! 