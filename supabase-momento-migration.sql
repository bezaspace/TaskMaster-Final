-- Momento Tasks Migration for Supabase
-- Run this SQL in your Supabase SQL editor to add momento task support

-- Add momento task columns to the tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_momento_task BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS momento_start_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS momento_end_timestamp TIMESTAMPTZ;

-- Add momento task columns to deleted_tasks table for consistency
ALTER TABLE deleted_tasks 
ADD COLUMN IF NOT EXISTS is_momento_task BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS momento_start_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS momento_end_timestamp TIMESTAMPTZ;

-- Create indexes for better performance on momento tasks
CREATE INDEX IF NOT EXISTS idx_tasks_momento 
ON tasks(is_momento_task, status) 
WHERE is_momento_task = TRUE;

CREATE INDEX IF NOT EXISTS idx_tasks_active_momento 
ON tasks(is_momento_task, momento_end_timestamp) 
WHERE is_momento_task = TRUE AND momento_end_timestamp IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.is_momento_task IS 'Indicates if this is a momento task (AI-initiated time tracking)';
COMMENT ON COLUMN tasks.momento_start_timestamp IS 'Timestamp when momento task was started';
COMMENT ON COLUMN tasks.momento_end_timestamp IS 'Timestamp when momento task was completed';

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('is_momento_task', 'momento_start_timestamp', 'momento_end_timestamp')
ORDER BY column_name;