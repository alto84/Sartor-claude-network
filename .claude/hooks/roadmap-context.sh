#!/bin/bash
# Roadmap Context Injection Hook
#
# Automatically provides roadmap context to agents at session start
# or when explicitly requested.
#
# Usage:
#   ./roadmap-context.sh [--full]
#
# Options:
#   --full    Show full roadmap details instead of summary

set -euo pipefail

# Color codes for output
readonly BLUE='\033[0;34m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Project root
readonly PROJECT_ROOT="/home/user/Sartor-claude-network"
readonly ROADMAP_SCRIPT="${PROJECT_ROOT}/.claude/hooks/roadmap-helper.js"

# Parse arguments
SHOW_FULL=false
if [[ "${1:-}" == "--full" ]]; then
  SHOW_FULL=true
fi

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}[ROADMAP]${NC} $1" >&2
}

log_success() {
  echo -e "${GREEN}[ROADMAP]${NC} $1" >&2
}

log_warning() {
  echo -e "${YELLOW}[ROADMAP]${NC} $1" >&2
}

# ============================================================================
# Main Logic
# ============================================================================

log_info "Loading implementation roadmap..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  log_warning "Node.js not found. Install Node.js to enable roadmap tracking."
  exit 0
fi

# Check if TypeScript is compiled
if [[ ! -f "${PROJECT_ROOT}/dist/skills/roadmap-skill.js" ]]; then
  log_info "Compiling roadmap skill..."
  cd "${PROJECT_ROOT}"
  npx tsc --project tsconfig.json 2>&1 > /dev/null || {
    log_warning "TypeScript compilation failed. Using fallback roadmap display."
    cat <<'EOF'
📍 Current Phase: Phase 4 - Memory System Implementation
🎯 Objective: Implement tiered memory architecture validated by all skills

🔜 Next Tasks:
  1. Implement Hot Tier (Firebase Realtime Database)
  2. Implement Warm Tier (Firestore + Vector Database)
  3. Implement Cold Tier (GitHub Storage)

For detailed roadmap, see: /home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md
EOF
    exit 0
  }
fi

# Create helper script if it doesn't exist
if [[ ! -f "${ROADMAP_SCRIPT}" ]]; then
  cat > "${ROADMAP_SCRIPT}" <<'JSEOF'
// Roadmap Context Helper
const path = require('path');

// Load the compiled roadmap skill
const roadmapSkill = require(path.join(__dirname, '../../dist/skills/roadmap-skill.js'));

const showFull = process.argv[2] === '--full';

if (showFull) {
  // Show full roadmap details
  const manager = roadmapSkill.getRoadmapManager();
  const allPhases = manager.getAllPhases();

  console.log('━'.repeat(80));
  console.log('📋 SARTOR CLAUDE NETWORK - IMPLEMENTATION ROADMAP');
  console.log('━'.repeat(80));
  console.log();

  allPhases.forEach((phase, idx) => {
    const statusIcon = phase.status === 'completed' ? '✅' :
                       phase.status === 'in_progress' ? '⚡' : '⏳';
    console.log(`${statusIcon} Phase ${idx}: ${phase.name}`);
    console.log(`   Status: ${phase.status}`);
    console.log(`   Duration: ${phase.duration || 'N/A'}`);
    console.log(`   Objective: ${phase.objective || 'N/A'}`);
    console.log(`   Tasks: ${phase.tasks.filter(t => t.status === 'completed').length}/${phase.tasks.length} completed`);
    console.log();
  });

  console.log('━'.repeat(80));
  console.log();
} else {
  // Show quick summary
  console.log('━'.repeat(80));
  console.log(roadmapSkill.getRoadmapSummary());
  console.log('━'.repeat(80));
  console.log();
  console.log('💡 Tip: Any agent can query roadmap status at any time');
  console.log('   • getRoadmapSummary() - Quick context');
  console.log('   • getNextTasks() - What to work on');
  console.log('   • getCurrentPhase() - Current phase details');
  console.log();
}
JSEOF
fi

# Execute the helper script
node "${ROADMAP_SCRIPT}" ${SHOW_FULL:+--full}

log_success "Roadmap context loaded"
exit 0
