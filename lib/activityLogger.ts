import { getDb, getCurrentDbTimestamp } from './db';

/**
 * Simple activity logger that records all user actions with timestamps
 */
export async function logActivity(description: string): Promise<void> {
  try {
    const db = await getDb();
    const timestamp = getCurrentDbTimestamp();
    
    await db.run(
      'INSERT INTO activity_log (timestamp, description) VALUES (?, ?)',
      timestamp,
      description
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

/**
 * Get activity logs with optional date filtering
 */
export async function getActivityLogs(
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Array<{ id: number; timestamp: string; description: string; created_at: string }>> {
  try {
    const db = await getDb();
    
    let query = 'SELECT * FROM activity_log';
    const params: string[] = [];
    
    if (startDate || endDate) {
      query += ' WHERE';
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push(' timestamp >= ?');
        params.push(startDate + ' 00:00:00');
      }
      
      if (endDate) {
        conditions.push(' timestamp <= ?');
        params.push(endDate + ' 23:59:59');
      }
      
      query += conditions.join(' AND');
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit.toString());
    
    const logs = await db.all(query, ...params);
    return logs;
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
}