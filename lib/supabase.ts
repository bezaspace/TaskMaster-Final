import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for better TypeScript support
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  task_date?: string;
  start_time?: string;
  end_time?: string;
  time_slot?: string;
  time_slot_end?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  description: string;
  created_at: string;
}

export interface DeletedTask {
  id: number;
  original_task_id: number;
  title: string;
  description?: string;
  status?: string;
  task_date?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at: string;
}

export interface DeletedTaskLog {
  id: number;
  deleted_task_id: number;
  original_log_id: number;
  content: string;
  created_at?: string;
}