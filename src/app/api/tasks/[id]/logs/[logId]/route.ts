import { getDb, getCurrentDbTimestamp } from '../../../../../../../lib/db';
import { logActivity } from '../../../../../../../lib/activityLogger';

// PUT /api/tasks/[id]/logs/[logId] - Update a log entry
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { id, logId } = await params;
    const db = await getDb();
    const data = await request.json();
    const { content } = data;
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }
    
    // Verify task and log exist
    const task = await db.get('SELECT title FROM tasks WHERE id = ?', id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    const existingLog = await db.get('SELECT * FROM task_logs WHERE id = ? AND task_id = ?', logId, id);
    if (!existingLog) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Update log entry
    const currentTimestamp = getCurrentDbTimestamp();
    await db.run(
      'UPDATE task_logs SET content = ?, created_at = ? WHERE id = ? AND task_id = ?',
      content.trim(),
      currentTimestamp,
      logId,
      id
    );
    
    // Get updated log entry
    const updatedLog = await db.get('SELECT * FROM task_logs WHERE id = ?', logId);
    
    // Log the activity
    await logActivity(`Updated log in task "${task.title}": "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`);
    
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
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { id, logId } = await params;
    const db = await getDb();
    
    // Verify task and log exist, and get details for logging
    const task = await db.get('SELECT title FROM tasks WHERE id = ?', id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    const existingLog = await db.get('SELECT * FROM task_logs WHERE id = ? AND task_id = ?', logId, id);
    if (!existingLog) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Delete log entry
    await db.run('DELETE FROM task_logs WHERE id = ? AND task_id = ?', logId, id);
    
    // Log the activity
    await logActivity(`Deleted log from task "${task.title}": "${existingLog.content.substring(0, 50)}${existingLog.content.length > 50 ? '...' : ''}"`);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/tasks/[id]/logs/[logId] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}