#!/usr/bin/env python3
"""
Test script to demonstrate Firebase functionality
Shows how new agents can interact with the initialized database
"""
import json
import requests
from datetime import datetime
import time

# Firebase URL
FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"

def display_welcome_messages():
    """Display welcome messages for new agents"""
    print("\n=== WELCOME TO SARTOR CLAUDE NETWORK ===\n")

    response = requests.get(f"{FIREBASE_URL}/messages/welcome.json")
    if response.status_code == 200:
        messages = response.json() or {}
        for msg_id, msg in messages.items():
            if "content" in msg:
                content = msg["content"]
                print(f"📢 {content.get('title', 'Message')}")
                print(f"   {content.get('message', '')}\n")
                if "values" in content:
                    print("   Core Values:")
                    for value in content["values"]:
                        print(f"   • {value}")
                    print()

def show_available_tasks():
    """Display tasks available for agents to claim"""
    print("\n=== AVAILABLE TASKS ===\n")

    response = requests.get(f"{FIREBASE_URL}/tasks/available.json")
    if response.status_code == 200:
        tasks = response.json() or {}
        for task_id, task in tasks.items():
            print(f"📋 Task: {task['title']}")
            print(f"   ID: {task_id}")
            print(f"   Type: {task['type']}")
            print(f"   Priority: {task['priority']}")
            print(f"   Difficulty: {task['difficulty']}")
            print(f"   Description: {task['description']}")
            print(f"   Requirements: {', '.join(task['requirements'])}")
            if "rewards" in task:
                print(f"   Rewards: {task['rewards'].get('experience_points', 0)} XP")
            print()

def show_active_agents():
    """Display currently registered agents"""
    print("\n=== ACTIVE AGENTS ===\n")

    response = requests.get(f"{FIREBASE_URL}/agents.json")
    if response.status_code == 200:
        agents = response.json() or {}
        for agent_id, agent in agents.items():
            if "agent_name" in agent:  # Skip malformed entries
                status_emoji = "🟢" if agent.get("status") == "online" else "🔴"
                print(f"{status_emoji} {agent['agent_name']}")
                print(f"   ID: {agent_id}")
                print(f"   Specialization: {agent.get('specialization', 'general')}")
                print(f"   Capabilities: {', '.join(agent.get('capabilities', []))}")
                print(f"   Status: {agent.get('status', 'unknown')}")
                print(f"   Location: {agent.get('location', 'unknown')}")
                print()

def show_skills():
    """Display available skills in the library"""
    print("\n=== SKILL LIBRARY ===\n")

    response = requests.get(f"{FIREBASE_URL}/skills.json")
    if response.status_code == 200:
        skills = response.json() or {}

        # Group by category
        categories = {}
        for skill_id, skill in skills.items():
            category = skill.get("category", "uncategorized")
            if category not in categories:
                categories[category] = []
            categories[category].append(skill)

        for category, skills_list in sorted(categories.items()):
            print(f"📚 {category.upper()} Skills:")
            for skill in skills_list:
                difficulty_emoji = {"beginner": "🟢", "intermediate": "🟡", "advanced": "🔴"}.get(skill.get("difficulty"), "⚪")
                print(f"   {difficulty_emoji} {skill['name']} (v{skill.get('version', '1.0.0')})")
                print(f"      {skill.get('description', '')}")
            print()

def show_onboarding_checklist():
    """Display onboarding checklist for new agents"""
    print("\n=== ONBOARDING CHECKLIST ===\n")

    response = requests.get(f"{FIREBASE_URL}/onboarding/checklist.json")
    if response.status_code == 200:
        checklist_data = response.json() or {}
        steps = checklist_data.get("steps", [])

        print("Complete these steps to get started:\n")
        for step in sorted(steps, key=lambda x: x.get("order", 0)):
            required = "✅" if step.get("required") else "⭕"
            print(f"{required} Step {step.get('order', 0)}: {step.get('title', '')}")
            print(f"   {step.get('description', '')}")
            print(f"   Points: {step.get('points', 0)}")
            print()

        if "metadata" in checklist_data:
            meta = checklist_data["metadata"]
            print(f"Total Points Available: {meta.get('total_points', 0)}")
            print(f"Required Points: {meta.get('required_points', 0)}")

def simulate_new_agent():
    """Simulate a new agent joining the network"""
    print("\n=== SIMULATING NEW AGENT JOIN ===\n")

    # Generate unique agent ID
    agent_id = f"test-agent-{int(time.time())}"

    # Register the agent
    agent_data = {
        "agent_id": agent_id,
        "agent_name": "Test Agent Alpha",
        "status": "online",
        "health": "healthy",
        "capabilities": ["observe", "report"],
        "specialization": "testing",
        "surface": "cli",
        "location": "test-environment",
        "role": "tester",
        "description": "Test agent demonstrating registration",
        "last_heartbeat": datetime.now().isoformat(),
        "registered_at": datetime.now().isoformat(),
        "last_seen": datetime.now().isoformat(),
        "metadata": {
            "version": "1.0.0",
            "test_agent": True
        },
        "task_count": 0,
        "error_count": 0,
        "success_rate": 0.0
    }

    print(f"📝 Registering agent: {agent_id}")
    response = requests.put(
        f"{FIREBASE_URL}/agents/{agent_id}.json",
        json=agent_data
    )

    if response.status_code == 200:
        print("✅ Agent registered successfully!")

        # Send a hello message
        message = {
            "id": f"msg-{agent_id}-hello",
            "from": agent_id,
            "to": "all_agents",
            "type": "broadcast",
            "priority": "normal",
            "content": {
                "message": f"Hello! I'm {agent_data['agent_name']}, a new {agent_data['specialization']} agent.",
                "capabilities": agent_data["capabilities"]
            },
            "timestamp": datetime.now().isoformat(),
            "status": "sent"
        }

        print(f"💬 Sending hello message...")
        msg_response = requests.post(
            f"{FIREBASE_URL}/messages.json",
            json=message
        )

        if msg_response.status_code == 200:
            print("✅ Message sent successfully!")

        # Clean up test agent
        print(f"🧹 Cleaning up test agent...")
        time.sleep(2)  # Let it exist for a moment
        cleanup = requests.delete(f"{FIREBASE_URL}/agents/{agent_id}.json")
        if cleanup.status_code == 200:
            print("✅ Test agent removed")
    else:
        print(f"❌ Registration failed: {response.status_code}")

def main():
    """Main function to run all demonstrations"""
    print("\n" + "="*60)
    print("    FIREBASE INITIALIZATION TEST & DEMONSTRATION")
    print("="*60)

    # Display all the initialized data
    display_welcome_messages()
    show_active_agents()
    show_available_tasks()
    show_skills()
    show_onboarding_checklist()

    # Simulate a new agent joining
    simulate_new_agent()

    print("\n" + "="*60)
    print("    TEST COMPLETE - FIREBASE IS READY!")
    print("="*60)
    print("\nNew agents can now:")
    print("  1. Read welcome messages at /messages/welcome")
    print("  2. Register at /agents/{agent_id}")
    print("  3. Claim tasks from /tasks/available")
    print("  4. Access skills from /skills")
    print("  5. Learn from /knowledge")
    print("  6. Follow /onboarding/checklist")
    print("\nFirebase URL: https://home-claude-network-default-rtdb.firebaseio.com/")
    print("\n")

if __name__ == "__main__":
    main()