#!/usr/bin/env python3
"""
Test script to demonstrate configuration management and agent registry
"""
import time
import logging
from pathlib import Path

from config_manager import ConfigManager, Config
from agent_registry import AgentRegistry, AgentInfo, AgentStatus
from firebase_schema import FirebaseSchema

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_config_manager():
    """Test configuration management"""
    print("\n" + "="*60)
    print("TESTING CONFIGURATION MANAGER")
    print("="*60)

    # Create config manager
    manager = ConfigManager()

    # Save example config
    print("\n1. Creating example configuration...")
    manager.save_example()
    print("   ✓ Example config saved")

    # Try to load config
    print("\n2. Loading configuration...")
    try:
        config = manager.load()
        print(f"   ✓ Config loaded from: {', '.join(manager._loaded_sources)}")
        print(f"   - Agent ID: {config.agent.agent_id}")
        print(f"   - Firebase URL: {config.firebase.url}")
        print(f"   - Log Level: {config.log_level}")
    except ValueError as e:
        # Expected if no valid config exists yet
        print(f"   ⚠ No valid configuration found (expected on first run)")
        print(f"   - Create config.yaml or ~/.claude-network/config.yaml")
        print(f"   - Or set environment variables (CLAUDE_FIREBASE_URL, etc.)")

        # Create a minimal config for testing
        config = Config()
        config.firebase.url = "https://home-claude-network-default-rtdb.firebaseio.com"
        config.agent.agent_id = "test-agent-001"
        config.agent.agent_name = "Test Agent"
        print("\n   Using default test configuration")

    return config


def test_firebase_schema(config):
    """Test Firebase schema management"""
    print("\n" + "="*60)
    print("TESTING FIREBASE SCHEMA")
    print("="*60)

    # Create schema manager
    schema = FirebaseSchema(config)

    # Validate current schema
    print("\n1. Validating Firebase schema...")
    report = schema.validate_schema()
    print(f"   - Schema version: {report['schema_version']}")
    print(f"   - Valid: {report['valid']}")

    if report['errors']:
        print("   - Errors found:")
        for error in report['errors']:
            print(f"     • {error}")
        print("\n   Run 'python firebase_schema.py --init' to initialize schema")

    if report['warnings']:
        print("   - Warnings:")
        for warning in report['warnings']:
            print(f"     • {warning}")

    # Get database stats
    print("\n2. Database statistics:")
    stats = schema.get_database_stats()
    if stats.get("structures"):
        for struct, count in stats["structures"].items():
            print(f"   - {struct}: {count} items")
    if stats.get("approximate_size_bytes"):
        size_kb = stats["approximate_size_bytes"] / 1024
        print(f"   - Approximate size: {size_kb:.1f} KB")

    # Export documentation
    print("\n3. Exporting schema documentation...")
    docs_path = Path("firebase_schema_docs.json")
    schema.export_schema_docs(docs_path)
    print(f"   ✓ Documentation exported to {docs_path}")


def test_agent_registry(config):
    """Test agent registry and heartbeat"""
    print("\n" + "="*60)
    print("TESTING AGENT REGISTRY")
    print("="*60)

    # Create registry
    registry = AgentRegistry(config)

    # Get current agents
    print("\n1. Current agents in network:")
    agents = registry.get_all_agents()
    if agents:
        for agent_id, agent in agents.items():
            status = agent.status.value if hasattr(agent.status, 'value') else str(agent.status)
            health = agent.health.value if hasattr(agent.health, 'value') else str(agent.health)
            print(f"   - {agent.agent_name} ({agent_id})")
            print(f"     Status: {status}, Health: {health}")
    else:
        print("   No agents registered yet")

    # Register test agent
    print("\n2. Registering test agent...")
    test_agent = AgentInfo(
        agent_id=config.agent.agent_id,
        agent_name=config.agent.agent_name,
        capabilities=["test", "demo"],
        specialization="testing",
        surface="cli",
        location="test-environment",
        status=AgentStatus.ONLINE
    )

    if registry.register(test_agent):
        print(f"   ✓ Agent '{test_agent.agent_name}' registered")
    else:
        print("   ✗ Failed to register agent")

    # Send heartbeat
    print("\n3. Sending heartbeat...")
    if registry.send_heartbeat(config.agent.agent_id):
        print("   ✓ Heartbeat sent")
    else:
        print("   ✗ Failed to send heartbeat")

    # Check health
    print("\n4. Checking agent health...")
    health_report = registry.check_agent_health()
    for agent_id, health in health_report.items():
        print(f"   - {agent_id}: {health.value}")

    # Discover agents
    print("\n5. Discovering agents with 'test' capability...")
    test_agents = registry.discover_agents(capability="test")
    print(f"   Found {len(test_agents)} agent(s) with 'test' capability")

    # Get statistics
    print("\n6. Registry statistics:")
    stats = registry.get_statistics()
    for key, value in stats.items():
        if key != "timestamp":
            print(f"   - {key}: {value}")

    return registry


def test_heartbeat_loop(registry, duration=10):
    """Test heartbeat loop for a short duration"""
    print("\n" + "="*60)
    print("TESTING HEARTBEAT LOOP")
    print("="*60)

    print(f"\nStarting heartbeat for {duration} seconds...")
    print("(Heartbeats will be sent in the background)")

    # Start heartbeat
    registry.start_heartbeat()

    # Start monitoring
    registry.start_monitoring(check_interval=5)

    # Wait and show status
    for i in range(duration):
        time.sleep(1)
        print(f"   {i+1}/{duration} seconds elapsed...", end="\r")

    print(f"\n   ✓ Heartbeat test complete")

    # Stop services
    registry.stop_heartbeat_thread()
    registry.stop_monitoring()
    print("   ✓ Services stopped")


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print(" CLAUDE NETWORK CONFIGURATION & REGISTRY TEST ".center(70, "="))
    print("="*70)

    try:
        # Test configuration manager
        config = test_config_manager()

        # Test Firebase schema
        test_firebase_schema(config)

        # Test agent registry
        registry = test_agent_registry(config)

        # Test heartbeat (short duration for demo)
        test_heartbeat_loop(registry, duration=5)

        print("\n" + "="*60)
        print("ALL TESTS COMPLETED")
        print("="*60)
        print("\nNext steps:")
        print("1. Run './setup_agent.py' for interactive setup")
        print("2. Create your config.yaml based on config.example.yaml")
        print("3. Initialize Firebase schema: 'python firebase_schema.py --init'")
        print("4. Start agent services in your application")

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        logger.exception("Test failed with exception")


if __name__ == "__main__":
    main()