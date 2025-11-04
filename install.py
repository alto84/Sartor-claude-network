#!/usr/bin/env python3
"""
Sartor Network - Multi-Language Installer

USAGE:
    # Python (default)
    curl -fsSL https://raw.githubusercontent.com/alto84/Sartor-claude-network/main/install.py | python3

    # Or specify language:
    python3 install.py --python   # Python bootstrap
    python3 install.py --bash     # Bash/curl bootstrap
    python3 install.py --js       # JavaScript/Node.js bootstrap
    python3 install.py --json     # JSON config file

This will download and optionally run the network bootstrap in your preferred language.
"""

import sys
import urllib.request
import tempfile
import os
import argparse
import subprocess

# Base URL for raw GitHub files
BASE_URL = "https://raw.githubusercontent.com/alto84/Sartor-claude-network/main"

# Bootstrap file URLs
BOOTSTRAP_URLS = {
    'python': f"{BASE_URL}/sartor-network-bootstrap.py",
    'bash': f"{BASE_URL}/sartor-network-bootstrap.sh",
    'javascript': f"{BASE_URL}/sartor-network-bootstrap.js",
    'json': f"{BASE_URL}/sartor-network-config.json"
}

# Friendly names
BOOTSTRAP_NAMES = {
    'python': 'Python Bootstrap',
    'bash': 'Bash/Curl Bootstrap',
    'javascript': 'JavaScript/Node.js Bootstrap',
    'json': 'JSON Configuration'
}

# File names
BOOTSTRAP_FILES = {
    'python': 'sartor-network-bootstrap.py',
    'bash': 'sartor-network-bootstrap.sh',
    'javascript': 'sartor-network-bootstrap.js',
    'json': 'sartor-network-config.json'
}

def download_file(url, description):
    """Download a file from URL"""
    print(f"📥 Downloading {description}...")
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            content = response.read()
        print(f"✅ {description} downloaded successfully")
        return content
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print()
        print("Alternative: Manual download")
        print(f"  wget {url}")
        return None

def save_file(content, filename):
    """Save content to a file"""
    try:
        with open(filename, 'wb') as f:
            f.write(content)

        # Make executable if it's a script
        if filename.endswith('.sh') or filename.endswith('.py') or filename.endswith('.js'):
            os.chmod(filename, 0o755)

        print(f"💾 Saved to: {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to save file: {e}")
        return False

def run_python_bootstrap(code):
    """Execute Python bootstrap code"""
    print()
    print("🚀 Running Python bootstrap...")
    print("━" * 60)
    print()
    exec(code, {'__name__': '__main__'})

def run_bash_bootstrap(filename):
    """Execute Bash bootstrap"""
    print()
    print("🚀 Running Bash bootstrap...")
    print("━" * 60)
    print()
    try:
        subprocess.run(['bash', filename, '--demo'], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Bootstrap execution failed: {e}")
        return False
    return True

def run_javascript_bootstrap(filename):
    """Execute JavaScript bootstrap"""
    print()
    print("🚀 Running JavaScript bootstrap...")
    print("━" * 60)
    print()
    try:
        subprocess.run(['node', filename], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Bootstrap execution failed: {e}")
        print()
        print("Make sure Node.js is installed:")
        print("  https://nodejs.org/")
        return False
    return True

def show_json_usage(filename):
    """Show usage instructions for JSON config"""
    print()
    print("📋 JSON Configuration downloaded!")
    print("━" * 60)
    print()
    print("Usage:")
    print("  1. View endpoints:")
    print(f"     jq '.endpoints' {filename}")
    print()
    print("  2. View workflows:")
    print(f"     jq '.workflows' {filename}")
    print()
    print("  3. Use curl commands directly:")
    print("     # See examples in the JSON file")
    print()
    print("  4. Quick connect example:")
    print("     AGENT_ID=\"agent-$(date +%s)\"")
    print("     curl -X PUT \"https://home-claude-network-default-rtdb.firebaseio.com/agents-network/agents/$AGENT_ID.json\" \\")
    print("       -H 'Content-Type: application/json' \\")
    print("       -d '{\"agent_id\":\"'$AGENT_ID'\",\"status\":\"online\"}'")
    print()

def list_available_formats():
    """Show all available bootstrap formats"""
    print()
    print("Available bootstrap formats:")
    print()
    print("  --python     Python implementation (default)")
    print("               Full-featured, extensive error handling")
    print("               Requires: python3, requests")
    print()
    print("  --bash       Bash/curl implementation")
    print("               Pure shell script, minimal dependencies")
    print("               Requires: bash, curl, jq")
    print()
    print("  --js         JavaScript/Node.js implementation")
    print("               Modern ES6+, works in Node.js and browsers")
    print("               Requires: node (18+ recommended)")
    print()
    print("  --json       JSON configuration file")
    print("               Pure config with curl examples")
    print("               Requires: curl, jq (for examples)")
    print()
    print("  --all        Download all formats")
    print()
    print("  --list       Show this list")
    print()

def install_format(format_type, run_after_download=True):
    """Install a specific bootstrap format"""
    url = BOOTSTRAP_URLS[format_type]
    name = BOOTSTRAP_NAMES[format_type]
    filename = BOOTSTRAP_FILES[format_type]

    content = download_file(url, name)
    if not content:
        return False

    if not save_file(content, filename):
        return False

    print()

    # Run or show usage based on format
    if run_after_download:
        if format_type == 'python':
            run_python_bootstrap(content.decode('utf-8'))
        elif format_type == 'bash':
            run_bash_bootstrap(filename)
        elif format_type == 'javascript':
            run_javascript_bootstrap(filename)
        elif format_type == 'json':
            show_json_usage(filename)
    else:
        print(f"✅ {name} ready to use")
        print(f"   Run: ./{filename}")

    return True

def main():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║          SARTOR NETWORK - MULTI-LANGUAGE INSTALLER             ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()

    parser = argparse.ArgumentParser(
        description='Install Sartor Network bootstrap in your preferred language',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--python', action='store_true', help='Download Python bootstrap (default)')
    parser.add_argument('--bash', action='store_true', help='Download Bash/curl bootstrap')
    parser.add_argument('--js', '--javascript', action='store_true', dest='js', help='Download JavaScript/Node.js bootstrap')
    parser.add_argument('--json', action='store_true', help='Download JSON configuration')
    parser.add_argument('--all', action='store_true', help='Download all formats')
    parser.add_argument('--list', action='store_true', help='List available formats')
    parser.add_argument('--no-run', action='store_true', help='Download only, do not run')

    args = parser.parse_args()

    # Show list if requested
    if args.list:
        list_available_formats()
        return 0

    # Determine which formats to install
    formats_to_install = []

    if args.all:
        formats_to_install = ['python', 'bash', 'javascript', 'json']
    else:
        if args.python:
            formats_to_install.append('python')
        if args.bash:
            formats_to_install.append('bash')
        if args.js:
            formats_to_install.append('javascript')
        if args.json:
            formats_to_install.append('json')

    # Default to Python if nothing specified
    if not formats_to_install:
        formats_to_install = ['python']

    # Install each format
    run_after = not args.no_run
    success = True

    for i, format_type in enumerate(formats_to_install):
        if i > 0:
            print()
            print("─" * 68)
            print()

        # Only run the first format if multiple are being installed
        should_run = run_after and (i == 0 or not args.all)

        if not install_format(format_type, should_run):
            success = False

    print()
    print("═" * 68)

    if success:
        print("✅ Installation complete!")
        print()
        print("Next steps:")
        if len(formats_to_install) == 1:
            print(f"  • Run: ./{BOOTSTRAP_FILES[formats_to_install[0]]}")
        else:
            print("  • Run any of the downloaded bootstraps")
        print("  • Read: docs/MULTI-LANGUAGE-BOOTSTRAP.md for detailed usage")
        print("  • Join the network and start coordinating with other agents!")
    else:
        print("⚠️  Some downloads failed")
        print()
        print("Try manual download:")
        for format_type in formats_to_install:
            print(f"  wget {BOOTSTRAP_URLS[format_type]}")

    print("═" * 68)

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
