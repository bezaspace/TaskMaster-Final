import { validateTimeRange, parseToTaskDate, parseToTaskTime, convertToIndianTime } from '../../../lib/timeUtils';

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
  // Parse and validate time inputs if provided
  const parsedDate = task_date ? parseToTaskDate(task_date) : undefined;
  const parsedStartTime = start_time ? parseToTaskTime(start_time) : undefined;
  const parsedEndTime = end_time ? parseToTaskTime(end_time) : undefined;
  
  // Validate time range if both times are provided
  if (parsedStartTime !== undefined && parsedEndTime !== undefined) {
    if (!validateTimeRange(parsedStartTime, parsedEndTime)) {
      throw new Error('End time must be after start time');
    }
  }
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
    body: JSON.stringify({ 
      title, 
      description, 
      status, 
      task_date: parsedDate, 
      start_time: parsedStartTime, 
      end_time: parsedEndTime 
    }),
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
  
  // Convert UTC timestamps to IST for AI display
  const resultWithConvertedTimestamps = {
    ...result,
    created_at: result.created_at ? convertToIndianTime(result.created_at) : null,
    updated_at: result.updated_at ? convertToIndianTime(result.updated_at) : null
  };
  
  return resultWithConvertedTimestamps;
}
