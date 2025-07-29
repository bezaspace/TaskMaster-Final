import { getDb, getCurrentDbTimestamp } from '../../../../../../lib/db';

// GET /api/tasks/[id]/logs - Get all logs for a task
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // Verify task exists
    const task = await db.get('SELECT id FROM tasks WHERE id = ?', id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Get logs ordered by creation time (newest first)
    const logs = await db.all(
      'SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC',
      id
    );
    
    return new Response(JSON.stringify(logs), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('GET /api/tasks/[id]/logs error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

// POST /api/tasks/[id]/logs - Create a new log entry for a task
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const data = await request.json();
    const { content } = data;
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }
    
    // Verify task exists
    const task = await db.get('SELECT id FROM tasks WHERE id = ?', id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Create log entry
    const currentTimestamp = getCurrentDbTimestamp();
    const result = await db.run(
      'INSERT INTO task_logs (task_id, content, created_at) VALUES (?, ?, ?)',
      id,
      content.trim(),
      currentTimestamp
    );
    
    // Return the created log entry
    const log = await db.get('SELECT * FROM task_logs WHERE id = ?', result.lastID);
    
    return new Response(JSON.stringify(log), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err: any) {
    console.error('POST /api/tasks/[id]/logs error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}