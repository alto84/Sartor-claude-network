#!/usr/bin/env bash
# install.sh - Safety Research Wiki bundle installer (Linux/Mac)
# Run from the bundle root: bash scripts/install.sh

set -e

echo "=== Safety Research Wiki - Unix Installer ==="
echo

# Resolve the bundle root (one level up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_ROOT="$(dirname "$SCRIPT_DIR")"
if [ ! -f "$BUNDLE_ROOT/wiki.py" ]; then
    # Try current directory instead
    BUNDLE_ROOT="$(pwd)"
    if [ ! -f "$BUNDLE_ROOT/wiki.py" ]; then
        echo "ERROR: wiki.py not found. Run this script from the bundle root." >&2
        echo "Expected layout: <bundle-root>/wiki.py and <bundle-root>/scripts/install.sh" >&2
        exit 1
    fi
fi
cd "$BUNDLE_ROOT"
echo "Bundle root: $BUNDLE_ROOT"

# Check Python
if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
    echo "ERROR: python not found in PATH. Install Python 3.10+ first." >&2
    exit 1
fi

# Prefer python3 if available
PYTHON="python3"
if ! command -v python3 >/dev/null 2>&1; then
    PYTHON="python"
fi

echo "Found Python: $($PYTHON --version)"

# Verify Python >= 3.10
if ! $PYTHON -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
    echo "ERROR: Python 3.10+ required." >&2
    exit 1
fi

# Create state directory
if [ ! -d "$BUNDLE_ROOT/state" ]; then
    mkdir -p "$BUNDLE_ROOT/state"
    echo "Created state/ directory"
else
    echo "state/ directory already exists"
fi

# Create indexes directory
if [ ! -d "$BUNDLE_ROOT/indexes" ]; then
    mkdir -p "$BUNDLE_ROOT/indexes"
    echo "Created indexes/ directory"
fi

# Run selftest
echo
echo "=== Running wiki.py --selftest ==="
if $PYTHON wiki.py --selftest; then
    echo
    echo "Install complete. Next steps:"
    echo "  1. Read skills/safety-research-wiki/SKILL.md"
    echo "  2. Copy a template from templates/ to create your first real page"
    echo "  3. Run: $PYTHON wiki.py --reindex"
    echo "  4. Run: $PYTHON wiki.py --article <your-page-stem>"
else
    echo "WARNING: selftest had failures. Review above output." >&2
fi
