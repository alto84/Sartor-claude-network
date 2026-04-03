# Claude Swarm - Installation Guide

## Quick Install (Copy-Paste)

### Step 1: Create the Coordinator

```bash
mkdir -p ~/.claude-swarm && cat > ~/.claude-swarm/coordinator.js << 'EOF'
#!/usr/bin/env node
import{existsSync as E,mkdirSync as M,readdirSync as R,readFileSync as F,writeFileSync as W,unlinkSync as U,renameSync as N}from'fs';import{join as J,basename as B}from'path';import{spawn as S}from'child_process';
const C={d:process.env.SWARM_DIR||'.swarm',m:+(process.env.MAX_AGENTS||5),t:+(process.env.AGENT_TIMEOUT||300)*1e3,p:500};
const D={r:J(C.d,'requests'),s:J(C.d,'results'),p:J(C.d,'processing')};
Object.values(D).forEach(d=>M(d,{recursive:!0}));
const A=new Map,P=new Set;let K={c:0,f:0};
const Q=(i,r)=>`You are Agent "${r.agentRole||'worker'}" in a multi-agent swarm.
REQUEST ID: ${i}
PARENT: ${r.parentRequestId||'root'}
OBJECTIVE: ${r.task?.objective||'Complete the task'}
CONTEXT: ${JSON.stringify(r.task?.context||{},null,2)}
REQUIREMENTS: ${(r.task?.requirements||['Complete thoroughly']).map(x=>'• '+x).join('\n')}
To spawn child: Create ${C.d}/requests/child-{id}.json with {agentRole,parentRequestId:"${i}",task:{objective,context,requirements}}
Begin:`;
function X(i,r){if(A.size>=C.m)return!1;const p=S('claude',['-p',Q(i,r)],{env:{...process.env,SWARM_REQUEST_ID:i,SWARM_PARENT_ID:r.parentRequestId||''},stdio:['pipe','pipe','pipe']});
let o='',e='';p.stdout.on('data',d=>o+=d);p.stderr.on('data',d=>e+=d);
const t=setTimeout(()=>{p.kill('SIGTERM');console.log(`⏰ ${i.slice(0,12)}`)},C.t);
const s=Date.now();A.set(i,{p,t,s});
p.on('close',c=>{clearTimeout(t);A.delete(i);const d=Date.now()-s,st=c===0?'success':'failed';K[st==='success'?'c':'f']++;
W(J(D.s,`${i}.json`),JSON.stringify({requestId:i,status:st,output:o||e,durationMs:d,completedAt:new Date().toISOString()},null,2));
console.log(`${st==='success'?'✅':'❌'} ${i.slice(0,12)} (${(d/1e3).toFixed(1)}s)`)});return!0}
function L(){try{for(const f of R(D.r).filter(x=>x.endsWith('.json'))){if(P.has(f))continue;P.add(f);const p=J(D.r,f);if(!E(p))continue;
try{const r=JSON.parse(F(p,'utf-8')),i=r.requestId||`req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
N(p,J(D.p,f));console.log(`📥 ${i.slice(0,12)} (${r.agentRole||'worker'})`);
if(X(i,{...r,requestId:i})){try{U(J(D.p,f))}catch(e){}}else{N(J(D.p,f),p);P.delete(f)}}catch(e){console.error(e.message)}}}catch(e){}}
console.log(`\n╔═══════════════════════════════════════╗\n║     CLAUDE SWARM COORDINATOR          ║\n╠═══════════════════════════════════════╣\n║ Max: ${C.m} | Timeout: ${C.t/1e3}s | Dir: ${C.d}  ║\n╚═══════════════════════════════════════╝\n`);
console.log('🔍 Watching for requests...\n');
setInterval(L,C.p);setInterval(()=>{if(A.size>0||K.c>0)console.log(`📊 Active:${A.size} Done:${K.c} Failed:${K.f}`)},1e4);
process.on('SIGINT',()=>{console.log('\n👋');process.exit(0)});
EOF
chmod +x ~/.claude-swarm/coordinator.js
echo "✅ Coordinator installed to ~/.claude-swarm/coordinator.js"
```

### Step 2: Install the Skill

```bash
mkdir -p ~/.claude/skills/claude-swarm
curl -sL https://raw.githubusercontent.com/YOUR_USERNAME/claude-swarm/main/skills/claude-swarm/SKILL.md \
  -o ~/.claude/skills/claude-swarm/SKILL.md
echo "✅ Skill installed"
```

Or manually copy `skills/claude-swarm/SKILL.md` to `~/.claude/skills/claude-swarm/`.

### Step 3: Initialize Project

In any project where you want to use swarm:

```bash
mkdir -p .swarm/{requests,results,processing,artifacts}
echo "✅ Swarm directory initialized"
```

## Usage

### Start the Coordinator

```bash
# Terminal 1: Start coordinator
cd /your/project
node ~/.claude-swarm/coordinator.js
```

### Create Agent Requests

```bash
# Terminal 2: Create requests
cat > .swarm/requests/my-agent.json << 'EOF'
{
  "agentRole": "researcher",
  "task": {
    "objective": "Research AI safety trends",
    "requirements": ["Be thorough", "Cite sources"]
  }
}
EOF
```

### Monitor Results

```bash
# Watch for results
watch -n 2 'ls -la .swarm/results/'
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SWARM_DIR` | `.swarm` | Base directory |
| `MAX_AGENTS` | `5` | Max concurrent agents |
| `AGENT_TIMEOUT` | `300` | Seconds per agent |

Example:

```bash
MAX_AGENTS=10 AGENT_TIMEOUT=600 node ~/.claude-swarm/coordinator.js
```

## Uninstall

```bash
rm -rf ~/.claude-swarm
rm -rf ~/.claude/skills/claude-swarm
rm -rf .swarm  # In each project
```
