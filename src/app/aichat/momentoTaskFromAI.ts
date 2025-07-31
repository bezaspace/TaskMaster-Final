import { getCurrentDbTimestamp } from '../../../lib/db';
import { convertToIndianTime } from '../../../lib/timeUtils';

/**
 * Starts a momento task - creates a task with current timestamp as start time
 */
export async function startMomentoTaskFromAI({ title, description }: {
  title: string;
  description?: string;
}) {
  const currentTimestamp = getCurrentDbTimestamp();
  
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
    body: JSON.stringify({
      title,
      description: description || `Started working on: ${title}`,
      status: 'in_progress',
      is_momento_task: true,
      momento_start_timestamp: currentTimestamp,
      task_date: null,
      start_time: null,
      end_time: null
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Failed to start momento task: ${errorData.error || res.statusText}`);
  }

  const task = await res.json();
  
  console.log('Created momento task:', task);

  // Add initial log entry
  const logUrl = typeof window === 'undefined'
    ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000') + `/api/tasks/${task.id}/logs`
    : `/api/tasks/${task.id}/logs`;

  try {
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: `Started momento task at ${convertToIndianTime(currentTimestamp)}` 
      }),
    });
  } catch (logError) {
    console.error('Failed to add initial log entry:', logError);
    // Don't throw error for log failure, task creation succeeded
  }

  // Convert UTC timestamps to IST for AI display
  const taskWithConvertedTimestamps = {
    ...task,
    created_at: task.created_at ? convertToIndianTime(task.created_at) : null,
    updated_at: task.updated_at ? convertToIndianTime(task.updated_at) : null,
    momento_start_timestamp: task.momento_start_timestamp ? convertToIndianTime(task.momento_start_timestamp) : null
  };

  return taskWithConvertedTimestamps;
}

/**
 * Finishes a momento task - finds active momento task and sets end timestamp
 */
export async function finishMomentoTaskFromAI({ task_identifier }: {
  task_identifier: string | number;
}) {
  // First, fetch all active momento tasks to find the right one
  let fetchUrl = '/api/tasks';
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    fetchUrl = base + '/api/tasks';
  }

  const fetchRes = await fetch(fetchUrl);
  if (!fetchRes.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const allTasks = await fetchRes.json();
  
  // Find the momento task to finish
  let targetTask = null;
  
  console.log('All tasks:', allTasks.map(t => ({ id: t.id, title: t.title, is_momento_task: t.is_momento_task, status: t.status, momento_end_timestamp: t.momento_end_timestamp })));
  
  // If task_identifier is a number, find by ID
  if (typeof task_identifier === 'number' || !isNaN(Number(task_identifier))) {
    targetTask = allTasks.find((task: any) => 
      task.id === Number(task_identifier) && 
      task.is_momento_task === true && 
      task.status === 'in_progress' &&
      !task.momento_end_timestamp
    );
  } else {
    // If task_identifier is a string, find by title (case-insensitive, fuzzy match)
    const searchTerm = task_identifier.toLowerCase();
    
    // First try exact match
    targetTask = allTasks.find((task: any) => 
      task.is_momento_task === true && 
      task.status === 'in_progress' &&
      !task.momento_end_timestamp &&
      task.title.toLowerCase().includes(searchTerm)
    );
    
    // If no exact match, try partial word matching
    if (!targetTask) {
      const searchWords = searchTerm.split(' ').filter(word => word.length > 2);
      targetTask = allTasks.find((task: any) => 
        task.is_momento_task === true && 
        task.status === 'in_progress' &&
        !task.momento_end_timestamp &&
        searchWords.some(word => task.title.toLowerCase().includes(word))
      );
    }
    
    // If still no match, try finding any active momento task if there's only one
    if (!targetTask) {
      const activeMomentoTasks = allTasks.filter((task: any) => 
        task.is_momento_task === true && 
        task.status === 'in_progress' &&
        !task.momento_end_timestamp
      );
      
      if (activeMomentoTasks.length === 1) {
        targetTask = activeMomentoTasks[0];
        console.log('Using single active momento task as fallback:', targetTask.title);
      }
    }
  }
  
  console.log('Target task found:', targetTask);

  if (!targetTask) {
    // List active momento tasks for user reference
    const activeMomentoTasks = allTasks.filter((task: any) => 
      task.is_momento_task === true && 
      task.status === 'in_progress' &&
      !task.momento_end_timestamp
    );
    
    console.log('Active momento tasks:', activeMomentoTasks);
    
    if (activeMomentoTasks.length === 0) {
      throw new Error('No active momento tasks found to finish.');
    } else {
      const taskList = activeMomentoTasks.map((task: any) => `"${task.title}" (ID: ${task.id})`).join(', ');
      throw new Error(`Could not find momento task "${task_identifier}". Active momento tasks: ${taskList}`);
    }
  }

  const currentTimestamp = getCurrentDbTimestamp();

  // Update the task to mark it as completed
  let updateUrl = `/api/tasks/${targetTask.id}`;
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    updateUrl = base + updateUrl;
  }

  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: targetTask.title,
      description: targetTask.description,
      status: 'completed',
      is_momento_task: true,
      momento_start_timestamp: targetTask.momento_start_timestamp,
      momento_end_timestamp: currentTimestamp,
      task_date: targetTask.task_date,
      start_time: targetTask.start_time,
      end_time: targetTask.end_time
    }),
  });

  if (!updateRes.ok) {
    const errorData = await updateRes.json();
    throw new Error(`Failed to finish momento task: ${errorData.error || updateRes.statusText}`);
  }

  const updatedTask = await updateRes.json();

  // Calculate duration
  const startTime = new Date(targetTask.momento_start_timestamp);
  const endTime = new Date(currentTimestamp);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  
  let durationText = '';
  if (durationHours > 0) {
    durationText = `${durationHours}h ${remainingMinutes}m`;
  } else {
    durationText = `${durationMinutes}m`;
  }

  // Add completion log entry
  const logUrl = typeof window === 'undefined'
    ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000') + `/api/tasks/${targetTask.id}/logs`
    : `/api/tasks/${targetTask.id}/logs`;

  try {
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: `Completed momento task at ${convertToIndianTime(currentTimestamp)}. Duration: ${durationText}` 
      }),
    });
  } catch (logError) {
    console.error('Failed to add completion log entry:', logError);
    // Don't throw error for log failure, task completion succeeded
  }

  // Convert UTC timestamps to IST for AI display
  const taskWithConvertedTimestamps = {
    ...updatedTask,
    created_at: updatedTask.created_at ? convertToIndianTime(updatedTask.created_at) : null,
    updated_at: updatedTask.updated_at ? convertToIndianTime(updatedTask.updated_at) : null,
    momento_start_timestamp: updatedTask.momento_start_timestamp ? convertToIndianTime(updatedTask.momento_start_timestamp) : null,
    momento_end_timestamp: updatedTask.momento_end_timestamp ? convertToIndianTime(updatedTask.momento_end_timestamp) : null,
    duration: durationText
  };

  return taskWithConvertedTimestamps;
}

/**
 * Gets all active momento tasks
 */
export async function getActiveMomentoTasksFromAI() {
  let fetchUrl = '/api/tasks';
  if (typeof window === 'undefined') {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    fetchUrl = base + '/api/tasks';
  }

  const fetchRes = await fetch(fetchUrl);
  if (!fetchRes.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const allTasks = await fetchRes.json();
  
  const activeMomentoTasks = allTasks.filter((task: any) => 
    task.is_momento_task === true && 
    task.status === 'in_progress' &&
    !task.momento_end_timestamp
  );

  // Convert timestamps and add duration info
  return activeMomentoTasks.map((task: any) => {
    const startTime = new Date(task.momento_start_timestamp);
    const now = new Date();
    const durationMs = now.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    
    let durationText = '';
    if (durationHours > 0) {
      durationText = `${durationHours}h ${remainingMinutes}m`;
    } else {
      durationText = `${durationMinutes}m`;
    }

    return {
      ...task,
      created_at: task.created_at ? convertToIndianTime(task.created_at) : null,
      updated_at: task.updated_at ? convertToIndianTime(task.updated_at) : null,
      momento_start_timestamp: task.momento_start_timestamp ? convertToIndianTime(task.momento_start_timestamp) : null,
      current_duration: durationText
    };
  });
}