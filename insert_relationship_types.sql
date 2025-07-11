-- Insert the 12 Valor LM relationship types
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