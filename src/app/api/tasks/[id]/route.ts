
import { getDb } from '../../../../../lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', id);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(task), {
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
  const time_slot = pickField(data.time_slot, existing.time_slot);

  // Log incoming and merged values for debugging
  console.log('EditTask PUT incoming data:', data);
  console.log('EditTask PUT merged:', { title, description, status, time_slot });

  // Defensive: required fields must not be null, undefined, or empty string
  if (!title || !description || !status || title === '' || description === '' || status === '') {
    console.error('Edit task failed: missing required fields', { title, description, status, time_slot });
    return new Response(
      JSON.stringify({ error: 'Missing required fields: title, description, and status are required.' }),
      { status: 400 }
    );
  }
  // Log merged values for debugging
  console.log('Updating task', { id, title, description, status, time_slot });
  await db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, time_slot = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    title,
    description,
    status,
    time_slot || null,
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
