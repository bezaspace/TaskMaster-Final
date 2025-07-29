
import { NextRequest } from 'next/server';

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const ai = new GoogleGenAI({ apiKey });

type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export async function POST(req: NextRequest) {
  try {
    const { history, systemInstruction } = await req.json();
    const typedHistory: ChatHistoryItem[] = history || [];
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: typedHistory,
      ...(systemInstruction ? { systemInstruction } : {}),
    });
    const lastUserMessage = typedHistory?.filter((h: ChatHistoryItem) => h.role === 'user').slice(-1)[0]?.parts[0]?.text;
    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: 'No user message provided.' }), { status: 400 });
    }
    // Streaming response
    const stream = await chat.sendMessageStream({ message: lastUserMessage });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let text = '';
        for await (const chunk of stream) {
          text += chunk.text;
          controller.enqueue(encoder.encode(JSON.stringify({ text: chunk.text })));
        }
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
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
}
