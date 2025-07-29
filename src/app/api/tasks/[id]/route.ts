
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
  const { title, description, status, time_slot } = data;
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
