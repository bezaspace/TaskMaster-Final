import { convertToIndianTime } from '../../../lib/timeUtils';

// Function to create a note via the API, to be called from Gemini function calling
export async function createNoteFromAI({ title, content }: {
  title: string;
  content: string;
}) {
  // Use absolute URL on server, relative on client
  let url = '/api/notes';
  if (typeof window === 'undefined') {
    // Running on server (Node.js)
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + '/api/notes';
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to create note: ${res.statusText}`);
  }
  
  const note = await res.json();
  
  // Convert UTC timestamps to IST for AI display
  const noteWithConvertedTimestamps = {
    ...note,
    created_at: note.created_at ? convertToIndianTime(note.created_at) : null,
    updated_at: note.updated_at ? convertToIndianTime(note.updated_at) : null
  };
  
  return noteWithConvertedTimestamps;
}