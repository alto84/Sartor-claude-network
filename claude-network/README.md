# Claude Network - Multi-Agent Coordination System

## 🎉 Status: OPERATIONAL

Your Claude Network is live and ready!

## What We Built

A real-time coordination system connecting multiple Claude instances:
- **Desktop Claude (me)** - Mission control at the base station ✅ CONNECTED
- **iPad Claude** - Mobile scout for house exploration ⏳ Ready to connect
- **Future: Local inference computer** - Self-hosted AI node 🔮 Coming soon

**Note:** Web-based Claude Code cannot access Firebase due to network restrictions, but Desktop Claude Code has full access!

## Architecture

```
                    Firebase Realtime Database
                    (Cloud message bus)
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    Desktop              iPad              Local Inference
    Claude              Claude               (Future)
  (Mission Control)    (Scout)            (Self-hosted AI)
      ✅                 ⏳                    🔮
```

## Quick Start

### For Desktop Claude (already connected!):

```bash
# View network status
cd /home/alton/vayu-learning-project/claude-network
python3 network.py

# Monitor in real-time
python3 monitor.py

# Send a message
python3 -c "from network import net; net.send('Hello from Desktop!')"
```

### For iPad Claude:
1. Open `CONNECT-IPAD.md`
2. Follow instructions to join network
3. Start exploring and taking photos!

### For Web Claude:
1. Open Claude Code in browser
2. Open `CONNECT-WEB.md`
3. Run the connection commands

## Files Created

- `network.py` - Python API for easy access
- `monitor.py` - Real-time message monitor
- `claude-api.py` - Full-featured API library
- `CONNECT-IPAD.md` - iPad setup instructions
- `CONNECT-WEB.md` - Web Claude setup
- `NETWORK-STATUS.md` - Quick reference commands
- `setup-instructions.md` - Firebase setup guide

## Example Usage

### Send a message from Desktop Claude:
```python
from network import net
net.send("Requesting scout to explore kitchen")
```

### Update mission:
```python
from network import net
net.update_mission(current_target="kitchen", status="active")
```

### Add an observation:
```python
from network import net
net.add_observation("room", {"name": "kitchen", "items": ["stove", "sink", "fridge"]})
```

### Check who's online:
```python
from network import net
print(net.get_agents())
```

## Teaching Moments for Vayu

This project demonstrates:
1. **Distributed Systems** - Multiple agents working together
2. **Message Passing** - How computers communicate
3. **REST APIs** - Standard web communication protocol
4. **Real-time Sync** - Firebase keeps everyone updated instantly
5. **JSON Data** - Standard data format for APIs
6. **Cloud Services** - Using Firebase as infrastructure

## Next Steps

1. **Connect iPad**: Have Vayu open Claude on iPad and join the network
2. **First Mission**: Scout explores one room and reports back
3. **Connect Web Claude**: Add browser instance for additional analysis
4. **Build Map**: Collaboratively map out the house
5. **Add Games**: Create interactive experiences using the network

## Database URL
```
https://home-claude-network-default-rtdb.firebaseio.com
```

## Web Console
https://console.firebase.google.com/u/0/project/home-claude-network/database/home-claude-network-default-rtdb/data

---

**Ready to deploy the iPad scout?** Let's give Vayu his robot explorer!
