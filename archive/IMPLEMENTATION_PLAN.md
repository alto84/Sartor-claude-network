# Clawdbot Integration Plan for Sartor Family Dashboard

## Executive Summary

Transform the Sartor Family Dashboard from placeholder responses to a fully functional AI assistant powered by Claude, inspired by Clawdbot's architecture.

## Research Findings: Clawdbot

**What is Clawdbot?**
- Personal AI assistant platform by Peter Steinberger
- Connects to multiple messaging platforms (WhatsApp, Telegram, Discord, Signal, iMessage)
- Uses Claude as the AI model (claude-opus-4-5 by default)
- Modular architecture: Gateway → Agent → Skills → Memory

**Key Architecture Components:**
1. **Gateway** - Handles messaging platform connections and scheduling
2. **Agent** - Where the AI model lives
3. **Skills** - Extensions for web browsing, email, file ops, shell commands
4. **Memory** - Persistent context across conversations

## Current State: Sartor Dashboard

**What exists:**
- ✅ Chat UI (`/chat` page with full interface)
- ✅ Chat API route (`/api/chat/route.ts`) - BUT uses placeholder responses
- ✅ Memory status widget (connected to real backends)
- ✅ Firebase RTDB connected
- ✅ Obsidian connected with family knowledge base
- ❌ No real Claude integration
- ❌ No skills system
- ❌ No conversation persistence

## Implementation Plan

### Phase 1: Real Claude Integration (Priority: CRITICAL)
**Goal:** Replace placeholder responses with actual Claude AI

**Tasks:**
1. Install Anthropic SDK: `npm install @anthropic-ai/sdk`
2. Create Claude service (`lib/claude-service.ts`)
3. Update chat API to use real Claude responses
4. Add streaming support for better UX
5. Configure system prompt with family context

**Files to modify/create:**
- `lib/claude-service.ts` (NEW)
- `app/api/chat/route.ts` (MODIFY)
- `.env.local` (ADD ANTHROPIC_API_KEY)

### Phase 2: Memory Integration (Priority: HIGH)
**Goal:** Persist conversations and enable context recall

**Tasks:**
1. Store chat sessions in Firebase RTDB
2. Load conversation history on page load
3. Implement context summarization for long conversations
4. Connect to Obsidian for knowledge retrieval
5. Store learned facts about family members

**Files to modify/create:**
- `lib/memory-service.ts` (NEW)
- `lib/firebase-chat.ts` (NEW)
- `app/api/chat/route.ts` (MODIFY)

### Phase 3: Skills System (Priority: HIGH)
**Goal:** Enable Claude to take actions (Clawdbot-style)

**Skills to implement:**
1. **Calendar Skill** - Read/write Google Calendar
2. **Task Skill** - Manage family tasks
3. **Home Skill** - Control smart home devices
4. **Knowledge Skill** - Query Obsidian vault
5. **Weather Skill** - Get weather info

**Architecture:**
```
/lib/skills/
├── index.ts          # Skill registry
├── calendar.ts       # Google Calendar integration
├── tasks.ts          # Task management
├── home.ts           # Home Assistant integration
├── knowledge.ts      # Obsidian search
└── weather.ts        # Weather API
```

**Tool definitions for Claude:**
- Define each skill as a tool Claude can call
- Use function calling for structured actions

### Phase 4: Conversation UX Enhancements (Priority: MEDIUM)
**Goal:** Polish the chat experience

**Tasks:**
1. Add streaming responses with typing indicator
2. Show skill execution status (e.g., "Checking calendar...")
3. Add conversation threading/topics
4. Enable voice input (Web Speech API)
5. Add suggested follow-up actions

### Phase 5: Multi-Platform Messaging (Priority: LOW - Future)
**Goal:** Enable messaging beyond the dashboard

**Options:**
- Discord bot for family server
- Telegram bot
- SMS integration via Twilio

---

## Implementation Order

```
[Week 1]
├── Phase 1: Real Claude Integration
│   ├── 1.1 Install Anthropic SDK
│   ├── 1.2 Create Claude service
│   ├── 1.3 Update chat API
│   └── 1.4 Test basic conversations

[Week 2]
├── Phase 2: Memory Integration
│   ├── 2.1 Firebase chat persistence
│   ├── 2.2 Load conversation history
│   └── 2.3 Context summarization

[Week 3]
├── Phase 3: Skills System
│   ├── 3.1 Skill registry architecture
│   ├── 3.2 Knowledge skill (Obsidian)
│   ├── 3.3 Calendar skill
│   └── 3.4 Task skill

[Week 4]
├── Phase 4: UX Polish
│   ├── 4.1 Streaming responses
│   ├── 4.2 Skill execution feedback
│   └── 4.3 Voice input
```

---

## Technical Specifications

### Claude Service Interface

```typescript
interface ClaudeService {
  // Send message and get response
  chat(params: {
    message: string;
    userId: string;
    conversationHistory: Message[];
    systemPrompt?: string;
  }): Promise<ChatResponse>;

  // Stream response
  streamChat(params: ChatParams): AsyncIterable<string>;

  // Execute skill
  executeTool(toolName: string, params: object): Promise<ToolResult>;
}
```

### System Prompt Template

```
You are Claude, the Sartor family assistant. You help the family with:
- Calendar and scheduling
- Task management
- Smart home control
- Family information lookup

Current family members:
- Alton (father) - tech lead, works from home
- Aneeta (mother) - works at [company]
- Vayu (son, 10) - school, piano, soccer
- Vishala (daughter, 8) - school, gymnastics
- Vasu (son, 4) - home

Today is {date}. Current time is {time}.

You have access to these tools:
{tool_definitions}

Be warm, friendly, and concise. This is a family, not a corporation.
```

### Skill Tool Definition Example

```typescript
const calendarTool = {
  name: "calendar_query",
  description: "Get calendar events for a date range",
  input_schema: {
    type: "object",
    properties: {
      startDate: { type: "string", description: "Start date (ISO format)" },
      endDate: { type: "string", description: "End date (ISO format)" },
      familyMember: { type: "string", description: "Filter by family member (optional)" }
    },
    required: ["startDate", "endDate"]
  }
};
```

---

## Success Criteria

### Must Have (MVP)
- [ ] Real Claude responses (not placeholders)
- [ ] Conversation history persistence
- [ ] At least 2 working skills (knowledge + calendar)
- [ ] Family context in system prompt

### Should Have
- [ ] Streaming responses
- [ ] Skill execution feedback in UI
- [ ] Context summarization for long conversations

### Nice to Have
- [ ] Voice input
- [ ] Multi-platform messaging
- [ ] Proactive notifications

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API rate limits | Implement caching, use conversation summaries |
| High API costs | Use Haiku for simple queries, Sonnet for complex |
| Slow responses | Implement streaming, show typing indicator |
| Context too long | Summarize old conversations, use RAG |

---

## Resources

- [Clawdbot GitHub](https://github.com/clawdbot/clawdbot)
- [Clawdbot Docs](https://docs.clawd.bot)
- [Anthropic SDK](https://docs.anthropic.com/claude/reference/client-sdks)
- [Claude Tool Use](https://docs.anthropic.com/claude/docs/tool-use)

---

*Plan created: January 23, 2026*
*Status: Ready for implementation*
