import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // Fetch all tasks with momento task fields
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, status, is_momento_task, momento_start_timestamp, momento_end_timestamp')
      .order('id', { ascending: false });

    if (error) {
      console.error('Debug tasks fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch tasks', details: error.message }), { status: 500 });
    }

    // Also check the schema to see what columns exist
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .in('column_name', ['is_momento_task', 'momento_start_timestamp', 'momento_end_timestamp']);

    return new Response(JSON.stringify({
      tasks: tasks || [],
      schema_columns: columns || [],
      momento_tasks: (tasks || []).filter((task: any) => task.is_momento_task === true),
      active_momento_tasks: (tasks || []).filter((task: any) => 
        task.is_momento_task === true && 
        task.status === 'in_progress' && 
        !task.momento_end_timestamp
      )
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('Debug tasks error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}