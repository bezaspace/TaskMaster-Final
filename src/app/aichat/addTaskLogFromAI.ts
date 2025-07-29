// Function to add a log entry to a task via the API, to be called from Gemini function calling
export async function addTaskLogFromAI({ task_id, content }: {
  task_id: number;
  content: string;
}) {
  // Use absolute URL on server, relative on client
  let url = `/api/tasks/${task_id}/logs`;
  if (typeof window === 'undefined') {
    // Running on server (Node.js)
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + `/api/tasks/${task_id}/logs`;
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to add log entry: ${res.statusText}`);
  }
  
  return res.json();
}