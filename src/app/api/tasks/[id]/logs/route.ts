import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../../../lib/db';
import { logActivity } from '../../../../../../lib/activityLogger';

// GET /api/tasks/[id]/logs - Get all logs for a task
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getDb();
    
    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();
      
    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Get logs ordered by creation time (newest first)
    const { data: logs, error: logsError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });
    
    if (logsError) {
      handleSupabaseError(logsError, 'logs fetch');
    }
    
    return new Response(JSON.stringify(logs || []), {
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
    const supabase = getDb();
    const data = await request.json();
    const { content } = data;
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }
    
    // Verify task exists and get title for logging
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', id)
      .single();
      
    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    
    // Create log entry
    const currentTimestamp = getCurrentDbTimestamp();
    const { data: log, error: logError } = await supabase
      .from('task_logs')
      .insert({
        task_id: parseInt(id),
        content: content.trim(),
        created_at: currentTimestamp
      })
      .select()
      .single();
    
    if (logError) {
      handleSupabaseError(logError, 'log creation');
    }
    
    // Log the activity
    await logActivity(`Added log to task "${task.title}": "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`);
    
    return new Response(JSON.stringify(log), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err: any) {
    console.error('POST /api/tasks/[id]/logs error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}