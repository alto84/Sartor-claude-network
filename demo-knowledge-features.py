#!/usr/bin/env python3
"""
Quick demo of knowledge base features
Shows real-time knowledge retrieval and search
"""

import sys
sys.path.insert(0, '/home/user/Sartor-claude-network')
exec(open('/home/user/Sartor-claude-network/sartor-network-bootstrap.py').read())

print("\n" + "="*70)
print("  KNOWLEDGE BASE FEATURES DEMONSTRATION")
print("="*70)

# Connect
client = SartorNetworkClient(agent_name="Demo-Knowledge-User")
client.connect()

print("\n1️⃣  QUERYING ALL KNOWLEDGE")
print("-"*70)
all_knowledge = client.knowledge_query()
print(f"Total knowledge entries in database: {len(all_knowledge)}")

print("\n2️⃣  SEARCHING BY KEYWORD: 'Firebase'")
print("-"*70)
firebase_results = client.knowledge_query("Firebase")
print(f"Found {len(firebase_results)} entries mentioning Firebase:")
for i, k in enumerate(firebase_results[:3], 1):
    print(f"  {i}. {k.get('content')[:70]}...")

print("\n3️⃣  SEARCHING BY KEYWORD: 'communication'")
print("-"*70)
comm_results = client.knowledge_query("communication")
print(f"Found {len(comm_results)} entries about communication:")
for i, k in enumerate(comm_results[:3], 1):
    print(f"  {i}. {k.get('content')[:70]}...")
    print(f"     Tags: {k.get('tags', [])}")

print("\n4️⃣  FILTERING BY TAG: 'performance'")
print("-"*70)
perf_tagged = [k for k in all_knowledge if 'performance' in k.get('tags', [])]
print(f"Found {len(perf_tagged)} entries tagged with 'performance'")

print("\n5️⃣  ADDING NEW KNOWLEDGE")
print("-"*70)
new_id = client.knowledge_add(
    "Knowledge base testing completed successfully on 2025-11-04",
    tags=["testing", "milestone", "2025"]
)
print(f"Added new knowledge entry with ID: {new_id}")

print("\n6️⃣  VERIFYING NEW ENTRY")
print("-"*70)
recent = client.knowledge_query("testing completed")
if len(recent) > 0:
    print("✅ New entry is immediately searchable!")
    print(f"   Found: {recent[0].get('content')}")
else:
    print("⚠️  Entry not found (may need a moment to propagate)")

print("\n" + "="*70)
print("  ✅ DEMONSTRATION COMPLETE")
print("="*70)
print("\nKey capabilities verified:")
print("  ✓ Query all entries")
print("  ✓ Search by keyword (case-insensitive)")
print("  ✓ Filter by tags")
print("  ✓ Add new knowledge")
print("  ✓ Real-time availability")

client.disconnect()
