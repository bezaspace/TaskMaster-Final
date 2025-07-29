// Function to fetch all tasks via the API, to be called from Gemini function calling

export async function fetchTasksFromAI() {
  let url = '/api/tasks';
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    url = base + '/api/tasks';
  }
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  return res.json();
}
