// Function to create a task via the API, to be called from Gemini function calling
export async function createTaskFromAI({ title, description, status = 'pending', time_slot = null }: {
  title: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed';
  time_slot?: string | null;
}) {
  // Use absolute URL on server, relative on client
  let url = '/api/tasks';
  if (typeof window === 'undefined') {
    // Running on server (Node.js)
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + '/api/tasks';
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, status, time_slot }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  return res.json();
}
