import { getDb, handleSupabaseError } from '../../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // Get all deleted tasks ordered by deletion date (newest first)
    const { data: deletedTasks, error: tasksError } = await supabase
      .from('deleted_tasks')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (tasksError) {
      handleSupabaseError(tasksError, 'deleted tasks fetch');
    }

    // Get logs for each deleted task
    const tasksWithLogs = await Promise.all(
      (deletedTasks || []).map(async (task: any) => {
        const { data: logs, error: logsError } = await supabase
          .from('deleted_task_logs')
          .select('*')
          .eq('deleted_task_id', task.id)
          .order('created_at', { ascending: false });
        
        if (logsError) {
          console.error('Error fetching logs for deleted task', task.id, logsError);
        }
        
        return {
          ...task,
          logs: logs || []
        };
      })
    );

    return new Response(JSON.stringify(tasksWithLogs), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch trash' }), { 
      status: 500 
    });
  }
}