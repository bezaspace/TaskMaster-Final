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

export async function editTaskFromAI({ id, title, description, status, task_date, start_time, end_time, add_log }: {
  id: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  task_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  add_log?: string | null;
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
    body: JSON.stringify({ title, description, status, task_date, start_time, end_time }),
  });
  if (!res.ok) {
    throw new Error(`Failed to edit task: ${res.statusText}`);
  }
  
  const result = await res.json();
  
  // Add log entry if provided
  if (add_log && add_log.trim()) {
    const logUrl = typeof window === 'undefined'
      ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000') + `/api/tasks/${id}/logs`
      : `/api/tasks/${id}/logs`;
      
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: add_log.trim() }),
    });
  }
  
  return result;
}
