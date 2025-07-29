
import { NextRequest } from 'next/server';


import { GoogleGenAI, Type } from '@google/genai';
import { createTaskFromAI } from '../../aichat/createTaskFromAI';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const ai = new GoogleGenAI({ apiKey });

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
    const { history, systemInstruction } = await req.json();
    const typedHistory: ChatHistoryItem[] = history || [];
    // --- Gemini function declarations for task management ---
    const createTaskFunctionDeclaration = {
      name: 'create_task',
      description: 'Creates a new task with a title, description, optional status, and optional time slot.',
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
          time_slot: {
            type: Type.STRING,
            description: 'The time slot for the task (optional, ISO 8601 format or null).',
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
      description: 'Edits an existing task. Provide the task id and any fields to update.',
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
          time_slot: {
            type: Type.STRING,
            description: 'The new time slot for the task (optional, ISO 8601 format or null).',
          },
        },
        required: ['id'],
      },
    };

    const fetchTasksFunctionDeclaration = {
      name: 'fetch_tasks',
      description: 'Fetches all tasks with their details, including id, title, description, status, and time_slot.',
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
      tools: [{ functionDeclarations: [createTaskFunctionDeclaration, deleteTaskFunctionDeclaration, editTaskFunctionDeclaration, fetchTasksFunctionDeclaration] }],
    };
    // Import new handlers
    const { deleteTaskFromAI, editTaskFromAI } = await import('../../aichat/editDeleteTaskFromAI');
    const { fetchTasksFromAI } = await import('../../aichat/fetchTasksFromAI');
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
            time_slot?: string | null;
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
            time_slot?: string | null;
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
      fs.appendFileSync(
        './ai-chat-error.log',
        `\n[${new Date().toISOString()}] ${errorMessage}\n${errorStack}\n`
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
