# Manual Human Relay - Simplest Claude Network

Since iPad and Web Claude can't access Firebase directly, we'll use you and Vayu as the "network connection"!

## How It Works

```
iPad Claude → Vayu observes → Alton relays → Desktop Claude (me)
                                                      ↓
Desktop Claude responds → Alton/Vayu relay → iPad Claude acts
```

## Process

### Step 1: Vayu Explores with iPad
1. Vayu takes iPad to a room
2. Opens Claude app
3. Asks iPad Claude: "Describe this room in detail"
4. iPad Claude responds with observations

### Step 2: Vayu Reports to Alton
Vayu tells you what iPad Claude said (or shows you the screen)

### Step 3: Alton Relays to Desktop Claude (me)
You tell me what iPad Claude observed, like:
> "iPad Claude says: I'm in the kitchen. I can see a stainless steel refrigerator,
> a gas stove with 4 burners, a sink with a window above it, and a small dining table."

### Step 4: Desktop Claude Analyzes & Responds
I'll process the information and give you instructions/questions, like:
> "Excellent scouting! Kitchen mapped. Next: Have iPad Claude count how many
> cabinets there are and check if there's a pantry. Then proceed to the living room."

### Step 5: Relay Back to iPad Claude
You/Vayu tell iPad Claude the new instructions

### Repeat!

## Example Mission - Room by Room Mapping

**Mission**: Map the entire house

**Current Status**: Awaiting first room report

**Protocol**:
1. Pick a room
2. iPad Claude describes it
3. Report to me
4. I'll mark it on the map and assign next room
5. Repeat until house is fully mapped!

## Advantages

- ✅ No technical setup required
- ✅ Works immediately
- ✅ Teaches Vayu about distributed systems
- ✅ Humans are the "network layer"
- ✅ Vayu learns how systems communicate

## Teaching Moment

This is actually how many real distributed systems work! Different computers
communicate by passing messages through a network. In our case, the "network"
is you and Vayu carrying information between the Claude instances.

**Ready to start?** Pick a room and let's begin the exploration!
