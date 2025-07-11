// cli_test.js
// Intelligent CLI interface that analyzes context and determines relationship dimensions

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const readline = require('readline');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Valor LM Framework Data (same as in slack_bot_starter.js)
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

// AI function to analyze relationship context and determine dimensions
async function analyzeRelationshipContext(context) {
  const prompt = `You are Valor LM, an AI relationship strategist. Analyze this professional relationship scenario and determine the three key dimensions:

CONTEXT: ${context}

ANALYZE and return ONLY a JSON object with these exact fields:
{
  "desire": "High" or "Low" - How much the person wants something from the relationship,
  "power": "High", "Even", or "Low" - Relative power dynamics between parties,
  "rapport": "High" or "Low" - Level of trust and connection,
  "reasoning": "Brief explanation of your analysis"
}

Consider:
- DESIRE: What do they want? How much do they need this person?
- POWER: Who has more leverage? Authority? Resources? Influence?
- RAPPORT: What's their history? Trust level? Communication quality?

Return ONLY the JSON object, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse JSON response");
  } catch (error) {
    console.error('Error analyzing context:', error);
    return {
      desire: "Low",
      power: "Even", 
      rapport: "Low",
      reasoning: "Default analysis due to error"
    };
  }
}

// Helper function to generate AI advice
async function generateAIAdvice(relationshipType, context, analysis) {
  const prompt = `You are Valor LM, an AI relationship strategist. Analyze this professional relationship:

Relationship Type: ${relationshipType.name}
Context: ${context}
Analysis: ${analysis.reasoning}

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

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function runCLI() {
  console.log('\n🔍 Valor LM - Professional Relationship Strategist');
  console.log('================================================\n');
  
  console.log('Describe your professional relationship scenario:');
  console.log('(Include details about what you want, power dynamics, and your history together)\n');
  
  try {
    // Get relationship context from user
    const context = await askQuestion('Describe the situation: ');
    
    console.log('\n🤖 Analyzing relationship dynamics...\n');
    
    // Analyze the context to determine dimensions
    const analysis = await analyzeRelationshipContext(context);
    
    // Determine relationship type
    const relationshipType = determineRelationshipType(analysis.desire, analysis.power, analysis.rapport);
    
    console.log('📊 Analysis Results:');
    console.log('===================');
    console.log(`Relationship Type: ${relationshipType.name}`);
    console.log(`Dimensions: ${analysis.desire} Desire, ${analysis.power} Power, ${analysis.rapport} Rapport`);
    console.log(`Reasoning: ${analysis.reasoning}\n`);
    
    console.log('Characteristics:');
    relationshipType.characteristics.forEach(c => console.log(`• ${c}`));
    
    console.log('\nTactical Priorities:');
    relationshipType.tactical_priorities.forEach(p => console.log(`• ${p}`));
    
    console.log('\nWarning Signs:');
    relationshipType.warning_signs.forEach(w => console.log(`• ${w}`));
    
    // Generate AI advice
    console.log('\n🤖 AI Advice:');
    console.log('============');
    const aiAdvice = await generateAIAdvice(relationshipType, context, analysis);
    console.log(aiAdvice);
    
    // Save to Supabase if available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        await supabase
          .from('scenarios')
          .insert({
            user_id: 'cli-test-user',
            title: `CLI Test - ${relationshipType.name}`,
            description: context,
            relationship_context: {
              desire: analysis.desire,
              power: analysis.power,
              rapport: analysis.rapport,
              reasoning: analysis.reasoning
            },
            ai_advice: aiAdvice
          });
        console.log('\n✅ Analysis saved to database');
      } catch (error) {
        console.log('\n⚠️  Could not save to database (this is normal for CLI testing)');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Check if required environment variables are set
if (!process.env.OPENAI_API_KEY) {
  console.log('❌ OpenAI API key not found in environment variables');
  console.log('Please set OPENAI_API_KEY in your .env file');
  process.exit(1);
}

runCLI(); 