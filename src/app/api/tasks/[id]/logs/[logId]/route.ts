import { getDb } from '../../../../../../../lib/db';

// PUT /api/tasks/[id]/logs/[logId] - Update a log entry
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    const { id, logId } = await params;
    const db = await getDb();
    const data = await request.json();
    const { content } = data;
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }
    
    // Verify log exists and belongs to the task
    const log = await db.get(
      'SELECT * FROM task_logs WHERE id = ? AND task_id = ?',
      logId,
      id
    );
    
    if (!log) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Update log entry
    await db.run(
      'UPDATE task_logs SET content = ? WHERE id = ?',
      content.trim(),
      logId
    );
    
    // Return updated log entry
    const updatedLog = await db.get('SELECT * FROM task_logs WHERE id = ?', logId);
    
    return new Response(JSON.stringify(updatedLog), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('PUT /api/tasks/[id]/logs/[logId] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

// DELETE /api/tasks/[id]/logs/[logId] - Delete a log entry
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    const { id, logId } = await params;
    const db = await getDb();
    
    // Verify log exists and belongs to the task
    const log = await db.get(
      'SELECT * FROM task_logs WHERE id = ? AND task_id = ?',
      logId,
      id
    );
    
    if (!log) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Delete log entry
    await db.run('DELETE FROM task_logs WHERE id = ?', logId);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/tasks/[id]/logs/[logId] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}