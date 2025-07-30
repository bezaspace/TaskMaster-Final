
import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../../lib/db';
import { logActivity } from '../../../../../lib/activityLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getDb();
  
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
    
  if (taskError || !task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }
  
  // Get logs for this task
  const { data: logs, error: logsError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('task_id', id)
    .order('created_at', { ascending: false });
  
  if (logsError) {
    console.error('Error fetching logs:', logsError);
  }
  
  // Include logs in the task response
  const taskWithLogs = { ...task, logs: logs || [] };
  
  return new Response(JSON.stringify(taskWithLogs), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}


export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getDb();
  const data = await request.json();
  
  // Fetch existing task
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
    
  if (fetchError || !existing) {
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
  if (!title || !status || title === '' || status === '') {
    console.error('Edit task failed: missing required fields', { title, description, status, task_date, start_time, end_time });
    return new Response(
      JSON.stringify({ error: 'Missing required fields: title and status are required.' }),
      { status: 400 }
    );
  }
  
  // Log merged values for debugging
  console.log('Updating task', { id, title, description, status, task_date, start_time, end_time });
  const currentTimestamp = getCurrentDbTimestamp();
  
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      status,
      task_date: task_date || null,
      start_time: start_time || null,
      end_time: end_time || null,
      updated_at: currentTimestamp
    })
    .eq('id', id);

  if (updateError) {
    handleSupabaseError(updateError, 'task update');
  }

  // Log the activity
  const statusChanged = existing.status !== status;
  if (statusChanged) {
    const statusText = status === 'done' ? 'completed' : 'marked as pending';
    await logActivity(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} task: "${title}"`);
  } else {
    await logActivity(`Updated task: "${title}"`);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getDb();
  
  try {
    // First, get the task data before deletion
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    // Get all logs for this task
    const { data: logs, error: logsError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', id);

    if (logsError) {
      console.error('Error fetching logs for deletion:', logsError);
    }

    // Insert task into deleted_tasks table
    const currentTimestamp = getCurrentDbTimestamp();
    const { data: deletedTask, error: deletedTaskError } = await supabase
      .from('deleted_tasks')
      .insert({
        original_task_id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        task_date: task.task_date,
        start_time: task.start_time,
        end_time: task.end_time,
        created_at: task.created_at,
        updated_at: task.updated_at,
        deleted_at: currentTimestamp
      })
      .select()
      .single();

    if (deletedTaskError) {
      handleSupabaseError(deletedTaskError, 'deleted task creation');
    }

    // Insert logs into deleted_task_logs table
    if (logs && logs.length > 0 && deletedTask) {
      const deletedLogs = logs.map(log => ({
        deleted_task_id: deletedTask.id,
        original_log_id: log.id,
        content: log.content,
        created_at: log.created_at
      }));

      const { error: deletedLogsError } = await supabase
        .from('deleted_task_logs')
        .insert(deletedLogs);

      if (deletedLogsError) {
        console.error('Error inserting deleted logs:', deletedLogsError);
      }
    }

    // Now delete the original task (logs will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      handleSupabaseError(deleteError, 'task deletion');
    }
    
    // Log the activity
    await logActivity(`Deleted task: "${task.title}"`);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), { status: 500 });
  }
}
