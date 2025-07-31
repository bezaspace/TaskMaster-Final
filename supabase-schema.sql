-- TaskMaster Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL editor to create the complete schema

-- Enable UUID extension for better primary keys (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tasks table - Main task management with scheduling
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    task_date DATE,
    start_time TIME,
    end_time TIME,
    time_slot TIMESTAMPTZ,
    time_slot_end TIMESTAMPTZ,
    is_momento_task BOOLEAN DEFAULT FALSE,
    momento_start_timestamp TIMESTAMPTZ,
    momento_end_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Task logs table - Log entries for tasks
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notes table - Standalone notes system
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activity log table - System activity tracking
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deleted tasks table - Soft delete system for tasks
CREATE TABLE IF NOT EXISTS deleted_tasks (
    id SERIAL PRIMARY KEY,
    original_task_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    task_date DATE,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Deleted task logs table - Logs for deleted tasks
CREATE TABLE IF NOT EXISTS deleted_task_logs (
    id SERIAL PRIMARY KEY,
    deleted_task_id INTEGER NOT NULL REFERENCES deleted_tasks(id) ON DELETE CASCADE,
    original_log_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_momento ON tasks(is_momento_task, status) WHERE is_momento_task = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_active_momento ON tasks(is_momento_task, momento_end_timestamp) WHERE is_momento_task = TRUE AND momento_end_timestamp IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_tasks_deleted_at ON deleted_tasks(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_task_logs_deleted_task_id ON deleted_task_logs(deleted_task_id);

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_task_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for now (you can restrict later)
-- For tasks table
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);

-- For task_logs table
CREATE POLICY "Allow all operations on task_logs" ON task_logs FOR ALL USING (true);

-- For notes table
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true);

-- For activity_log table
CREATE POLICY "Allow all operations on activity_log" ON activity_log FOR ALL USING (true);

-- For deleted_tasks table
CREATE POLICY "Allow all operations on deleted_tasks" ON deleted_tasks FOR ALL USING (true);

-- For deleted_task_logs table
CREATE POLICY "Allow all operations on deleted_task_logs" ON deleted_task_logs FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE tasks IS 'Main task management with scheduling capabilities';
COMMENT ON TABLE task_logs IS 'Log entries associated with tasks';
COMMENT ON TABLE notes IS 'Standalone notes system';
COMMENT ON TABLE activity_log IS 'System-wide activity tracking';
COMMENT ON TABLE deleted_tasks IS 'Soft delete system for tasks';
COMMENT ON TABLE deleted_task_logs IS 'Logs for deleted tasks';