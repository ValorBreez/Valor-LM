-- Valor LM Supabase Schema
-- Supports both AI assistant and training product data tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT,
    role TEXT, -- sales, hr, project_manager, executive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationship types reference table
CREATE TABLE relationship_types (
    id SERIAL PRIMARY KEY,
    type_name TEXT UNIQUE NOT NULL, -- e.g., "The Leveraged Ally"
    desire_level TEXT NOT NULL CHECK (desire_level IN ('High', 'Low')),
    power_level TEXT NOT NULL CHECK (power_level IN ('High', 'Even', 'Low')),
    rapport_level TEXT NOT NULL CHECK (rapport_level IN ('High', 'Low')),
    characteristics JSONB NOT NULL,
    tactical_priorities JSONB NOT NULL,
    warning_signs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User scenarios (for both AI assistant and training)
CREATE TABLE scenarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    relationship_context JSONB NOT NULL, -- stores the 3 dimensions
    identified_type_id INTEGER REFERENCES relationship_types(id),
    ai_advice TEXT,
    user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
    user_feedback_text TEXT,
    is_training_scenario BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI response tracking
CREATE TABLE ai_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    relationship_type_id INTEGER REFERENCES relationship_types(id) NOT NULL,
    ai_advice TEXT NOT NULL,
    response_length INTEGER NOT NULL,
    included_tactics JSONB, -- tracks which tactics were suggested
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
    user_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training course progress
CREATE TABLE training_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    module_name TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER,
    notes TEXT
);

-- Slack/Teams integration tracking
CREATE TABLE integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('slack', 'teams', 'email', 'crm')),
    platform_user_id TEXT NOT NULL,
    workspace_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_user_id)
);

-- Relationship mapping (for team insights)
CREATE TABLE relationship_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    target_person_name TEXT NOT NULL,
    target_person_email TEXT,
    relationship_type_id INTEGER REFERENCES relationship_types(id) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL, -- 'scenario_created', 'ai_advice_given', 'training_completed', etc.
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at);
CREATE INDEX idx_ai_responses_scenario_id ON ai_responses(scenario_id);
CREATE INDEX idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX idx_relationship_mappings_user_id ON relationship_mappings(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own scenarios" ON scenarios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own AI responses" ON ai_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own training progress" ON training_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own integrations" ON integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own relationship mappings" ON relationship_mappings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics events" ON analytics_events FOR ALL USING (auth.uid() = user_id);

-- Public read access for relationship types (reference data)
ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read relationship types" ON relationship_types FOR SELECT USING (true);

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationship_mappings_updated_at BEFORE UPDATE ON relationship_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_scenarios', COUNT(s.id),
        'total_ai_responses', COUNT(ar.id),
        'avg_satisfaction', AVG(ar.user_satisfaction_rating),
        'most_common_relationship_type', rt.type_name,
        'training_progress', COUNT(tp.id)
    ) INTO result
    FROM users u
    LEFT JOIN scenarios s ON u.id = s.user_id
    LEFT JOIN ai_responses ar ON u.id = ar.user_id
    LEFT JOIN training_progress tp ON u.id = tp.user_id
    LEFT JOIN (
        SELECT user_id, relationship_type_id, COUNT(*) as type_count
        FROM ai_responses
        WHERE user_id = user_uuid
        GROUP BY user_id, relationship_type_id
        ORDER BY type_count DESC
        LIMIT 1
    ) most_common ON u.id = most_common.user_id
    LEFT JOIN relationship_types rt ON most_common.relationship_type_id = rt.id
    WHERE u.id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 