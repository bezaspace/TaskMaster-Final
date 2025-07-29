
import { getDb } from '../../../../lib/db';




export async function GET() {
  try {
    const db = await getDb();
    // Fetch tasks ordered by time_slot (chronological order)
    const tasks = await db.all('SELECT * FROM tasks ORDER BY time_slot ASC, created_at ASC');
    return new Response(JSON.stringify(tasks), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('GET /api/tasks error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}



export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    const { title, description, status, time_slot } = data;
    const result = await db.run(
      'INSERT INTO tasks (title, description, status, time_slot) VALUES (?, ?, ?, ?)',
      title,
      description,
      status || 'pending',
      time_slot || null
    );
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', result.lastID);
    return new Response(JSON.stringify(task), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err: any) {
    console.error('POST /api/tasks error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}
