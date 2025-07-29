
import { getDb, getCurrentDbTimestamp } from '../../../../../lib/db';

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
  if (!title || !description || !status || title === '' || description === '' || status === '') {
    console.error('Edit task failed: missing required fields', { title, description, status, task_date, start_time, end_time });
    return new Response(
      JSON.stringify({ error: 'Missing required fields: title, description, and status are required.' }),
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
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.run('DELETE FROM tasks WHERE id = ?', id);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
