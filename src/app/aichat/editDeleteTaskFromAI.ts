// Functions to edit and delete a task via the API, to be called from Gemini function calling

export async function deleteTaskFromAI({ id }: { id: string }) {
  let url = `/api/tasks/${id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + `/api/tasks/${id}`;
  }
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete task: ${res.statusText}`);
  }
  return res.json();
}

export async function editTaskFromAI({ id, title, description, status, time_slot }: {
  id: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  time_slot?: string | null;
}) {
  let url = `/api/tasks/${id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + `/api/tasks/${id}`;
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, status, time_slot }),
  });
  if (!res.ok) {
    throw new Error(`Failed to edit task: ${res.statusText}`);
  }
  return res.json();
}
