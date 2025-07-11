// Valor LM Slack Bot Starter
// Implements /valor check @user command flow

const { App } = require('@slack/bolt');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize clients
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Valor LM Framework Data
const RELATIONSHIP_TYPES = {
  "High-High-High": {
    name: "The Leveraged Ally",
    characteristics: ["Strong mutual benefit", "High trust", "Clear power advantage"],
    tactical_priorities: ["Maintain rapport", "Leverage influence strategically", "Build long-term partnership"],
    warning_signs: ["Over-reliance", "Power abuse", "Neglected relationship maintenance"]
  },
  "High-High-Low": {
    name: "The Reluctant Resource",
    characteristics: ["You need something", "You have power", "Low trust/rapport"],
    tactical_priorities: ["Build rapport gradually", "Use power carefully", "Create mutual benefit"],
    warning_signs: ["Resistance", "Resentment", "Power backlash"]
  },
  "High-Even-High": {
    name: "The Collaborative Partner",
    characteristics: ["Mutual need", "Equal power", "Good rapport"],
    tactical_priorities: ["Collaborate openly", "Share information", "Build trust"],
    warning_signs: ["Competition", "Hidden agendas", "Trust breakdown"]
  },
  "High-Even-Low": {
    name: "The Stalemate",
    characteristics: ["Mutual need", "Equal power", "Low rapport"],
    tactical_priorities: ["Find common ground", "Build trust slowly", "Create small wins"],
    warning_signs: ["Gridlock", "Escalating conflict", "No progress"]
  },
  "High-Low-High": {
    name: "The Benevolent Patron",
    characteristics: ["You need something", "They have power", "Good rapport"],
    tactical_priorities: ["Appeal to goodwill", "Show value", "Maintain relationship"],
    warning_signs: ["Dependency", "Charity fatigue", "Power imbalance"]
  },
  "High-Low-Low": {
    name: "The Desperate Seeker",
    characteristics: ["You need something", "They have power", "Low rapport"],
    tactical_priorities: ["Build rapport urgently", "Show value", "Find leverage"],
    warning_signs: ["Desperation", "Rejection", "No leverage"]
  },
  "Low-High-High": {
    name: "The Valued Mentor",
    characteristics: ["Low need", "You have power", "Good rapport"],
    tactical_priorities: ["Maintain relationship", "Offer value", "Build network"],
    warning_signs: ["Neglect", "One-sided relationship", "Lost opportunity"]
  },
  "Low-High-Low": {
    name: "The Unwanted Authority",
    characteristics: ["Low need", "You have power", "Low rapport"],
    tactical_priorities: ["Minimize interaction", "Avoid conflict", "Maintain boundaries"],
    warning_signs: ["Resentment", "Power struggles", "Unnecessary conflict"]
  },
  "Low-Even-High": {
    name: "The Trusted Peer",
    characteristics: ["Low need", "Equal power", "Good rapport"],
    tactical_priorities: ["Maintain friendship", "Share information", "Support each other"],
    warning_signs: ["Neglect", "Lost opportunities", "Relationship decay"]
  },
  "Low-Even-Low": {
    name: "The Neutral Acquaintance",
    characteristics: ["Low need", "Equal power", "Low rapport"],
    tactical_priorities: ["Minimal interaction", "Professional courtesy", "Avoid conflict"],
    warning_signs: ["Unnecessary conflict", "Missed opportunities", "Poor reputation"]
  },
  "Low-Low-High": {
    name: "The Supportive Friend",
    characteristics: ["Low need", "They have power", "Good rapport"],
    tactical_priorities: ["Maintain friendship", "Offer support", "Build network"],
    warning_signs: ["One-sided relationship", "Dependency", "Lost opportunities"]
  },
  "Low-Low-Low": {
    name: "The Distant Contact",
    characteristics: ["Low need", "They have power", "Low rapport"],
    tactical_priorities: ["Minimal interaction", "Professional courtesy", "Avoid conflict"],
    warning_signs: ["Unnecessary conflict", "Poor reputation", "Missed opportunities"]
  }
};

// Helper function to determine relationship type
function determineRelationshipType(desire, power, rapport) {
  const key = `${desire}-${power}-${rapport}`;
  return RELATIONSHIP_TYPES[key] || RELATIONSHIP_TYPES["Low-Low-Low"];
}

// Helper function to generate AI advice
async function generateAIAdvice(relationshipType, context) {
  const prompt = `You are Valor LM, an AI relationship strategist. Analyze this professional relationship:

Relationship Type: ${relationshipType.name}
Context: ${context}

Provide concise, tactical advice (max 100 words) that:
1. Acknowledges the relationship type
2. Suggests specific tactical approaches
3. Warns about potential pitfalls
4. Focuses on positional improvement

Format as bullet points.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "Unable to generate advice at this time. Please try again.";
  }
}

// Main slash command handler
app.command('/valor', async ({ command, ack, respond }) => {
  await ack();

  const text = command.text.trim();
  
  if (!text.startsWith('check')) {
    await respond({
      text: "Available commands:\n• `/valor check @user` - Analyze relationship with user\n• `/valor help` - Show available commands"
    });
    return;
  }

  // Extract user mention
  const userMatch = text.match(/check\s+<@([A-Z0-9]+)>/);
  if (!userMatch) {
    await respond({
      text: "Usage: `/valor check @username` - Mention the user you want to analyze"
    });
    return;
  }

  const targetUserId = userMatch[1];
  const requestingUserId = command.user_id;

  try {
    // Get user info from Slack
    const userInfo = await app.client.users.info({
      user: targetUserId
    });

    const targetUserName = userInfo.user.real_name || userInfo.user.name;
    
    // For demo purposes, we'll use a simple relationship analysis
    // In production, this would analyze message history, interactions, etc.
    const relationshipAnalysis = await analyzeRelationship(requestingUserId, targetUserId, targetUserName);
    
    // Generate AI advice
    const aiAdvice = await generateAIAdvice(relationshipAnalysis.type, relationshipAnalysis.context);
    
    // Save to Supabase
    await saveAnalysisToSupabase(command.user_id, targetUserId, relationshipAnalysis, aiAdvice);

    // Format response
    const response = formatResponse(relationshipAnalysis, aiAdvice, targetUserName);
    
    await respond({
      text: response,
      unfurl_links: false
    });

  } catch (error) {
    console.error('Error processing valor command:', error);
    await respond({
      text: "Sorry, I encountered an error analyzing the relationship. Please try again."
    });
  }
});

// Helper function to analyze relationship (simplified for demo)
async function analyzeRelationship(requestingUserId, targetUserId, targetUserName) {
  // In production, this would analyze:
  // - Message history between users
  // - Interaction frequency and quality
  // - Power dynamics (roles, seniority)
  // - Previous relationship classifications
  
  // For demo, we'll use a simple heuristic
  const isSameUser = requestingUserId === targetUserId;
  if (isSameUser) {
    return {
      type: RELATIONSHIP_TYPES["Low-Low-Low"],
      context: "Self-analysis requested",
      confidence: 0.5
    };
  }

  // Simple demo logic - in production this would be much more sophisticated
  const randomFactor = Math.random();
  
  if (randomFactor < 0.3) {
    return {
      type: RELATIONSHIP_TYPES["High-Even-High"],
      context: `Collaborative relationship with ${targetUserName}. Good rapport, mutual benefit.`,
      confidence: 0.7
    };
  } else if (randomFactor < 0.6) {
    return {
      type: RELATIONSHIP_TYPES["High-High-Low"],
      context: `You need something from ${targetUserName} and have some power, but rapport is low.`,
      confidence: 0.6
    };
  } else {
    return {
      type: RELATIONSHIP_TYPES["Low-Even-High"],
      context: `Good rapport with ${targetUserName} but low immediate need.`,
      confidence: 0.8
    };
  }
}

// Helper function to save analysis to Supabase
async function saveAnalysisToSupabase(userId, targetUserId, analysis, aiAdvice) {
  try {
    // First, ensure user exists in our database
    const { data: user } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: `${userId}@slack.workspace`, // Placeholder
        full_name: 'Slack User' // Would get from Slack API
      })
      .select()
      .single();

    // Save the scenario
    const { data: scenario } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        title: `Relationship Analysis with ${targetUserId}`,
        description: analysis.context,
        relationship_context: {
          desire: analysis.type.name.includes('High') ? 'High' : 'Low',
          power: analysis.type.name.includes('High Power') ? 'High' : 
                 analysis.type.name.includes('Low Power') ? 'Low' : 'Even',
          rapport: analysis.type.name.includes('High Rapport') ? 'High' : 'Low'
        },
        ai_advice: aiAdvice
      })
      .select()
      .single();

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'slack_analysis_requested',
        event_data: {
          target_user_id: targetUserId,
          relationship_type: analysis.type.name,
          confidence: analysis.confidence
        }
      });

  } catch (error) {
    console.error('Supabase save error:', error);
    // Don't fail the command if analytics fail
  }
}

// Helper function to format response
function formatResponse(analysis, aiAdvice, targetUserName) {
  return `🔍 *Valor LM Analysis: ${targetUserName}*

*Relationship Type:* ${analysis.type.name}
*Confidence:* ${Math.round(analysis.confidence * 100)}%

*Characteristics:*
${analysis.type.characteristics.map(c => `• ${c}`).join('\n')}

*Tactical Priorities:*
${analysis.type.tactical_priorities.map(p => `• ${p}`).join('\n')}

*AI Advice:*
${aiAdvice}

*Warning Signs:*
${analysis.type.warning_signs.map(w => `• ${w}`).join('\n')}`;
}

// Help command
app.command('/valor', async ({ command, ack, respond }) => {
  const text = command.text.trim();
  
  if (text === 'help') {
    await ack();
    await respond({
      text: `*Valor LM - Professional Relationship Strategist*

*Available Commands:*
• \`/valor check @username\` - Analyze your relationship with a user
• \`/valor help\` - Show this help message

*What Valor LM Does:*
• Analyzes relationship dynamics using our proprietary framework
• Identifies relationship type based on Desire, Power, and Rapport
• Provides tactical advice for improving your position
• Tracks relationship insights over time

*Relationship Types Include:*
• The Leveraged Ally (High Desire, High Power, High Rapport)
• The Reluctant Resource (High Desire, High Power, Low Rapport)
• The Collaborative Partner (High Desire, Even Power, High Rapport)
• And 9 more relationship archetypes...

*Privacy:* All analysis is private and only visible to you.`
    });
  }
});

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡ Valor LM Slack bot is running!');
})();

module.exports = { app, RELATIONSHIP_TYPES, determineRelationshipType, generateAIAdvice }; 