import { NextRequest, NextResponse } from 'next/server';

// Types for the chat API
interface ChatRequest {
  content: string;
  userId: string;
  userName: string;
  sessionId?: string;
}

interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// Generate a unique ID
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Placeholder responses - in production, this would integrate with Claude API
// and the MCP tools for calendar, tasks, smart home, etc.
const RESPONSE_TEMPLATES = {
  calendar: {
    content: `Here's your calendar for today:

**Morning**
- 9:00 AM - Team standup (30 min)
- 10:30 AM - Project review with Sarah

**Afternoon**
- 2:00 PM - Client call
- 3:30 PM - School pickup

Would you like me to add any events or reschedule something?`,
    suggestions: ['Add an event', 'Show tomorrow', 'Find free time'],
  },
  tasks: {
    content: `You have **2 pending tasks**:

1. [ ] Submit expense report (Due: Today)
2. [ ] Review quarterly goals (Due: Friday)

**Completed today:**
- [x] Morning workout
- [x] Team meeting notes

Would you like to add a new task or check off one of these?`,
    suggestions: ['Add a task', 'Mark task complete', 'Show all tasks'],
  },
  weather: {
    content: `**Current Weather:**
Temperature: 68 F (feels like 65 F)
Conditions: Partly cloudy

**Forecast:**
- This afternoon: 72 F, sunny
- Tonight: 55 F, clear
- Tomorrow: 75 F, mostly sunny

Great day to be outside! Don't forget sunscreen if you're heading out.`,
    suggestions: ['Show weekly forecast', 'Set weather alert', 'Plan outdoor activity'],
  },
  home: {
    content: `**Smart Home Status:**

**Thermostat:** 72 F (set to 70 F)
**Lights:** Living room ON, all others OFF
**Security:** Armed (Away mode)
**Garage:** Closed

All systems are running normally. Would you like to adjust anything?`,
    suggestions: ['Adjust thermostat', 'Turn off all lights', 'Disarm security'],
  },
  greeting: {
    content: `Hello! I'm here to help with whatever you need. I can assist you with:

- **Calendar & Scheduling** - View events, book time, find availability
- **Tasks & Reminders** - Track to-dos, set reminders
- **Smart Home** - Control lights, thermostat, security
- **Family Coordination** - Shared calendars, meal planning

What would you like to work on?`,
    suggestions: ["What's on my calendar?", 'Show pending tasks', 'Smart home status'],
  },
  default: {
    content: `I understand you're asking about that. Let me help!

While I'm still being set up with all my capabilities, I can currently help with:
- Calendar and scheduling
- Task management
- Smart home control
- General questions

Is there something specific from this list I can help with?`,
    suggestions: ['Show my calendar', 'What tasks are due?', 'Home status'],
  },
};

// Simple intent detection - in production, this would use Claude's understanding
function detectIntent(message: string): keyof typeof RESPONSE_TEMPLATES {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('calendar') ||
    lowerMessage.includes('schedule') ||
    lowerMessage.includes('event') ||
    lowerMessage.includes('meeting') ||
    lowerMessage.includes('appointment')
  ) {
    return 'calendar';
  }

  if (
    lowerMessage.includes('task') ||
    lowerMessage.includes('todo') ||
    lowerMessage.includes('pending') ||
    lowerMessage.includes('to-do') ||
    lowerMessage.includes('to do')
  ) {
    return 'tasks';
  }

  if (
    lowerMessage.includes('weather') ||
    lowerMessage.includes('temperature') ||
    lowerMessage.includes('forecast') ||
    lowerMessage.includes('rain') ||
    lowerMessage.includes('sunny')
  ) {
    return 'weather';
  }

  if (
    lowerMessage.includes('home') ||
    lowerMessage.includes('thermostat') ||
    lowerMessage.includes('light') ||
    lowerMessage.includes('security') ||
    lowerMessage.includes('garage') ||
    lowerMessage.includes('door')
  ) {
    return 'home';
  }

  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey') ||
    lowerMessage.includes('help') ||
    lowerMessage.includes('what can you do')
  ) {
    return 'greeting';
  }

  return 'default';
}

// Store messages in memory for now - in production, this would use Firebase
const messageStore: Map<string, Array<Record<string, unknown>>> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { content, userId, userName, sessionId } = body;

    if (!content || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: content, userId, userName' },
        { status: 400 }
      );
    }

    // Store user message
    const userMessageId = generateId();
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'default',
    };

    // Get or create session message history
    const sessionKey = sessionId || `${userId}-default`;
    const history = messageStore.get(sessionKey) || [];
    history.push(userMessage);

    // Detect intent and get response
    const intent = detectIntent(content);
    const template = RESPONSE_TEMPLATES[intent];

    // Simulate some latency for realism
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate response
    const response: ChatResponse = {
      id: generateId(),
      content: template.content,
      timestamp: new Date().toISOString(),
      suggestions: template.suggestions,
    };

    // Store assistant message
    const assistantMessage = {
      id: response.id,
      role: 'assistant',
      content: response.content,
      userId: 'claude',
      userName: 'Claude',
      timestamp: response.timestamp,
      sessionId: sessionId || 'default',
      metadata: {
        intent,
        suggestions: template.suggestions,
      },
    };
    history.push(assistantMessage);
    messageStore.set(sessionKey, history);

    // In production, this would also:
    // 1. Store messages in Firebase
    // 2. Call Claude API for real responses
    // 3. Execute MCP tool calls (calendar, tasks, smart home, etc.)
    // 4. Handle streaming responses

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId parameter' },
        { status: 400 }
      );
    }

    const sessionKey = sessionId || `${userId}-default`;
    const messages = messageStore.get(sessionKey) || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
