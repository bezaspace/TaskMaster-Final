import { getActiveMomentoTasksFromAI } from './momentoTaskFromAI';
import { addTaskLogFromAI } from './addTaskLogFromAI';

/**
 * Automatically logs content to the active momento task if one exists
 * If multiple active momento tasks exist, uses the most recent one
 * If no active momento tasks exist, returns null
 */
export async function autoLogToActiveMomentoTask(content: string) {
  try {
    const activeMomentoTasks = await getActiveMomentoTasksFromAI();
    
    if (activeMomentoTasks.length === 0) {
      return null; // No active momento tasks
    }
    
    // Use the most recent active momento task (first in the array since they're sorted by creation)
    const targetTask = activeMomentoTasks[0];
    
    // Add the log entry
    const logResult = await addTaskLogFromAI({
      task_id: targetTask.id,
      content: content
    });
    
    return {
      success: true,
      task: targetTask,
      log: logResult,
      message: `Logged to active momento task: "${targetTask.title}"`
    };
    
  } catch (error) {
    console.error('Error auto-logging to momento task:', error);
    return null;
  }
}

/**
 * Enhanced add_task_log that automatically uses active momento task if no task_id provided
 */
export async function smartAddTaskLog({ task_id, content }: { task_id?: number; content: string }) {
  // If task_id is provided, use normal add_task_log
  if (task_id) {
    return await addTaskLogFromAI({ task_id, content });
  }
  
  // If no task_id provided, try to log to active momento task
  const momentoResult = await autoLogToActiveMomentoTask(content);
  
  if (momentoResult) {
    return momentoResult;
  }
  
  // If no active momento task, throw error asking user to specify task
  throw new Error('No task specified and no active momento task found. Please specify which task to log to or start a momento task first.');
}