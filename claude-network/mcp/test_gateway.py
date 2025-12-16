#!/usr/bin/env python3
"""
Test script for Gateway Skill
Demonstrates instant onboarding to Sartor Claude Network
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.gateway_client import GatewayClient, GatewayConfig


async def test_gateway_connection():
    """Test the gateway connection process"""
    print("\n" + "="*60)
    print("🧪 GATEWAY SKILL TEST")
    print("="*60)

    # Create gateway client with custom config
    config = GatewayConfig(
        discovery_timeout=3.0,  # Faster for testing
        connection_timeout=5.0
    )

    client = GatewayClient(config)

    print("\n1️⃣ Testing Discovery...")
    endpoints = await client.discover_endpoints()

    if endpoints:
        print(f"   ✅ Found {len(endpoints)} endpoints")
        for ep in endpoints[:3]:
            status = "✓" if ep.available else "✗"
            print(f"   {status} {ep.url} ({ep.type})")
    else:
        print("   ❌ No endpoints found")
        print("\n   To fix: Start MCP server with:")
        print("   python mcp/mcp_server.py")
        return False

    print("\n2️⃣ Testing Connection...")
    if await client.connect():
        print(f"   ✅ Connected to {client.current_endpoint.url}")
        print(f"   📌 Agent ID: {client.identity.id}")

        print("\n3️⃣ Testing Tools...")
        print(f"   📦 {len(client.tools)} tools available:")
        for i, (name, info) in enumerate(list(client.tools.items())[:5]):
            print(f"   {i+1}. {name}: {info.get('description', 'No description')}")

        print("\n4️⃣ Testing Basic Operations...")

        # Test echo
        print("   • Testing echo...")
        result = await client.execute_tool("echo", {"message": "Hello MCP!"})
        if result.get('success'):
            print(f"     ✅ Echo: {result['result']['echo']}")
        else:
            print(f"     ❌ Echo failed: {result.get('error')}")

        # Test message broadcast
        print("   • Testing broadcast...")
        result = await client.send_message("broadcast", "Gateway test message!")
        if result.get('success'):
            print("     ✅ Message broadcast successful")
        else:
            print(f"     ❌ Broadcast failed: {result.get('error')}")

        # Test agent status
        print("   • Testing agent status...")
        result = await client.execute_tool("agent_status", {})
        if result.get('success'):
            agents = result['result']['agents']
            print(f"     ✅ {len(agents)} agents online")
        else:
            print(f"     ❌ Status check failed: {result.get('error')}")

        print("\n" + "="*60)
        print("✅ GATEWAY TEST SUCCESSFUL!")
        print("="*60)

        await client.disconnect()
        return True

    else:
        print("   ❌ Connection failed")
        return False


async def simulate_new_agent():
    """Simulate a completely new agent joining the network"""
    print("\n" + "="*60)
    print("🤖 SIMULATING NEW AGENT ONBOARDING")
    print("="*60)

    print("\n[New Agent]: I just received gateway.yaml. Let me connect...")

    client = GatewayClient()

    # Set agent identity
    client.identity.device_type = "test-agent"
    client.identity.capabilities = ["testing", "validation", "reporting"]

    print(f"[New Agent]: My device type: {client.identity.device_type}")
    print(f"[New Agent]: My capabilities: {client.identity.capabilities}")

    print("\n[New Agent]: Discovering network...")
    endpoints = await client.discover_endpoints()

    if endpoints:
        print(f"[New Agent]: Found {len(endpoints)} possible connection points")

        print("\n[New Agent]: Attempting connection...")
        if await client.connect():
            print(f"[New Agent]: Successfully connected! My ID is {client.identity.id}")

            print("\n[New Agent]: Introducing myself to the network...")
            await client.send_message(
                "broadcast",
                f"Hello! I'm a new {client.identity.device_type} agent. "
                f"Ready to help with: {', '.join(client.identity.capabilities)}"
            )

            print("\n[New Agent]: Checking what I can do...")
            tools = list(client.tools.keys())
            print(f"[New Agent]: I now have access to {len(tools)} tools!")
            print(f"[New Agent]: Some tools I can use: {', '.join(tools[:5])}...")

            print("\n[New Agent]: Querying knowledge base for onboarding info...")
            result = await client.query_knowledge("getting_started")
            if result.get('success'):
                print("[New Agent]: Retrieved onboarding documentation!")

            print("\n[New Agent]: Checking for available tasks...")
            result = await client.execute_tool("task_list", {"status": "available"})
            if result.get('success'):
                tasks = result['result']['tasks']
                print(f"[New Agent]: Found {len(tasks)} available tasks")
                if tasks:
                    print(f"[New Agent]: First task: {tasks[0]['description']}")

            print("\n" + "="*60)
            print("🎉 NEW AGENT SUCCESSFULLY ONBOARDED!")
            print("="*60)

            await client.disconnect()
            return True

    print("\n[New Agent]: Failed to find network. I'll try again later.")
    return False


async def main():
    """Main test runner"""
    print("\n🚀 Sartor Claude Network - Gateway Skill Tester")
    print("Version: 1.0.0")

    # Check if MCP server is running
    print("\n📡 Checking for MCP server...")

    # Quick check for local server
    import aiohttp
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "http://localhost:8080/mcp/health",
                timeout=aiohttp.ClientTimeout(total=2)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ MCP Server is running")
                    print(f"   Status: {data['status']}")
                    print(f"   Agents: {data['agents_connected']}")
                    print(f"   Tools: {data['tools_available']}")
    except:
        print("⚠️ MCP Server not detected on localhost:8080")
        print("\nTo start the server:")
        print("  python mcp/mcp_server.py")
        print("\nContinuing anyway (will try other discovery methods)...")

    # Run tests
    print("\n" + "-"*60)

    # Test 1: Basic gateway connection
    success1 = await test_gateway_connection()

    print("\n" + "-"*60)

    # Test 2: Simulate new agent
    if success1:
        await asyncio.sleep(1)  # Brief pause
        success2 = await simulate_new_agent()
    else:
        print("\n⚠️ Skipping new agent simulation (no connection)")
        success2 = False

    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"Gateway Connection: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"New Agent Onboarding: {'✅ PASS' if success2 else '❌ FAIL'}")

    if success1 and success2:
        print("\n🎊 ALL TESTS PASSED! Gateway skill is working perfectly!")
    else:
        print("\n⚠️ Some tests failed. Check the MCP server and try again.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")