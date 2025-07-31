
import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../lib/db';
import { logActivity } from '../../../../lib/activityLogger';

export async function GET() {
  try {
    const supabase = getDb();

    // Fetch tasks ordered by execution time (scheduled tasks first, then unscheduled)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('task_date', { ascending: true, nullsFirst: false })
      .order('start_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Supabase tasks fetch error:', tasksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch tasks', details: tasksError.message }), { status: 500 });
    }

    // Fetch logs for each task
    const tasksWithLogs = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const { data: logs, error: logsError } = await supabase
          .from('task_logs')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false });

        if (logsError) {
          console.error('Error fetching logs for task', task.id, logsError);
          return { ...task, logs: [] };
        }

        return { ...task, logs: logs || [] };
      })
    );

    return new Response(JSON.stringify(tasksWithLogs), {
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
    const supabase = getDb();
    const data = await request.json();
    const {
      title,
      description,
      status,
      task_date,
      start_time,
      end_time,
      is_momento_task,
      momento_start_timestamp,
      momento_end_timestamp
    } = data;

    // Basic validation: end time must be after start time if both are provided
    if (start_time && end_time && end_time <= start_time) {
      return new Response(JSON.stringify({ error: 'End time must be after start time' }), { status: 400 });
    }

    const currentTimestamp = getCurrentDbTimestamp();
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status: status || 'pending',
        task_date: task_date || null,
        start_time: start_time || null,
        end_time: end_time || null,
        is_momento_task: is_momento_task || false,
        momento_start_timestamp: momento_start_timestamp || null,
        momento_end_timestamp: momento_end_timestamp || null,
        created_at: currentTimestamp,
        updated_at: currentTimestamp
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'task creation');
    }

    // Log the activity
    const activityMessage = is_momento_task
      ? `Started momento task: "${title}"`
      : `Created task: "${title}"`;
    await logActivity(activityMessage);

    return new Response(JSON.stringify(task), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err: any) {
    console.error('POST /api/tasks error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}
