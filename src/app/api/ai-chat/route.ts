
import { NextRequest } from 'next/server';


import { GoogleGenAI, Type } from '@google/genai';
import { createTaskFromAI } from '../../aichat/createTaskFromAI';
import { getCurrentDate, getCurrentIndianTime } from '../../../../lib/timeUtils';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const ai = new GoogleGenAI({ apiKey });

// Function to get current date context for AI
function getCurrentDateContext() {
  const today = getCurrentDate(); // YYYY-MM-DD format
  const todayDate = new Date(today);
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

  const todayDisplay = todayDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tomorrowDisplay = tomorrow.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    today,
    tomorrow: tomorrowFormatted,
    todayDisplay,
    tomorrowDisplay,
    currentTime: getCurrentIndianTime()
  };
}

function getSystemPrompt() {
  const dateContext = getCurrentDateContext();

  return `You are an intelligent task management assistant. Your primary role is to help users manage their tasks efficiently using the available functions.

CURRENT DATE & TIME CONTEXT:
- Today is: ${dateContext.todayDisplay} (${dateContext.today})
- Tomorrow is: ${dateContext.tomorrowDisplay} (${dateContext.tomorrow})
- Current time (Indian timezone): ${dateContext.currentTime}
- Use these dates when users say "today", "tomorrow", or don't specify a date

AVAILABLE FUNCTIONS:
1. create_task - Creates new tasks with title, description, optional status (pending/in_progress/completed), optional scheduling (date, start time, end time), and optional initial_log
2. edit_task - Modifies existing tasks by ID, can update any field, and can add a log entry with add_log parameter
3. delete_task - Removes tasks by ID
4. fetch_tasks - Retrieves all tasks to display or analyze, including their logs
5. add_task_log - Adds a log entry to an existing task for progress updates, notes, or status changes

GUIDELINES:
- Always be helpful, friendly, and proactive in task management
- When users mention creating, adding, or making tasks, use create_task
- When users want to see, list, or check their tasks, use fetch_tasks first
- When users want to modify, update, or change tasks, use edit_task
- If the user does not provide a task ID, fetch all tasks and search for the task by name (case-insensitive, fuzzy match allowed). If multiple tasks match, clarify with the user before proceeding.
- When inferring dates, times, or log entries from natural language, always confirm your interpretation with the user before making changes, especially if the input is ambiguous.
- When users want to remove, delete, or complete tasks, use appropriate actions
- For time-sensitive requests, always ask about or suggest time slots
- Provide clear confirmations after task operations
- If a task operation fails, explain what went wrong and suggest alternatives
- When showing tasks, present them in a clear, organized format including logs if they exist
- Help users prioritize and organize their tasks effectively
- When users want to add notes, updates, or progress information to existing tasks, use add_task_log
- When displaying tasks, include relevant log information to provide context
- Encourage users to log their progress and updates on tasks

TASK STATUS MANAGEMENT:
- Use "pending" for new tasks that haven't been started
- Use "in_progress" for tasks currently being worked on
- Use "completed" for finished tasks
- Suggest status changes based on user context

TASK SCHEDULING HANDLING - CRITICAL:
- Use separate fields for date and times: task_date (DATE), start_time (TIME), end_time (TIME)
- Format task_date as "YYYY-MM-DD" (e.g., "${dateContext.today}")
- Format start_time and end_time as "HH:MM" in 24-hour format (e.g., "18:00", "20:00")
- When user provides only time (like "6pm", "18:00", "6 PM"), assume TODAY'S date (${dateContext.today})
- Convert time formats: "6pm" → "18:00", "6 PM" → "18:00", "6:00 PM" → "18:00"
- All times are handled consistently using the app's time utility functions
- Examples of correct scheduling values:
  * "6pm to 8pm today" → task_date: "${dateContext.today}", start_time: "18:00", end_time: "20:00"
  * "tomorrow 9am-11am" → task_date: "${dateContext.tomorrow}", start_time: "09:00", end_time: "11:00"
  * "next Monday from 2pm to 4pm" → calculate the correct date and use format like task_date: "2025-08-04", start_time: "14:00", end_time: "16:00"
- If no date specified, use current date (${dateContext.today})
- End time must be after start time on the same day
- Tasks are limited to single-day duration
- All timestamps are stored in UTC and displayed in user's local timezone (Asia/Kolkata)

CONVERSATION STYLE:
- Be conversational and natural
- Ask clarifying questions when needed
- Provide helpful suggestions and tips
- Acknowledge completed actions clearly
- Be encouraging and supportive about task completion

IMPORTANT:
- If the user requests to update a task but does not provide a task ID, always fetch all tasks and search for the task by name. Use fuzzy matching and confirm with the user if there are multiple possible matches.
- When inferring or updating dates, times, or logs from natural language, always confirm your interpretation with the user before making changes, especially if the input is ambiguous or could be interpreted in multiple ways.
- After making any changes, clearly summarize what was updated, including the task name, date, time, and any log entries added.

Remember: Always use the appropriate function for each user request. Don't just talk about tasks - actually manage them using the available functions.`;
}

type ChatPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };
type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: ChatPart[];
};

export async function POST(req: NextRequest) {
  try {
    const { history } = await req.json();
    const typedHistory: ChatHistoryItem[] = history || [];
    // --- Gemini function declarations for task management ---
    const createTaskFunctionDeclaration = {
      name: 'create_task',
      description: 'Creates a new task with a title, description, optional status, optional scheduling (date, start time, end time), and optional initial log entry.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the task (required).' },
          description: { type: Type.STRING, description: 'A detailed description of the task (required).' },
          status: {
            type: Type.STRING,
            description: 'The status of the task (optional, defaults to "pending").',
            enum: ['pending', 'in_progress', 'completed'],
          },
          task_date: {
            type: Type.STRING,
            description: `The date for the task (optional, format: "YYYY-MM-DD" like "${getCurrentDate()}").`,
          },
          start_time: {
            type: Type.STRING,
            description: 'The start time for the task (optional, format: "HH:MM" in 24-hour format like "18:00").',
          },
          end_time: {
            type: Type.STRING,
            description: 'The end time for the task (optional, format: "HH:MM" in 24-hour format like "20:00").',
          },
          initial_log: {
            type: Type.STRING,
            description: 'An optional initial log entry for the task (e.g., creation notes, initial thoughts).',
          },
        },
        required: ['title', 'description'],
      },
    };

    const deleteTaskFunctionDeclaration = {
      name: 'delete_task',
      description: 'Deletes a task by its unique identifier.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The unique identifier of the task to delete.' },
        },
        required: ['id'],
      },
    };

    const editTaskFunctionDeclaration = {
      name: 'edit_task',
      description: 'Edits an existing task. Provide the task id and any fields to update. Can also add a log entry during the edit.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The unique identifier of the task to edit.' },
          title: { type: Type.STRING, description: 'The new title of the task (optional).' },
          description: { type: Type.STRING, description: 'The new description of the task (optional).' },
          status: {
            type: Type.STRING,
            description: 'The new status of the task (optional).',
            enum: ['pending', 'in_progress', 'completed'],
          },
          task_date: {
            type: Type.STRING,
            description: `The new date for the task (optional, format: "YYYY-MM-DD" like "${getCurrentDate()}").`,
          },
          start_time: {
            type: Type.STRING,
            description: 'The new start time for the task (optional, format: "HH:MM" in 24-hour format like "18:00").',
          },
          end_time: {
            type: Type.STRING,
            description: 'The new end time for the task (optional, format: "HH:MM" in 24-hour format like "20:00").',
          },
          add_log: {
            type: Type.STRING,
            description: 'An optional log entry to add when editing the task (e.g., reason for change, progress update).',
          },
        },
        required: ['id'],
      },
    };

    const fetchTasksFunctionDeclaration = {
      name: 'fetch_tasks',
      description: 'Fetches all tasks with their details, including id, title, description, status, task_date, start_time, end_time, and logs.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
        required: [],
      },
    };

    const addTaskLogFunctionDeclaration = {
      name: 'add_task_log',
      description: 'Adds a log entry to an existing task. Use this when users want to add notes, updates, or progress information to a task.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_id: { type: Type.NUMBER, description: 'The unique identifier of the task to add a log entry to.' },
          content: { type: Type.STRING, description: 'The content of the log entry.' },
        },
        required: ['task_id', 'content'],
      },
    };

    // --- Function calling loop ---
    let contents = typedHistory;
    let finalText = '';
    let functionCallHandled = false;
    const config = {
      systemInstruction: getSystemPrompt(),
      tools: [{ functionDeclarations: [createTaskFunctionDeclaration, deleteTaskFunctionDeclaration, editTaskFunctionDeclaration, fetchTasksFunctionDeclaration, addTaskLogFunctionDeclaration] }],
    };
    // Import new handlers
    const { deleteTaskFromAI, editTaskFromAI } = await import('../../aichat/editDeleteTaskFromAI');
    const { fetchTasksFromAI } = await import('../../aichat/fetchTasksFromAI');
    const { addTaskLogFromAI } = await import('../../aichat/addTaskLogFromAI');
    while (true) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config,
      });
      // If Gemini wants to call a function
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        if (functionCall.name === 'create_task' && functionCall.args) {
          // Actually create the task
          const args = functionCall.args as {
            title: string;
            description: string;
            status?: 'pending' | 'in_progress' | 'completed';
            task_date?: string | null;
            start_time?: string | null;
            end_time?: string | null;
            initial_log?: string | null;
          };
          const createdTask = await createTaskFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: createdTask },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'delete_task' && functionCall.args) {
          const args = functionCall.args as { id: string };
          const deleteResult = await deleteTaskFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: deleteResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'edit_task' && functionCall.args) {
          const args = functionCall.args as {
            id: string;
            title?: string;
            description?: string;
            status?: 'pending' | 'in_progress' | 'completed';
            task_date?: string | null;
            start_time?: string | null;
            end_time?: string | null;
            add_log?: string | null;
          };
          const editResult = await editTaskFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: editResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'fetch_tasks') {
          const tasks = await fetchTasksFromAI();
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: tasks },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'add_task_log' && functionCall.args) {
          const args = functionCall.args as { task_id: number; content: string };
          const logResult = await addTaskLogFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: logResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        }
      } else {
        // No function call, just return the text
        finalText = response.text ?? '';
        break;
      }
    }
    // Streaming response (for now, just send the final text as one chunk)
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ text: finalText })));
        controller.close();
      }
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    // Log error to console with stack trace
    console.error('AI Chat API Error:', err);
    let errorMessage = 'Unknown error';
    let errorStack = '';
    if (err instanceof Error) {
      errorMessage = err.message;
      errorStack = err.stack || '';
    } else if (typeof err === 'object' && err !== null) {
      errorMessage = JSON.stringify(err);
    }
    // Write error to a log file for persistent debugging
    try {
      const fs = require('fs');
      const { getCurrentTimestamp } = await import('../../../../lib/timeUtils');
      fs.appendFileSync(
        './ai-chat-error.log',
        `\n[${getCurrentTimestamp()}] ${errorMessage}\n${errorStack}\n`
      );
    } catch (logErr) {
      console.error('Failed to write to ai-chat-error.log:', logErr);
    }
    return new Response(
      JSON.stringify({ error: errorMessage, stack: errorStack }),
      { status: 500 }
    );
  }
}
