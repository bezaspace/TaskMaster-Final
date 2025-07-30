import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get all deleted tasks ordered by deletion date (newest first)
    const deletedTasks = await db.all(`
      SELECT * FROM deleted_tasks 
      ORDER BY deleted_at DESC
    `);

    // Get logs for each deleted task
    const tasksWithLogs = await Promise.all(
      deletedTasks.map(async (task) => {
        const logs = await db.all(`
          SELECT * FROM deleted_task_logs 
          WHERE deleted_task_id = ? 
          ORDER BY created_at DESC
        `, task.id);
        
        return {
          ...task,
          logs
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