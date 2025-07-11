#!/usr/bin/env python3
"""
Test script to validate the enhanced relationship framework
"""

import json
import sys

def load_framework():
    """Load the enhanced framework"""
    try:
        with open('data/enhanced_relationship_framework.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: enhanced_relationship_framework.json not found")
        return None

def analyze_position(desire, power, rapport):
    """Analyze position based on the three variables"""
    if desire == "high" and power == "high" and rapport == "high":
        return "Dominant"
    elif desire == "high" and power == "high" and rapport == "low":
        return "Subjugative"
    elif desire == "high" and power == "even" and rapport == "high":
        return "Collaborative"
    elif desire == "high" and power == "even" and rapport == "low":
        return "Compromising"
    elif desire == "high" and power == "low" and rapport == "high":
        return "Appealing"
    elif desire == "high" and power == "low" and rapport == "low":
        return "Supplicating"
    elif desire == "low" and power == "high" and rapport == "high":
        return "Protective"
    elif desire == "low" and power == "high" and rapport == "low":
        return "Dismissive"
    elif desire == "low" and power == "even" and rapport == "high":
        return "Resistant"
    elif desire == "low" and power == "even" and rapport == "low":
        return "Avoidant"
    elif desire == "low" and power == "low" and rapport == "high":
        return "Defensive"
    elif desire == "low" and power == "low" and rapport == "low":
        return "Accommodating"
    else:
        return "Unknown"

def get_position_guidance(framework, position_type):
    """Get guidance for a specific position type"""
    for template in framework["position_templates"]:
        if template["position_type"] == position_type:
            return template
    return None

def simulate_ai_response(scenario, framework):
    """Simulate how the AI would respond using the framework"""
    print(f"\n=== SCENARIO: {scenario['title']} ===")
    print(f"Description: {scenario['description']}")
    
    # Analyze position
    position = analyze_position(
        scenario['position_analysis']['your_desire'],
        scenario['position_analysis']['your_power'],
        scenario['position_analysis']['rapport']
    )
    
    print(f"\nPOSITION ANALYSIS:")
    print(f"Your Desire: {scenario['position_analysis']['your_desire']}")
    print(f"Your Power: {scenario['position_analysis']['your_power']}")
    print(f"Rapport: {scenario['position_analysis']['rapport']}")
    print(f"Position Type: {position}")
    
    # Get guidance
    guidance = get_position_guidance(framework, position.lower())
    if guidance:
        print(f"\nFRAMEWORK GUIDANCE:")
        print(f"Description: {guidance['description']}")
        print(f"Recommended Approach: {guidance['recommended_approach']}")
        print(f"\nTactical Priorities:")
        for i, priority in enumerate(guidance['tactical_priorities'], 1):
            print(f"{i}. {priority}")
        print(f"\nWarning Signs:")
        for i, warning in enumerate(guidance['warning_signs'], 1):
            print(f"{i}. {warning}")
    else:
        print(f"ERROR: No guidance found for position type '{position}'")
    
    print("\n" + "="*50)

def test_scenarios():
    """Test the framework with various scenarios"""
    framework = load_framework()
    if not framework:
        return
    
    print("TESTING ENHANCED RELATIONSHIP FRAMEWORK")
    print("="*50)
    
    # Test scenarios
    scenarios = [
        {
            "title": "Salary Negotiation",
            "description": "You want a raise but work for a company cutting costs",
            "position_analysis": {
                "your_desire": "high",
                "your_power": "low", 
                "rapport": "low"
            }
        },
        {
            "title": "Client Discount Request",
            "description": "Long-term client wants 20% discount on major project",
            "position_analysis": {
                "your_desire": "low",
                "your_power": "high",
                "rapport": "high"
            }
        },
        {
            "title": "Vendor Payment Terms",
            "description": "Supplier wants to change from net-30 to net-15 terms",
            "position_analysis": {
                "your_desire": "low",
                "your_power": "even",
                "rapport": "low"
            }
        },
        {
            "title": "Partnership Proposal",
            "description": "You want to partner with a company you have good history with",
            "position_analysis": {
                "your_desire": "high",
                "your_power": "even",
                "rapport": "high"
            }
        },
        {
            "title": "Investment Pitch",
            "description": "You want investment from someone you don't know well",
            "position_analysis": {
                "your_desire": "high",
                "your_power": "low",
                "rapport": "high"
            }
        }
    ]
    
    for scenario in scenarios:
        simulate_ai_response(scenario, framework)
    
    print("\nFRAMEWORK VALIDATION COMPLETE")
    print("="*50)

if __name__ == "__main__":
    test_scenarios() 