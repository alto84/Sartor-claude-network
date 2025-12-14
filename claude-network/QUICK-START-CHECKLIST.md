# Claude Network - Quick Start Checklist

**Print this page and check off each step as you progress!**

---

## 1. Prerequisites

Before starting, verify you have:

- [ ] Python 3.10+ installed
- [ ] Git installed and configured
- [ ] GitHub account access
- [ ] Firebase project created (see [setup-instructions.md](setup-instructions.md))
- [ ] Firebase credentials downloaded (`credentials.json`)

---

## 2. Setup Steps (15 min total)

| Step | Action                                                                                                            | Time  |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ----- |
| 1    | Clone repository: `git clone https://github.com/alton-ai/claude-network.git`                                      | 2 min |
| 2    | Navigate to project: `cd claude-network`                                                                          | 1 min |
| 3    | Run setup wizard: `python3 setup_agent.py`                                                                        | 5 min |
| 4    | Verify Firebase: `python3 -c "import firebase_admin; print('Firebase OK')"`                                       | 2 min |
| 5    | Test connection: `python3 status.py`                                                                              | 2 min |
| 6    | Register with network: `python3 -c "from agent_registry import AgentRegistry; r = AgentRegistry(); r.register()"` | 3 min |

---

## 3. Verification Checklist

After setup, verify each component is working:

- [ ] **Messaging**: `python3 -c "from macs import MACSClient; m = MACSClient('test'); print('MACS OK')"`
- [ ] **Agent Registry**: `python3 -c "from agent_registry import AgentRegistry; r = AgentRegistry(); print(r.get_agents())"`
- [ ] **Configuration**: `python3 -c "from config_manager import ConfigManager; c = ConfigManager(); print(c.config)"`
- [ ] **Skill Engine**: `python3 -c "from skill_engine import SkillEngine; e = SkillEngine(); print(f'{len(e.skills)} skills loaded')"`
- [ ] **Task Manager**: `python3 task_cli.py list`
- [ ] **Network Monitor**: `python3 monitor.py` (press Ctrl+C to exit)

---

## 4. First Tasks (Choose One)

Pick one task to get familiar with the system:

- [ ] **Run Onboarding**

  ```bash
  python3 setup_agent.py
  ```

  _Walks you through first-time configuration (5 min)_

- [ ] **Complete Simple Task**

  ```bash
  python3 task_cli.py create "Explore kitchen" --priority 1
  python3 task_cli.py monitor
  ```

  _Create and track your first task (3 min)_

- [ ] **Execute a Skill**

  ```bash
  python3 -c "
  from skill_engine import SkillEngine, SkillContext
  engine = SkillEngine()
  context = SkillContext(agent_id='my_agent', session_id='session_001')
  print(list(engine.skills.keys())[:5])
  "
  ```

  _Explore available skills (2 min)_

- [ ] **Send a Network Message**
  ```bash
  python3 relay.py send "Hello from my agent!"
  ```
  _Test message broadcasting (2 min)_

---

## 5. Quick Command Reference

| Command                                  | Purpose                                       |
| ---------------------------------------- | --------------------------------------------- |
| `python3 status.py`                      | View network status and connected agents      |
| `python3 monitor.py`                     | Real-time network monitoring (live dashboard) |
| `python3 task_cli.py create "Task name"` | Create a new task                             |
| `python3 task_cli.py list`               | List all tasks                                |
| `python3 task_cli.py monitor`            | Monitor task progress                         |
| `python3 relay.py send "message"`        | Send message to network                       |
| `python3 relay.py mission`               | Get current mission                           |
| `./start-proxy.sh`                       | Start proxy server                            |
| `./stop-proxy.sh`                        | Stop proxy server                             |
| `pytest tests/ -v`                       | Run all tests                                 |

---

## 6. Documentation Quick Links

**Getting Started:**

- [README.md](README.md) - Project overview
- [SECOND-COMPUTER-SETUP.md](SECOND-COMPUTER-SETUP.md) - Connect additional computers

**Core Systems:**

- [ARCHITECTURE-OVERVIEW.md](ARCHITECTURE-OVERVIEW.md) - System design and data flows
- [CONFIG_REGISTRY_README.md](CONFIG_REGISTRY_README.md) - Configuration & agent registry

**Features:**

- [SKILL-QUICKSTART.md](SKILL-QUICKSTART.md) - Learn skills system (5 min)
- [SKILL-GUIDE.md](SKILL-GUIDE.md) - Complete skill documentation
- [TASK_MANAGER_README.md](TASK_MANAGER_README.md) - Task management system

**Troubleshooting:**

- [setup-instructions.md](setup-instructions.md) - Firebase setup help
- [QUICK-START.md](QUICK-START.md) - Original quick start guide

---

## 7. Troubleshooting Quick Links

### "Agent not appearing in registry?"

```bash
python3 -c "from agent_registry import AgentRegistry; r = AgentRegistry(); r.start_heartbeat()"
```

[Full troubleshooting → README.md](README.md#troubleshooting)

### "Firebase connection issues?"

```bash
python3 -c "
from config_manager import ConfigManager
c = ConfigManager()
print(f'Firebase DB: {c.config.firebase_db_url}')
"
```

[Full troubleshooting → README.md](README.md#troubleshooting)

### "Messages not delivering?"

```bash
python3 -c "from macs import MACSClient; m = MACSClient('test'); print(m.get_offline_queue())"
```

[Full troubleshooting → README.md](README.md#troubleshooting)

---

## 8. Getting Help

| Question                               | Where to Look                                          |
| -------------------------------------- | ------------------------------------------------------ |
| How do I set up on a second computer?  | [SECOND-COMPUTER-SETUP.md](SECOND-COMPUTER-SETUP.md)   |
| How does the system architecture work? | [ARCHITECTURE-OVERVIEW.md](ARCHITECTURE-OVERVIEW.md)   |
| How do I create custom skills?         | [SKILL-GUIDE.md](SKILL-GUIDE.md)                       |
| How do I manage tasks?                 | [TASK_MANAGER_README.md](TASK_MANAGER_README.md)       |
| How do I configure the system?         | [CONFIG_REGISTRY_README.md](CONFIG_REGISTRY_README.md) |
| What's wrong? (Troubleshooting)        | [README.md](README.md#troubleshooting)                 |

---

## 9. Success Criteria

You're ready when you can check all of these:

- [ ] All prerequisites installed
- [ ] Setup wizard completed
- [ ] `python3 status.py` shows your agent as "healthy"
- [ ] Can create and list tasks
- [ ] Can send and receive messages
- [ ] Can view available skills
- [ ] Read at least one documentation file

---

## 10. Next Steps After Setup

Once you've completed this checklist:

1. **Explore Skills** → Read `SKILL-QUICKSTART.md`
2. **Create Tasks** → Use `task_cli.py` to distribute work
3. **Connect Computers** → Follow `SECOND-COMPUTER-SETUP.md`
4. **Build Skills** → Create custom skills in `skills/` directory
5. **Run Tests** → `pytest tests/ -v` for complete test coverage

---

**Total Setup Time: ~15 minutes**

**Print this checklist and check items as you complete them!**

Last Updated: 2025-11-03
