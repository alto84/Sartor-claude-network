#!/usr/bin/env python3
"""
Sartor Network - One-Line Installer

USAGE:
    curl -fsSL https://raw.githubusercontent.com/alto84/Sartor-claude-network/claude/gateway-meta-skills-011CUmZUdEBcDVWuGRLdUJEo/install.py | python3

This will download and run the network bootstrap, connecting you immediately.
"""

import sys
import urllib.request
import tempfile
import os

BOOTSTRAP_URL = "https://raw.githubusercontent.com/alto84/Sartor-claude-network/claude/gateway-meta-skills-011CUmZUdEBcDVWuGRLdUJEo/sartor-network-bootstrap.py"

def main():
    print("🌐 Sartor Network - One-Line Installer")
    print("━" * 60)
    print()

    print("📥 Downloading bootstrap from GitHub...")
    try:
        with urllib.request.urlopen(BOOTSTRAP_URL, timeout=10) as response:
            bootstrap_code = response.read().decode('utf-8')
        print("✅ Bootstrap downloaded successfully")
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print()
        print("Alternative: Manual download")
        print(f"  wget {BOOTSTRAP_URL}")
        print(f"  python3 sartor-network-bootstrap.py")
        return 1

    print()
    print("🚀 Running bootstrap...")
    print("━" * 60)
    print()

    # Execute the bootstrap code
    exec(bootstrap_code, {'__name__': '__main__'})

    return 0

if __name__ == "__main__":
    sys.exit(main())
