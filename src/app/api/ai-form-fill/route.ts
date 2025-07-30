import { NextRequest } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getCurrentDate, getCurrentIndianTime } from '../../../../lib/timeUtils';
import { AIFormParseRequest, AIFormParseResponse } from '../../types/aiForm';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const ai = new GoogleGenAI({ apiKey });

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

function getFormParsingPrompt() {
  const dateContext = getCurrentDateContext();
  
  return `You are an AI assistant that parses natural language text to extract task information for a task management form.

CURRENT DATE & TIME CONTEXT:
- Today is: ${dateContext.todayDisplay} (${dateContext.today})
- Tomorrow is: ${dateContext.tomorrowDisplay} (${dateContext.tomorrow})
- Current time (Indian timezone): ${dateContext.currentTime}

Your job is to analyze the user's input text and extract the following information:
1. **title**: A concise task title (required)
2. **description**: A detailed description of the task (required)
3. **task_date**: The date for the task in "YYYY-MM-DD" format (optional)
4. **start_time**: Start time in "HH:MM" 24-hour format (optional)
5. **end_time**: End time in "HH:MM" 24-hour format (optional)

PARSING RULES:
- Extract the most important action or subject as the title (keep it concise, max 50 characters)
- Use the full input text as description, but clean it up and make it coherent
- Parse relative dates: "today" → ${dateContext.today}, "tomorrow" → ${dateContext.tomorrow}
- Parse absolute dates: "Monday", "next week", "January 15th", etc.
- Convert time formats: "3pm" → "15:00", "9:30 AM" → "09:30", "6 PM" → "18:00"
- If time range is given: "3pm to 5pm" → start_time: "15:00", end_time: "17:00"
- If only one time is mentioned, use it as start_time
- If no date is specified but time is given, assume today's date
- Be smart about context: "meeting with John" suggests a meeting, "buy groceries" suggests a shopping task

EXAMPLES:
Input: "Meeting with John tomorrow at 3pm to discuss the project"
Output: {
  "title": "Meeting with John",
  "description": "Meeting with John tomorrow at 3pm to discuss the project",
  "task_date": "${dateContext.tomorrow}",
  "start_time": "15:00",
  "end_time": null
}

Input: "Buy groceries from the store, need milk, bread, and eggs"
Output: {
  "title": "Buy groceries",
  "description": "Buy groceries from the store, need milk, bread, and eggs",
  "task_date": null,
  "start_time": null,
  "end_time": null
}

Input: "Team standup today 9am to 9:30am"
Output: {
  "title": "Team standup",
  "description": "Team standup today 9am to 9:30am",
  "task_date": "${dateContext.today}",
  "start_time": "09:00",
  "end_time": "09:30"
}

Return ONLY a valid JSON object with the extracted information. Do not include any other text or explanation.`;
}

export async function POST(req: NextRequest) {
  try {
    const { text }: AIFormParseRequest = await req.json();
    
    if (!text || text.trim().length === 0) {
      return Response.json({
        success: false,
        error: 'No text provided'
      } as AIFormParseResponse);
    }

    const prompt = getFormParsingPrompt();
    const fullPrompt = `${prompt}\n\nUser input: "${text}"\n\nExtracted task information:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 0.1, // Low temperature for consistent parsing
        maxOutputTokens: 500
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return Response.json({
        success: false,
        error: 'No response from AI'
      } as AIFormParseResponse);
    }

    try {
      // Clean the response to extract JSON
      let jsonText = responseText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0];
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0];
      }
      
      const parsedData = JSON.parse(jsonText.trim());
      
      // Validate the parsed data
      if (!parsedData.title || !parsedData.description) {
        return Response.json({
          success: false,
          error: 'AI could not extract required title and description'
        } as AIFormParseResponse);
      }

      return Response.json({
        success: true,
        data: {
          title: parsedData.title,
          description: parsedData.description,
          task_date: parsedData.task_date || null,
          start_time: parsedData.start_time || null,
          end_time: parsedData.end_time || null
        },
        confidence: 0.8 // Default confidence score
      } as AIFormParseResponse);

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Response:', responseText);
      return Response.json({
        success: false,
        error: 'Failed to parse AI response'
      } as AIFormParseResponse);
    }

  } catch (error) {
    console.error('AI Form Fill API Error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    } as AIFormParseResponse, { status: 500 });
  }
}