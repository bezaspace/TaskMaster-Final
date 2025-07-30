import { getDb, getCurrentDbTimestamp, handleSupabaseError } from './db';

/**
 * Simple activity logger that records all user actions with timestamps
 */
export async function logActivity(description: string): Promise<void> {
  try {
    const supabase = getDb();
    const timestamp = getCurrentDbTimestamp();
    
    const { error } = await supabase
      .from('activity_log')
      .insert({
        timestamp,
        description
      });

    if (error) {
      handleSupabaseError(error, 'activity log insert');
    }
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
    const supabase = getDb();
    
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (startDate) {
      query = query.gte('timestamp', startDate + 'T00:00:00.000Z');
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate + 'T23:59:59.999Z');
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      handleSupabaseError(error, 'activity logs fetch');
    }
    
    return logs || [];
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
}