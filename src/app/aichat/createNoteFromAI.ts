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
  
  return res.json();
}