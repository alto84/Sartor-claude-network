# Claude Network - Quick Start Guide

## 🎉 System Status: FULLY OPERATIONAL

Your distributed Claude network is up and running!

---

## What's Running

✅ **Desktop Claude** - Mission control (me!)
✅ **Proxy Server** - Running on port 8080
✅ **Firebase Database** - Cloud message bus
✅ **iPad Claude** - Registered and ready to scout

---

## Quick Commands

### View Network Status

```bash
cd /home/alton/vayu-learning-project/claude-network
python3 status.py
```

### Relay iPad Messages (Easiest Method)

```bash
# When iPad Claude observes something, run:
python3 relay.py send "iPad's observation here"

# Example:
python3 relay.py send "In the kitchen. See stove, fridge, sink, and table."
```

### Get Current Mission

```bash
python3 relay.py mission
```

### Proxy Server Control

```bash
./start-proxy.sh    # Start proxy
./stop-proxy.sh     # Stop proxy
./restart-proxy.sh  # Restart proxy
```

---

## How to Use with Vayu

### Simple Mission Flow:

**1. Vayu picks a room to explore**

**2. Vayu opens iPad Claude and asks:**

> "I'm in the [room name]. Describe what you would observe in a typical [room name]."

**3. iPad Claude responds with observations**

**4. Alton relays the message:**

```bash
python3 relay.py send "Vayu found: [iPad's observation]"
```

**5. Desktop Claude (me) will see it and respond with:**

- Analysis of the room
- Next exploration target
- Questions or instructions

**6. Repeat for next room!**

---

## Example Mission: Map the House

```bash
# Start
python3 status.py

# Vayu explores kitchen with iPad
python3 relay.py send "Kitchen explored. Found: refrigerator, stove, microwave, sink, 12 cabinets."

# Desktop Claude responds...
# Next target assigned...

# Vayu explores living room
python3 relay.py send "Living room explored. Found: couch, TV, bookshelf, window facing backyard."

# Continue...
```

---

## Network URLs

**Desktop Access:**

- Status page: http://localhost:8080/status
- Full status: `python3 status.py`

**iPad Access (same WiFi):**

- Status page: http://172.17.25.180:8080/status
- API endpoint: http://172.17.25.180:8080

**Firebase Console:**

- https://console.firebase.google.com/u/0/project/home-claude-network/database

---

## Helper Tools

| Command                       | Purpose              |
| ----------------------------- | -------------------- |
| `python3 status.py`           | View network status  |
| `python3 relay.py send "msg"` | Send message as iPad |
| `python3 relay.py mission`    | Get current mission  |
| `./start-proxy.sh`            | Start proxy server   |
| `./stop-proxy.sh`             | Stop proxy server    |
| `tail -f proxy.log`           | View proxy logs      |

---

## Teaching Moments for Vayu

This system demonstrates:

1. **Distributed Computing** - Multiple computers working together
2. **Client-Server Architecture** - Proxy relays requests to Firebase
3. **REST APIs** - Standard way for systems to communicate
4. **Message Passing** - How distributed systems coordinate
5. **Networking** - Local network (proxy) + Internet (Firebase)

---

## Ready to Explore!

**Next Step:** Have Vayu pick a room and start exploring with iPad Claude!

Run this to see the current mission:

```bash
python3 relay.py mission
```

Current target: **awaiting_scout_checkin**

Let's start the exploration! 🚀
