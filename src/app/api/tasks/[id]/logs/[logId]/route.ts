import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../../../../lib/db';
import { logActivity } from '../../../../../../../lib/activityLogger';

// PUT /api/tasks/[id]/logs/[logId] - Update a log entry
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { id, logId } = await params;
    const supabase = getDb();
    const data = await request.json();
    const { content } = data;
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }
    
    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', id)
      .single();
      
    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Verify log exists
    const { data: existingLog, error: logError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('id', logId)
      .eq('task_id', id)
      .single();
      
    if (logError || !existingLog) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Update log entry
    const currentTimestamp = getCurrentDbTimestamp();
    const { data: updatedLog, error: updateError } = await supabase
      .from('task_logs')
      .update({
        content: content.trim(),
        created_at: currentTimestamp
      })
      .eq('id', logId)
      .eq('task_id', id)
      .select()
      .single();
    
    if (updateError) {
      handleSupabaseError(updateError, 'log update');
    }
    
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
    const supabase = getDb();
    
    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', id)
      .single();
      
    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Verify log exists and get details for logging
    const { data: existingLog, error: logError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('id', logId)
      .eq('task_id', id)
      .single();
      
    if (logError || !existingLog) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), { status: 404 });
    }
    
    // Delete log entry
    const { error: deleteError } = await supabase
      .from('task_logs')
      .delete()
      .eq('id', logId)
      .eq('task_id', id);
    
    if (deleteError) {
      handleSupabaseError(deleteError, 'log deletion');
    }
    
    // Log the activity
    await logActivity(`Deleted log from task "${task.title}": "${existingLog.content.substring(0, 50)}${existingLog.content.length > 50 ? '...' : ''}"`);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/tasks/[id]/logs/[logId] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}