// Function to fetch all tasks via the API, to be called from Gemini function calling

import { convertToIndianTime } from '../../../lib/timeUtils';

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
  
  const tasks = await res.json();
  
  // Convert UTC timestamps to IST for AI display
  const tasksWithConvertedTimestamps = tasks.map((task: any) => ({
    ...task,
    created_at: task.created_at ? convertToIndianTime(task.created_at) : null,
    updated_at: task.updated_at ? convertToIndianTime(task.updated_at) : null,
    logs: task.logs ? task.logs.map((log: any) => ({
      ...log,
      created_at: log.created_at ? convertToIndianTime(log.created_at) : null
    })) : []
  }));
  
  return tasksWithConvertedTimestamps;
}
