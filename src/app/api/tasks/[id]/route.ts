
import { getDb, getCurrentDbTimestamp } from '../../../../../lib/db';
import { logActivity } from '../../../../../lib/activityLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', id);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }
  
  // Get logs for this task
  const logs = await db.all(
    'SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC',
    id
  );
  
  // Include logs in the task response
  const taskWithLogs = { ...task, logs };
  
  return new Response(JSON.stringify(taskWithLogs), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}


export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const data = await request.json();
  // Fetch existing task
  const existing = await db.get('SELECT * FROM tasks WHERE id = ?', id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }
  // Merge fields: use provided value or fallback to existing
  function pickField<T>(field: T | undefined | null, fallback: T): T {
    if (field === undefined || field === null) return fallback;
    if (typeof field === 'string' && field.trim() === '') return fallback;
    return field;
  }
  const title = pickField(data.title, existing.title);
  const description = pickField(data.description, existing.description);
  const status = pickField(data.status, existing.status);
  const task_date = pickField(data.task_date, existing.task_date);
  const start_time = pickField(data.start_time, existing.start_time);
  const end_time = pickField(data.end_time, existing.end_time);

  // Basic validation: end time must be after start time if both are provided
  if (start_time && end_time && end_time <= start_time) {
    return new Response(JSON.stringify({ error: 'End time must be after start time' }), { status: 400 });
  }

  // Log incoming and merged values for debugging
  console.log('EditTask PUT incoming data:', data);
  console.log('EditTask PUT merged:', { title, description, status, task_date, start_time, end_time });

  // Defensive: required fields must not be null, undefined, or empty string
  if (!title || !status || title === '' || status === '') {
    console.error('Edit task failed: missing required fields', { title, description, status, task_date, start_time, end_time });
    return new Response(
      JSON.stringify({ error: 'Missing required fields: title and status are required.' }),
      { status: 400 }
    );
  }
  // Log merged values for debugging
  console.log('Updating task', { id, title, description, status, task_date, start_time, end_time });
  const currentTimestamp = getCurrentDbTimestamp();
  await db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, task_date = ?, start_time = ?, end_time = ?, updated_at = ? WHERE id = ?',
    title,
    description,
    status,
    task_date || null,
    start_time || null,
    end_time || null,
    currentTimestamp,
    id
  );

  // Log the activity
  const statusChanged = existing.status !== status;
  if (statusChanged) {
    const statusText = status === 'done' ? 'completed' : 'marked as pending';
    await logActivity(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} task: "${title}"`);
  } else {
    await logActivity(`Updated task: "${title}"`);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  
  try {
    // First, get the task data before deletion
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    // Get all logs for this task
    const logs = await db.all('SELECT * FROM task_logs WHERE task_id = ?', id);

    // Insert task into deleted_tasks table
    const currentTimestamp = getCurrentDbTimestamp();
    const deletedTaskResult = await db.run(`
      INSERT INTO deleted_tasks (
        original_task_id, title, description, status, task_date, 
        start_time, end_time, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task.id,
      task.title,
      task.description,
      task.status,
      task.task_date,
      task.start_time,
      task.end_time,
      task.created_at,
      task.updated_at,
      currentTimestamp
    ]);

    // Insert logs into deleted_task_logs table
    const deletedTaskId = deletedTaskResult.lastID;
    for (const log of logs) {
      await db.run(`
        INSERT INTO deleted_task_logs (
          deleted_task_id, original_log_id, content, created_at
        ) VALUES (?, ?, ?, ?)
      `, [deletedTaskId, log.id, log.content, log.created_at]);
    }

    // Now delete the original task (logs will be cascade deleted)
    await db.run('DELETE FROM tasks WHERE id = ?', id);
    
    // Log the activity
    await logActivity(`Deleted task: "${task.title}"`);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), { status: 500 });
  }
}
