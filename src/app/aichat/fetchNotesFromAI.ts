// Function to fetch all notes via the API, to be called from Gemini function calling

import { convertToIndianTime } from '../../../lib/timeUtils';

export async function fetchNotesFromAI() {
  let url = '/api/notes';
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + '/api/notes';
  }
  
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.statusText}`);
  }
  
  const notes = await res.json();
  
  // Convert UTC timestamps to IST for AI display
  const notesWithConvertedTimestamps = notes.map((note: any) => ({
    ...note,
    created_at: note.created_at ? convertToIndianTime(note.created_at) : null,
    updated_at: note.updated_at ? convertToIndianTime(note.updated_at) : null
  }));
  
  return notesWithConvertedTimestamps;
}