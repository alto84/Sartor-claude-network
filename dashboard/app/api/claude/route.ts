/**
 * Claude Code API Route
 *
 * Handles Claude Code background tasks and quick questions.
 * Uses the Agent SDK pattern for spawning Claude Code subprocess.
 *
 * @module app/api/claude/route
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface TaskRequest {
  action: 'create-task' | 'quick-ask' | 'get-suggestions' | 'get-tasks' | 'get-task' | 'update-task' | 'cancel-task' | 'retry-task';
  type?: 'analyze' | 'organize' | 'summarize' | 'generate' | 'answer';
  prompt?: string;
  question?: string;
  context?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  taskId?: string;
  status?: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
  error?: string;
  createdBy?: string;
}

interface TaskRecord {
  id: string;
  type: string;
  prompt: string;
  context?: Record<string, unknown>;
  status: 'pending' | 'running' | 'complete' | 'error';
  priority: string;
  result?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: string;
}

// In-memory task storage (in production, use Firebase)
const tasks: Map<string, TaskRecord> = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate Claude Code response for quick questions
 * In production, this would spawn Claude Code subprocess
 */
async function getClaudeResponse(question: string, context?: Record<string, unknown>): Promise<{
  answer: string;
  suggestions?: string[];
}> {
  // Simulated responses based on question context
  // In production, this would use the Agent SDK to spawn Claude Code

  const contextInfo = context ? Object.keys(context).join(', ') : 'general';

  // Generate contextual response
  const responses: Record<string, { answer: string; suggestions: string[] }> = {
    schedule: {
      answer: "Looking at your schedule, I notice you have a busy afternoon. You have a team meeting at 2pm followed by school pickup at 3pm. The timing is tight - I'd suggest wrapping up the meeting by 2:45pm to give yourself buffer time for the drive.",
      suggestions: [
        "Should I set a reminder 15 minutes before the meeting ends?",
        "Want me to check traffic conditions for the school route?",
        "Should I notify the school about potential late arrival?"
      ]
    },
    email: {
      answer: "You have 5 unread emails. Two appear urgent: one from your manager about tomorrow's presentation, and one from the school about a schedule change. The rest are newsletters and updates.",
      suggestions: [
        "Want me to summarize the urgent emails?",
        "Should I draft a response to your manager?",
        "Would you like me to categorize your inbox?"
      ]
    },
    tasks: {
      answer: "You have 4 pending tasks. The highest priority is submitting the expense report which is due today. The grocery shopping and homework check can wait until this evening.",
      suggestions: [
        "Should I prioritize your task list?",
        "Want me to set reminders for each task?",
        "Should I break down the expense report into steps?"
      ]
    },
    general: {
      answer: "I'm here to help! I can analyze schedules, summarize emails, organize documents, answer questions, and help coordinate family activities. What would you like me to help with?",
      suggestions: [
        "Check today's schedule for conflicts",
        "Summarize recent emails",
        "What tasks are due soon?"
      ]
    }
  };

  // Determine best response based on question content
  const lowerQuestion = question.toLowerCase();
  let responseKey = 'general';

  if (lowerQuestion.includes('schedule') || lowerQuestion.includes('meeting') || lowerQuestion.includes('calendar')) {
    responseKey = 'schedule';
  } else if (lowerQuestion.includes('email') || lowerQuestion.includes('inbox') || lowerQuestion.includes('message')) {
    responseKey = 'email';
  } else if (lowerQuestion.includes('task') || lowerQuestion.includes('todo') || lowerQuestion.includes('pending')) {
    responseKey = 'tasks';
  }

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  return responses[responseKey];
}

/**
 * Generate smart suggestions based on context
 */
async function generateSuggestions(context: {
  calendarEvents?: unknown[];
  pendingTasks?: unknown[];
  recentEmails?: unknown[];
  familyMembers?: unknown[];
}): Promise<string[]> {
  const suggestions: string[] = [];

  // Check calendar for busy days
  if (context.calendarEvents && Array.isArray(context.calendarEvents) && context.calendarEvents.length > 3) {
    suggestions.push("I noticed you have a busy day tomorrow. Want me to summarize what's coming up?");
  }

  // Check for pending tasks
  if (context.pendingTasks && Array.isArray(context.pendingTasks) && context.pendingTasks.length > 0) {
    suggestions.push(`You have ${context.pendingTasks.length} pending tasks. Should I help prioritize them?`);
  }

  // Check for unread emails
  if (context.recentEmails && Array.isArray(context.recentEmails) && context.recentEmails.length > 5) {
    suggestions.push("Your inbox is getting full. Want me to summarize the important emails?");
  }

  // Family-related suggestions
  if (context.familyMembers && Array.isArray(context.familyMembers)) {
    suggestions.push("Want me to check if there are any scheduling conflicts for the family this week?");
  }

  // Default suggestions if none generated
  if (suggestions.length === 0) {
    suggestions.push(
      "How can I help you today?",
      "Want me to check your schedule for the week?",
      "Should I summarize any pending items?"
    );
  }

  return suggestions;
}

/**
 * Process a background task
 * In production, this would spawn Claude Code subprocess
 */
async function processTask(task: TaskRecord): Promise<{ result?: string; error?: string }> {
  // Simulate task processing based on type
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const results: Record<string, string> = {
    analyze: `Analysis complete! I reviewed the provided data and found the following insights:\n\n1. **Key Findings**: The data shows consistent patterns with a few notable exceptions.\n2. **Recommendations**: Consider adjusting the schedule to avoid the 3-4pm time slot which seems overbooked.\n3. **Action Items**: No urgent conflicts detected, but there are 2 items that need attention by end of week.`,

    organize: `Organization complete! I've categorized the items as follows:\n\n- **High Priority (3 items)**: Requires immediate attention\n- **Medium Priority (5 items)**: Should be addressed this week\n- **Low Priority (7 items)**: Can be deferred\n\nI've also suggested tags and created a logical folder structure.`,

    summarize: `Summary ready!\n\n**Main Points:**\n- 3 action items identified\n- 2 upcoming deadlines mentioned\n- 1 urgent request that needs response\n\n**Key Takeaways:**\nThe most important item is the project deadline on Friday. I recommend prioritizing the team sync tomorrow to ensure alignment.`,

    generate: `Report generated!\n\n## Weekly Family Update\n\n### This Week's Highlights\n- Completed 8 out of 10 scheduled tasks\n- All family members attended their activities on time\n- Successfully coordinated 3 shared events\n\n### Upcoming\n- Parent-teacher conference on Wednesday\n- Soccer tournament on Saturday\n\n### Recommendations\n- Consider meal prepping on Sunday for the busy week ahead`,

    answer: `Based on my analysis:\n\nThe answer to your question involves several factors. Let me break it down:\n\n1. **Context**: Looking at the information provided...\n2. **Analysis**: The key considerations are...\n3. **Recommendation**: Based on everything, I suggest...\n\nWould you like me to elaborate on any of these points?`,
  };

  // Randomly simulate an error (10% chance for demo purposes)
  if (Math.random() < 0.1) {
    return { error: 'Task processing encountered an issue. Please retry.' };
  }

  return { result: results[task.type] || results.answer };
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST handler for Claude operations
 */
export async function POST(request: NextRequest) {
  try {
    const body: TaskRequest = await request.json();

    switch (body.action) {
      case 'quick-ask': {
        if (!body.question) {
          return NextResponse.json(
            { error: 'Question is required' },
            { status: 400 }
          );
        }

        const response = await getClaudeResponse(body.question, body.context);
        return NextResponse.json(response);
      }

      case 'get-suggestions': {
        const suggestions = await generateSuggestions(body.context || {});
        return NextResponse.json({ suggestions });
      }

      case 'create-task': {
        if (!body.type || !body.prompt) {
          return NextResponse.json(
            { error: 'Task type and prompt are required' },
            { status: 400 }
          );
        }

        const task: TaskRecord = {
          id: generateTaskId(),
          type: body.type,
          prompt: body.prompt,
          context: body.context,
          status: 'pending',
          priority: body.priority || 'normal',
          createdAt: new Date(),
          createdBy: body.createdBy,
        };

        tasks.set(task.id, task);

        // Start processing the task asynchronously
        // In production, this would queue the task for the Agent SDK
        setTimeout(async () => {
          const taskToProcess = tasks.get(task.id);
          if (taskToProcess && taskToProcess.status === 'pending') {
            // Mark as running
            tasks.set(task.id, {
              ...taskToProcess,
              status: 'running',
              startedAt: new Date(),
            });

            // Process the task
            const result = await processTask(taskToProcess);

            // Update with result
            const updatedTask = tasks.get(task.id);
            if (updatedTask) {
              tasks.set(task.id, {
                ...updatedTask,
                status: result.error ? 'error' : 'complete',
                result: result.result,
                error: result.error,
                completedAt: new Date(),
              });
            }
          }
        }, 100);

        return NextResponse.json(task, { status: 201 });
      }

      case 'update-task': {
        if (!body.taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          );
        }

        const task = tasks.get(body.taskId);
        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        const updatedTask: TaskRecord = {
          ...task,
          ...(body.status && { status: body.status }),
          ...(body.result && { result: body.result }),
          ...(body.error && { error: body.error }),
          ...(body.status === 'running' && { startedAt: new Date() }),
          ...(body.status === 'complete' || body.status === 'error'
            ? { completedAt: new Date() }
            : {}),
        };

        tasks.set(body.taskId, updatedTask);
        return NextResponse.json(updatedTask);
      }

      case 'cancel-task': {
        if (!body.taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          );
        }

        const task = tasks.get(body.taskId);
        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        if (task.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending tasks can be cancelled' },
            { status: 400 }
          );
        }

        const cancelledTask: TaskRecord = {
          ...task,
          status: 'error',
          error: 'Cancelled by user',
          completedAt: new Date(),
        };

        tasks.set(body.taskId, cancelledTask);
        return NextResponse.json(cancelledTask);
      }

      case 'retry-task': {
        if (!body.taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          );
        }

        const task = tasks.get(body.taskId);
        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        if (task.status !== 'error') {
          return NextResponse.json(
            { error: 'Only failed tasks can be retried' },
            { status: 400 }
          );
        }

        // Create a new task with the same parameters
        const newTask: TaskRecord = {
          id: generateTaskId(),
          type: task.type,
          prompt: task.prompt,
          context: task.context,
          status: 'pending',
          priority: task.priority,
          createdAt: new Date(),
          createdBy: task.createdBy,
        };

        tasks.set(newTask.id, newTask);

        // Start processing
        setTimeout(async () => {
          const taskToProcess = tasks.get(newTask.id);
          if (taskToProcess && taskToProcess.status === 'pending') {
            tasks.set(newTask.id, {
              ...taskToProcess,
              status: 'running',
              startedAt: new Date(),
            });

            const result = await processTask(taskToProcess);

            const updatedTask = tasks.get(newTask.id);
            if (updatedTask) {
              tasks.set(newTask.id, {
                ...updatedTask,
                status: result.error ? 'error' : 'complete',
                result: result.result,
                error: result.error,
                completedAt: new Date(),
              });
            }
          }
        }, 100);

        return NextResponse.json(newTask, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const stats = searchParams.get('stats') === 'true';

    // Return stats if requested
    if (stats) {
      const allTasks = Array.from(tasks.values());
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTasks = allTasks.filter(t => t.createdAt >= today);
      const completedTasks = allTasks.filter(t =>
        t.status === 'complete' && t.startedAt && t.completedAt
      );

      const averageDuration = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            const duration = t.completedAt!.getTime() - t.startedAt!.getTime();
            return sum + duration / 1000;
          }, 0) / completedTasks.length
        : 0;

      return NextResponse.json({
        pending: allTasks.filter(t => t.status === 'pending').length,
        running: allTasks.filter(t => t.status === 'running').length,
        completed: allTasks.filter(t => t.status === 'complete').length,
        errors: allTasks.filter(t => t.status === 'error').length,
        totalToday: todayTasks.length,
        averageDuration: Math.round(averageDuration),
      });
    }

    // Return single task if ID provided
    if (taskId) {
      const task = tasks.get(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(task);
    }

    // Return filtered list of tasks
    let taskList = Array.from(tasks.values());

    if (status) {
      taskList = taskList.filter(t => t.status === status);
    }

    if (type) {
      taskList = taskList.filter(t => t.type === type);
    }

    // Sort by creation date (newest first)
    taskList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = taskList.length;
    taskList = taskList.slice(offset, offset + limit);

    return NextResponse.json({
      tasks: taskList,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
