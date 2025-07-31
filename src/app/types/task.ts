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
  is_momento_task?: boolean;
  momento_start_timestamp?: string | null;
  momento_end_timestamp?: string | null;
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

export interface DeletedTaskLog {
  id: number;
  deleted_task_id: number;
  original_log_id: number;
  content: string;
  created_at: string;
}

export interface DeletedTask {
  id: number;
  original_task_id: number;
  title: string;
  description?: string;
  status: string;
  task_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_momento_task?: boolean;
  momento_start_timestamp?: string | null;
  momento_end_timestamp?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  logs?: DeletedTaskLog[];
}

export interface MomentoTaskRequest {
  title: string;
  description?: string;
}

export interface FinishMomentoTaskRequest {
  task_identifier: string | number;
}