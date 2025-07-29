// Functions to edit and delete a note via the API, to be called from Gemini function calling

export async function deleteNoteFromAI({ id }: { id: string }) {
  let url = `/api/notes/${id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + `/api/notes/${id}`;
  }
  
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete note: ${res.statusText}`);
  }
  
  return res.json();
}

export async function editNoteFromAI({ id, title, content }: {
  id: string;
  title?: string;
  content?: string;
}) {
  if (!title && !content) {
    throw new Error('At least title or content must be provided for editing');
  }
  
  // First fetch the current note to get existing values
  let fetchUrl = `/api/notes/${id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    fetchUrl = base + `/api/notes/${id}`;
  }
  
  const fetchRes = await fetch(fetchUrl, { method: 'GET' });
  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch note for editing: ${fetchRes.statusText}`);
  }
  
  const currentNote = await fetchRes.json();
  
  // Use provided values or fall back to current values
  const updatedTitle = title || currentNote.title;
  const updatedContent = content || currentNote.content;
  
  let url = `/api/notes/${id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + `/api/notes/${id}`;
  }
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      title: updatedTitle, 
      content: updatedContent 
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to edit note: ${res.statusText}`);
  }
  
  return res.json();
}