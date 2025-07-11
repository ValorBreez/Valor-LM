// update_schema.js - Update Supabase schema with new tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateSchema() {
  try {
    console.log('🔄 Updating Supabase schema...');
    
    // Create feedback table
    const { error: feedbackError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('helpful', 'not-helpful', 'neutral')),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          scenario_id INTEGER REFERENCES scenarios(id),
          relationship_type VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
        CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
      `
    });
    
    if (feedbackError) {
      console.log('⚠️  Feedback table might already exist:', feedbackError.message);
    } else {
      console.log('✅ Feedback table created successfully');
    }
    
    console.log('🎉 Schema update completed!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

updateSchema(); 