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

// Enhanced AI advice generation with better formatting
async function generateAIAdvice(relationshipType, context, analysis) {
  const prompt = `You are Valor LM, an AI relationship strategist. Analyze this professional relationship:

Relationship Type: ${relationshipType.name}
Context: ${context}
Analysis: ${analysis.reasoning}

Provide structured, tactical advice in this exact format:

🧠 STRATEGIC ADVICE
[2-3 strategic insights about the relationship type]

⚠️ RISKS TO WATCH
[2-3 specific risks or pitfalls to avoid]

🔧 TACTICAL SUGGESTIONS
[3-4 specific, actionable steps to take]

Keep each section concise (1-2 sentences per point). Focus on practical, actionable advice.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
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
            max-width: 900px;
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
            margin-right: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .loading {
            text-align: center;
            padding: 30px;
            color: #666;
        }
        
        .loading .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        
        .relationship-type {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .relationship-type h4 {
            font-size: 1.4rem;
            margin-bottom: 5px;
        }
        
        .relationship-type .type-name {
            font-size: 1.8rem;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
            text-align: center;
        }
        
        .dimension h4 {
            color: #667eea;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .dimension p {
            font-weight: bold;
            font-size: 1.1rem;
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
            margin-bottom: 20px;
        }
        
        .ai-advice h4 {
            color: #17a2b8;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .advice-section {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 6px;
        }
        
        .advice-section h5 {
            color: #333;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .advice-section p {
            color: #666;
            line-height: 1.5;
        }
        
        .feedback-section {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e1e5e9;
        }
        
        .feedback-section h5 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .feedback-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .feedback-btn {
            padding: 10px 20px;
            border: 2px solid #e1e5e9;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        
        .feedback-btn:hover {
            border-color: #667eea;
            background: #f8f9fa;
        }
        
        .feedback-btn.liked {
            border-color: #28a745;
            background: #d4edda;
            color: #155724;
        }
        
        .feedback-btn.disliked {
            border-color: #dc3545;
            background: #f8d7da;
            color: #721c24;
        }
        
        .examples-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e1e5e9;
        }
        
        .examples-section h5 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .example-btn {
            display: inline-block;
            margin: 5px;
            padding: 8px 15px;
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .example-btn:hover {
            border-color: #667eea;
            background: #f8f9fa;
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
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            text-align: center;
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
            <div class="examples-section">
                <h5>💡 Try a sample scenario:</h5>
                <button class="example-btn" onclick="loadExample('karen')">Karen (Finance Blocking Budget)</button>
                <button class="example-btn" onclick="loadExample('marcus')">Marcus (Competitive Colleague)</button>
                <button class="example-btn" onclick="loadExample('sarah')">Sarah (Mentor Relationship)</button>
            </div>
            
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
                <button type="button" class="btn btn-secondary" onclick="clearForm()">
                    🗑️ Clear
                </button>
            </form>
            
            <div id="loading" class="loading hidden">
                <div class="spinner"></div>
                <p>🤖 Valor is analyzing your relationship dynamics...</p>
            </div>
            
            <div id="result" class="result hidden">
                <h3>📊 Analysis Results</h3>
                
                <div class="relationship-type">
                    <h4>Relationship Type:</h4>
                    <div class="type-name" id="relationshipType"></div>
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
                    <h4>🤖 AI Strategic Advice</h4>
                    <div id="aiAdvice"></div>
                </div>
                
                <div class="feedback-section">
                    <h5>Was this analysis helpful?</h5>
                    <div class="feedback-buttons">
                        <button class="feedback-btn" onclick="submitFeedback('helpful')">👍 Helpful</button>
                        <button class="feedback-btn" onclick="submitFeedback('not-helpful')">👎 Not Helpful</button>
                        <button class="feedback-btn" onclick="submitFeedback('neutral')">😐 Neutral</button>
                    </div>
                    <div id="feedbackMessage"></div>
                </div>
            </div>
            
            <div id="error" class="error hidden">
                <!-- Error messages will appear here -->
            </div>
        </div>
    </div>

    <script>
        // Example scenarios
        const examples = {
            karen: "I'm a project manager overseeing a cross-functional team. One of the key stakeholders, Karen from the finance department, is blocking our proposal to increase marketing spend. She controls the budget and has veto power, but we don't have a close working relationship. I need her approval to move forward with our strategy.",
            marcus: "I'm competing with Marcus for a promotion to senior manager. We're both equally qualified, but Marcus has been here longer and has better relationships with the leadership team. I need to position myself strategically while maintaining professionalism. The decision will be made in 3 months.",
            sarah: "Sarah is my mentor and has been incredibly supportive of my career growth. She's a senior director and has significant influence in the company. I want to continue building this relationship and potentially get her support for a new role I'm interested in."
        };
        
        function loadExample(type) {
            document.getElementById('scenario').value = examples[type];
        }
        
        function clearForm() {
            document.getElementById('scenario').value = '';
            document.getElementById('result').classList.add('hidden');
            document.getElementById('error').classList.add('hidden');
        }
        
        function submitFeedback(type) {
            const buttons = document.querySelectorAll('.feedback-btn');
            buttons.forEach(btn => {
                btn.classList.remove('liked', 'disliked');
            });
            
            const clickedBtn = event.target;
            if (type === 'helpful') {
                clickedBtn.classList.add('liked');
            } else if (type === 'not-helpful') {
                clickedBtn.classList.add('disliked');
            }
            
            // Show success message
            const messageDiv = document.getElementById('feedbackMessage');
            messageDiv.innerHTML = '<div class="success-message">Thank you for your feedback! 💙</div>';
            
            // Save feedback to database (if available)
            saveFeedback(type);
        }
        
        async function saveFeedback(type) {
            try {
                await fetch('/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        feedback: type,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.log('Could not save feedback:', error);
            }
        }
        
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
                    
                    // Format and populate AI advice
                    const adviceText = data.aiAdvice;
                    const formattedAdvice = formatAdvice(adviceText);
                    document.getElementById('aiAdvice').innerHTML = formattedAdvice;
                    
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
        
        function formatAdvice(adviceText) {
            // Split the advice into sections and format them
            const sections = adviceText.split('\\n\\n');
            let formattedHtml = '';
            
            sections.forEach(section => {
                if (section.trim()) {
                    const lines = section.split('\\n');
                    const title = lines[0];
                    const content = lines.slice(1).join('\\n');
                    
                    formattedHtml += \`
                        <div class="advice-section">
                            <h5>\${title}</h5>
                            <p>\${content.replace(/\\n/g, '<br>')}</p>
                        </div>
                    \`;
                }
            });
            
            return formattedHtml;
        }
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

// Add feedback endpoint
app.post('/feedback', async (req, res) => {
  try {
    const { feedback, timestamp } = req.body;
    
    // Save feedback to Supabase if available
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          feedback_type: feedback,
          timestamp: timestamp,
          user_id: 'web-ui-user'
        });
      
      if (error) {
        console.log('Could not save feedback to database:', error.message);
        // Continue anyway - feedback is optional
      }
    } catch (error) {
      console.log('Could not save feedback to database:', error.message);
      // Continue anyway - feedback is optional
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Could not save feedback' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Valor LM Web UI running at http://localhost:${port}`);
}); 