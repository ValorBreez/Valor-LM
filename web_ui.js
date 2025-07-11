// web_ui.js
// Simple web interface for testing Valor LM AI

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;

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

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valor LM - Professional Relationship Strategist</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        textarea {
            width: 100%;
            height: 120px;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.3s;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .result {
            margin-top: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .result h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .dimensions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .dimension {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e1e5e9;
        }
        
        .dimension h4 {
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .relationship-type {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e1e5e9;
        }
        
        .section h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .section ul {
            list-style: none;
        }
        
        .section li {
            padding: 5px 0;
            position: relative;
            padding-left: 20px;
        }
        
        .section li:before {
            content: "•";
            color: #667eea;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .ai-advice {
            background: #e8f4fd;
            border-left: 4px solid #17a2b8;
            padding: 20px;
            border-radius: 8px;
        }
        
        .ai-advice h4 {
            color: #17a2b8;
            margin-bottom: 10px;
        }
        
        .hidden {
            display: none;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Valor LM</h1>
            <p>Professional Relationship Strategist</p>
        </div>
        
        <div class="content">
            <form id="analysisForm">
                <div class="form-group">
                    <label for="scenario">Describe your professional relationship scenario:</label>
                    <textarea 
                        id="scenario" 
                        name="scenario" 
                        placeholder="Include details about what you want, power dynamics, and your history together. For example: 'I'm a project manager needing budget approval from a skeptical finance colleague who controls the budget but we don't have a close relationship...'"
                        required
                    ></textarea>
                </div>
                
                <button type="submit" class="btn" id="analyzeBtn">
                    🤖 Analyze Relationship
                </button>
            </form>
            
            <div id="loading" class="loading hidden">
                <p>🤖 Analyzing relationship dynamics...</p>
            </div>
            
            <div id="result" class="result hidden">
                <h3>📊 Analysis Results</h3>
                
                <div class="relationship-type">
                    <h4>Relationship Type: <span id="relationshipType"></span></h4>
                </div>
                
                <div class="dimensions" id="dimensions">
                    <!-- Dimensions will be populated here -->
                </div>
                
                <div class="sections">
                    <div class="section">
                        <h4>Characteristics</h4>
                        <ul id="characteristics"></ul>
                    </div>
                    
                    <div class="section">
                        <h4>Tactical Priorities</h4>
                        <ul id="priorities"></ul>
                    </div>
                    
                    <div class="section">
                        <h4>Warning Signs</h4>
                        <ul id="warnings"></ul>
                    </div>
                </div>
                
                <div class="ai-advice">
                    <h4>🤖 AI Advice</h4>
                    <div id="aiAdvice"></div>
                </div>
            </div>
            
            <div id="error" class="error hidden">
                <!-- Error messages will appear here -->
            </div>
        </div>
    </div>

    <script>
        document.getElementById('analysisForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const scenario = document.getElementById('scenario').value.trim();
            if (!scenario) {
                alert('Please describe your scenario');
                return;
            }
            
            // Show loading
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('result').classList.add('hidden');
            document.getElementById('error').classList.add('hidden');
            document.getElementById('analyzeBtn').disabled = true;
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ scenario })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Populate results
                    document.getElementById('relationshipType').textContent = data.relationshipType.name;
                    
                    // Populate dimensions
                    const dimensionsHtml = \`
                        <div class="dimension">
                            <h4>Desire</h4>
                            <p>\${data.analysis.desire}</p>
                        </div>
                        <div class="dimension">
                            <h4>Power</h4>
                            <p>\${data.analysis.power}</p>
                        </div>
                        <div class="dimension">
                            <h4>Rapport</h4>
                            <p>\${data.analysis.rapport}</p>
                        </div>
                    \`;
                    document.getElementById('dimensions').innerHTML = dimensionsHtml;
                    
                    // Populate characteristics
                    const characteristicsHtml = data.relationshipType.characteristics
                        .map(c => \`<li>\${c}</li>\`)
                        .join('');
                    document.getElementById('characteristics').innerHTML = characteristicsHtml;
                    
                    // Populate priorities
                    const prioritiesHtml = data.relationshipType.tactical_priorities
                        .map(p => \`<li>\${p}</li>\`)
                        .join('');
                    document.getElementById('priorities').innerHTML = prioritiesHtml;
                    
                    // Populate warnings
                    const warningsHtml = data.relationshipType.warning_signs
                        .map(w => \`<li>\${w}</li>\`)
                        .join('');
                    document.getElementById('warnings').innerHTML = warningsHtml;
                    
                    // Populate AI advice
                    document.getElementById('aiAdvice').innerHTML = data.aiAdvice.replace(/\\n/g, '<br>');
                    
                    // Show results
                    document.getElementById('result').classList.remove('hidden');
                } else {
                    throw new Error(data.error || 'Analysis failed');
                }
            } catch (error) {
                document.getElementById('error').innerHTML = \`Error: \${error.message}\`;
                document.getElementById('error').classList.remove('hidden');
            } finally {
                // Hide loading
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('analyzeBtn').disabled = false;
            }
        });
    </script>
</body>
</html>
  `);
});

app.post('/analyze', async (req, res) => {
  try {
    const { scenario } = req.body;
    
    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }
    
    // Analyze the context to determine dimensions
    const analysis = await analyzeRelationshipContext(scenario);
    
    // Determine relationship type
    const relationshipType = determineRelationshipType(analysis.desire, analysis.power, analysis.rapport);
    
    // Generate AI advice
    const aiAdvice = await generateAIAdvice(relationshipType, scenario, analysis);
    
    // Save to Supabase if available
    try {
      await supabase
        .from('scenarios')
        .insert({
          user_id: 'web-ui-user',
          title: `Web UI Test - ${relationshipType.name}`,
          description: scenario,
          relationship_context: {
            desire: analysis.desire,
            power: analysis.power,
            rapport: analysis.rapport,
            reasoning: analysis.reasoning
          },
          ai_advice: aiAdvice
        });
    } catch (error) {
      console.log('Could not save to database:', error.message);
    }
    
    res.json({
      analysis,
      relationshipType,
      aiAdvice
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Valor LM Web UI running at http://localhost:${port}`);
}); 