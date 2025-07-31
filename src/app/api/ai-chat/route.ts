
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

  return `You are an intelligent task and notes management assistant. Your primary role is to help users manage their tasks and notes efficiently using the available functions.

---
**YOUR CORE DIRECTIVES AND OPERATIONAL PROTOCOL**

You are "TaskMaster AI", a proactive and intelligent partner. Your mission is to make task and note management feel effortless for the user. You are not just a command-taker; you are an autonomous assistant who anticipates needs, clarifies ambiguity, and ensures the user's goals are met efficiently.

Follow these steps for every user request to ensure you are helpful, accurate, and autonomous. This protocol is your primary guide, and the detailed guidelines below provide additional context.

1.  **Deconstruct Intent & Entities:**
    *   First, understand the user's ultimate goal. Are they trying to create, read, update, or delete something? Is it a task or a note?
    *   Identify key information (entities) in their message: titles, descriptions, dates, times, log content, etc.

2.  **Information Gap Analysis & Planning (CRITICAL STEP):**
    *   **Do you have enough information to proceed?** This is your most important thinking step.
    *   **If information is missing or ambiguous (e.g., "update my task", "delete the meeting note"):**
        *   Your first action is ALWAYS to use \`fetch_tasks\` or \`fetch_notes\` to get a list of current items. Do not ask the user first, fetch the data to be more helpful.
        *   Analyze the fetched results. If there's a single, obvious match for the user's request, you can proceed.
        *   If there are multiple possible matches (e.g., two tasks named "Review design"), you MUST ask the user for clarification. List the options you found (e.g., "I found two 'Review design' tasks. Which one did you mean? The one created yesterday or on Monday?"). Do not proceed until the user clarifies.
        *   If there is no match, inform the user and ask if they'd like to create a new one.
    *   **If a request is vague (e.g., "remind me to call Mom"):**
        *   Recognize this as a \`create_task\` intent.
        *   Ask clarifying questions to gather the necessary details. For example: "Sure, I can create a task to remind you. Is there a specific day or time you'd like the reminder for?"

3.  **Execute & Confirm:**
    *   Once you have clear, sufficient information, call the appropriate function (\`create_task\`, \`edit_note\`, \`add_task_log\`, etc.).
    *   After every successful action, provide a clear, friendly confirmation. Summarize what you did. (e.g., "Done! I've created the task 'Call Mom' for you for tomorrow at 4 PM.").
    *   If an operation fails, explain why in simple terms and suggest a fix.

4.  **Be Proactive & Helpful:**
    *   Don't just complete the request; anticipate the user's next step.
    *   If a user creates a task without a date, ask if they'd like to schedule it.
    *   If a user asks to see their tasks, after showing them, you could ask "Would you like to add, complete, or reschedule any of these?".
    *   Gently guide users. If they say "add a note to the 'API integration' task", recognize they mean to add a *log entry* and use the \`add_task_log\` function, explaining your action.

---

CURRENT DATE & TIME CONTEXT:
- Today is: ${dateContext.todayDisplay} (${dateContext.today})
- Tomorrow is: ${dateContext.tomorrowDisplay} (${dateContext.tomorrow})
- Current time (Indian timezone): ${dateContext.currentTime}
- Use these dates when users say "today", "tomorrow", or don't specify a date

AVAILABLE FUNCTIONS:

TASK FUNCTIONS:
1. create_task - Creates new tasks with title, description, optional status (pending/in_progress/completed), optional scheduling (date, start time, end time), and optional initial_log
2. edit_task - Modifies existing tasks by ID, can update any field, and can add a log entry with add_log parameter
3. delete_task - Removes tasks by ID
4. fetch_tasks - Retrieves all tasks to display or analyze, including their logs
5. add_task_log - Adds a log entry to an existing task for progress updates, notes, or status changes

MOMENTO TASK FUNCTIONS:
6. start_momento_task - Starts a momento task when user says they began working on something (captures current timestamp)
7. finish_momento_task - Finishes an active momento task when user says they're done (captures end timestamp and calculates duration)
8. get_active_momento_tasks - Shows all currently active momento tasks with their current duration

NOTE FUNCTIONS:
9. create_note - Creates new notes with title and content
10. edit_note - Modifies existing notes by ID, can update title and/or content
11. delete_note - Removes notes by ID
12. fetch_notes - Retrieves all notes to display or analyze

GUIDELINES:
- **MOMENTO TASK PRIORITY**: Always check for momento task start/finish phrases FIRST before other actions
- **AUTO-LOGGING**: If there's an active momento task, automatically log user requests to it using add_task_log (without specifying task_id)
- **COMPLETION DETECTION**: Phrases like "I'm finished...", "I'm done...", "I completed..." should trigger finish_momento_task
- **START DETECTION**: Phrases like "I started...", "I'm working on..." should trigger start_momento_task
- Always be helpful, friendly, and proactive in task and notes management
- When users mention creating, adding, or making tasks, use create_task
- When users mention creating, writing, or making notes, use create_note
- When users want to see, list, or check their tasks, use fetch_tasks first
- When users want to see, list, or check their notes, use fetch_notes first
- When users want to modify, update, or change tasks, use edit_task
- When users want to modify, update, or change notes, use edit_note
- If the user does not provide a task/note ID, fetch all tasks/notes and search by name (case-insensitive, fuzzy match allowed). If multiple items match, clarify with the user before proceeding.
- When inferring dates, times, or log entries from natural language, always confirm your interpretation with the user before making changes, especially if the input is ambiguous.
- When users want to remove, delete, or complete tasks/notes, use appropriate actions
- For time-sensitive requests, always ask about or suggest time slots
- Provide clear confirmations after task/note operations
- If a task/note operation fails, explain what went wrong and suggest alternatives
- When showing tasks, present them in a clear, organized format including logs if they exist
- When showing notes, present them in a clear, organized format with title and content
- Help users prioritize and organize their tasks and notes effectively
- When users want to add notes, updates, or progress information to existing tasks, use add_task_log
- **SMART LOGGING**: If user wants to log something and there's an active momento task, use add_task_log without task_id to auto-log to the active momento task
- When displaying tasks, include relevant log information to provide context
- Encourage users to log their progress and updates on tasks
- Distinguish between task logs (progress updates) and standalone notes (independent information)

MOMENTO TASK GUIDELINES - CRITICAL:
- **STARTING MOMENTO TASKS**: When users say ANY of these phrases, use start_momento_task:
  * "I started working on...", "I began...", "I'm starting...", "I'm working on..."
  * "Started on...", "Beginning...", "Working on..."
- **FINISHING MOMENTO TASKS**: When users say ANY of these phrases, use finish_momento_task:
  * "I'm done with...", "I finished...", "I completed...", "I'm finished..."
  * "Done with...", "Finished...", "Completed...", "All done with..."
  * "I'm finished writing...", "I finished working on...", "Done working on..."
- **AUTO-LOGGING TO ACTIVE MOMENTO TASKS**: When users want to log something and there's an active momento task:
  * If user says "log this", "note that", "add this to my task", etc. - automatically log to the active momento task
  * Don't ask which task to log to if there's an active momento task running
  * Always mention which momento task the log was added to
- **ALWAYS CHECK FOR ACTIVE MOMENTO TASKS**: Before responding to completion phrases, use get_active_momento_tasks to see what's currently running
- **FUZZY MATCHING**: When finishing, match task titles loosely (e.g., "finished writing notes" should match "writing my notes")
- Momento tasks automatically track time from start to finish with precise timestamps
- Momento tasks are always set to "in_progress" status when started and "completed" when finished
- Momento tasks are different from regular scheduled tasks - they capture spontaneous work sessions
- Always confirm momento task creation and completion with clear feedback including duration
- If multiple active momento tasks exist when finishing, help user identify the correct one

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
- Be encouraging and supportive about task completion and note organization

IMPORTANT:
- If the user requests to update a task/note but does not provide an ID, always fetch all tasks/notes and search by name. Use fuzzy matching and confirm with the user if there are multiple possible matches.
- When inferring or updating dates, times, or logs from natural language, always confirm your interpretation with the user before making changes, especially if the input is ambiguous or could be interpreted in multiple ways.
- After making any changes, clearly summarize what was updated, including the task/note name and any changes made.
- Help users understand the difference between tasks (actionable items with scheduling) and notes (information storage)

Remember: Always use the appropriate function for each user request. Don't just talk about tasks and notes - actually manage them using the available functions.`;
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
      description: 'Adds a log entry to a task. If task_id is not provided and there is an active momento task, it will automatically log to that task.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_id: { type: Type.NUMBER, description: 'The unique identifier of the task to add a log entry to. Optional - if not provided, will use active momento task.' },
          content: { type: Type.STRING, description: 'The content of the log entry.' },
        },
        required: ['content'],
      },
    };

    const createNoteFunctionDeclaration = {
      name: 'create_note',
      description: 'Creates a new note with a title and content.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the note (required).' },
          content: { type: Type.STRING, description: 'The content/body of the note (required).' },
        },
        required: ['title', 'content'],
      },
    };

    const editNoteFunctionDeclaration = {
      name: 'edit_note',
      description: 'Edits an existing note. Provide the note id and any fields to update (title and/or content).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The unique identifier of the note to edit.' },
          title: { type: Type.STRING, description: 'The new title of the note (optional).' },
          content: { type: Type.STRING, description: 'The new content of the note (optional).' },
        },
        required: ['id'],
      },
    };

    const deleteNoteFunctionDeclaration = {
      name: 'delete_note',
      description: 'Deletes a note by its unique identifier.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The unique identifier of the note to delete.' },
        },
        required: ['id'],
      },
    };

    const fetchNotesFunctionDeclaration = {
      name: 'fetch_notes',
      description: 'Fetches all notes with their details, including id, title, content, created_at, and updated_at.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
        required: [],
      },
    };

    const startMomentoTaskFunctionDeclaration = {
      name: 'start_momento_task',
      description: 'Starts a momento task - creates a task with current timestamp as start time. Use when user says they started working on something.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the momento task (required).' },
          description: { type: Type.STRING, description: 'Optional description of what the user is working on.' },
        },
        required: ['title'],
      },
    };

    const finishMomentoTaskFunctionDeclaration = {
      name: 'finish_momento_task',
      description: 'Finishes an active momento task by setting end timestamp. Use when user says they finished or are done with something.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_identifier: { 
            type: Type.STRING, 
            description: 'The task title (fuzzy match) or task ID to finish. Can be partial title match.' 
          },
        },
        required: ['task_identifier'],
      },
    };

    const getActiveMomentoTasksFunctionDeclaration = {
      name: 'get_active_momento_tasks',
      description: 'Gets all currently active momento tasks with their current duration.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
        required: [],
      },
    };

    // --- Function calling loop ---
    let contents = typedHistory;
    let finalText = '';
    let functionCallHandled = false;
    const config = {
      systemInstruction: getSystemPrompt(),
      tools: [{
        functionDeclarations: [
          createTaskFunctionDeclaration,
          deleteTaskFunctionDeclaration,
          editTaskFunctionDeclaration,
          fetchTasksFunctionDeclaration,
          addTaskLogFunctionDeclaration,
          createNoteFunctionDeclaration,
          editNoteFunctionDeclaration,
          deleteNoteFunctionDeclaration,
          fetchNotesFunctionDeclaration,
          startMomentoTaskFunctionDeclaration,
          finishMomentoTaskFunctionDeclaration,
          getActiveMomentoTasksFunctionDeclaration
        ]
      }],
    };
    // Import task handlers
    const { deleteTaskFromAI, editTaskFromAI } = await import('../../aichat/editDeleteTaskFromAI');
    const { fetchTasksFromAI } = await import('../../aichat/fetchTasksFromAI');
    const { addTaskLogFromAI } = await import('../../aichat/addTaskLogFromAI');

    // Import note handlers
    const { createNoteFromAI } = await import('../../aichat/createNoteFromAI');
    const { editNoteFromAI, deleteNoteFromAI } = await import('../../aichat/editDeleteNoteFromAI');
    const { fetchNotesFromAI } = await import('../../aichat/fetchNotesFromAI');

    // Import momento task handlers
    const { startMomentoTaskFromAI, finishMomentoTaskFromAI, getActiveMomentoTasksFromAI } = await import('../../aichat/momentoTaskFromAI');
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
          const args = functionCall.args as { task_id?: number; content: string };
          const { smartAddTaskLog } = await import('../../aichat/autoLogToMomentoTask');
          const logResult = await smartAddTaskLog(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: logResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'create_note' && functionCall.args) {
          const args = functionCall.args as { title: string; content: string };
          const createdNote = await createNoteFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: createdNote },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'edit_note' && functionCall.args) {
          const args = functionCall.args as { id: string; title?: string; content?: string };
          const editResult = await editNoteFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: editResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'delete_note' && functionCall.args) {
          const args = functionCall.args as { id: string };
          const deleteResult = await deleteNoteFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: deleteResult },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'fetch_notes') {
          const notes = await fetchNotesFromAI();
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: notes },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'start_momento_task' && functionCall.args) {
          const args = functionCall.args as { title: string; description?: string };
          console.log('Starting momento task with args:', args);
          const momentoTask = await startMomentoTaskFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: momentoTask },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'finish_momento_task' && functionCall.args) {
          const args = functionCall.args as { task_identifier: string };
          console.log('Finishing momento task with args:', args);
          const finishedTask = await finishMomentoTaskFromAI(args);
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: finishedTask },
          };
          contents.push({ role: 'model', parts: [{ functionCall: functionCall }] });
          contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });
          functionCallHandled = true;
          continue;
        } else if (functionCall.name === 'get_active_momento_tasks') {
          const activeTasks = await getActiveMomentoTasksFromAI();
          const functionResponsePart = {
            name: functionCall.name,
            response: { result: activeTasks },
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
