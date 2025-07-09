import requests
import json

# Test the conversation flow
base_url = "http://127.0.0.1:8080"

def test_conversation():
    # Start a new conversation
    session = requests.Session()
    
    # Initial question (already states desire)
    print("=== Step 1: Initial Question (Already States Desire) ===")
    response1 = session.post(f"{base_url}/ask", 
                           json={"question": "I want to ask my boss for a raise"})
    data1 = response1.json()
    print(f"AI Response: {data1['response']}")
    print()
    
    # Answer the second question (their desire)
    print("=== Step 2: Answering Their Desire Question ===")
    response2 = session.post(f"{base_url}/ask", 
                           json={"question": "They want me to keep working hard and not cause problems"})
    data2 = response2.json()
    print(f"AI Response: {data2['response']}")
    print()
    
    # Answer the respect question
    print("=== Step 3: Answering Respect Question ===")
    response3 = session.post(f"{base_url}/ask", 
                           json={"question": "I respect them as a manager, they respect my work ethic"})
    data3 = response3.json()
    print(f"AI Response: {data3['response']}")
    print()
    
    # Answer the aid question
    print("=== Step 4: Answering Aid Question ===")
    response4 = session.post(f"{base_url}/ask", 
                           json={"question": "I can help by working harder and taking on more tasks, they can help by giving me a raise and promotion"})
    data4 = response4.json()
    print(f"AI Response: {data4['response']}")
    print()
    
    # Answer the harm question
    print("=== Step 5: Answering Harm Question ===")
    response5 = session.post(f"{base_url}/ask", 
                           json={"question": "I could harm by quitting or slacking off, they could harm by firing me or denying my raise"})
    data5 = response5.json()
    print(f"AI Response: {data5['response']}")
    print()
    
    # Answer the rapport question
    print("=== Step 6: Answering Rapport Question ===")
    response6 = session.post(f"{base_url}/ask", 
                           json={"question": "We have a good working relationship, I've been here 2 years and they trust me"})
    data6 = response6.json()
    print(f"AI Response: {data6['response']}")
    print()

if __name__ == "__main__":
    test_conversation() 