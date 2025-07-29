export interface TaskLog {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  task_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  updated_at: string;
  done?: boolean;
  logs?: TaskLog[];
}

export interface CreateTaskLogRequest {
  content: string;
}

export interface UpdateTaskLogRequest {
  content: string;
}