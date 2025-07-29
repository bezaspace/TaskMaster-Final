// Function to fetch all notes via the API, to be called from Gemini function calling

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
  
  return res.json();
}