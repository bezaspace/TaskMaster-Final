
import { getDb } from '../../../../lib/db';




export async function GET() {
  try {
    const db = await getDb();
    // Fetch tasks ordered by date and start time (chronological order)
    const tasks = await db.all('SELECT * FROM tasks ORDER BY task_date ASC, start_time ASC, created_at ASC');
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
    const { title, description, status, task_date, start_time, end_time } = data;
    
    // Basic validation: end time must be after start time if both are provided
    if (start_time && end_time && end_time <= start_time) {
      return new Response(JSON.stringify({ error: 'End time must be after start time' }), { status: 400 });
    }
    
    const result = await db.run(
      'INSERT INTO tasks (title, description, status, task_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      title,
      description,
      status || 'pending',
      task_date || null,
      start_time || null,
      end_time || null
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
