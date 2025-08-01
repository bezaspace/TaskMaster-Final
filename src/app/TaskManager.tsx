"use client";
import React, { useState, useEffect } from "react";
import { Task, TaskLog } from "./types/task";
import TaskLogs from "./components/TaskLogs";
import TaskCreationModal from "./components/TaskCreationModal";
import { formatTaskDateTime } from "../../lib/timeUtils";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

export default function TaskManager() {




  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks from backend
  useEffect(() => {
    fetch("/api/tasks")
      .then(async res => {
        const data = await res.json();
        console.log('API Response:', data); // Debug log
        
        if (!res.ok) {
          console.error('API Error:', data);
          setTasks([]);
          return;
        }
        
        // Check if data is an array, if not, handle error
        if (!Array.isArray(data)) {
          console.error('API returned non-array data:', data);
          setTasks([]);
          return;
        }
        
        // Ensure all tasks have proper string values for form fields
        const normalizedTasks = data.map((task: any) => ({
          ...task,
          task_date: task.task_date ?? "",
          start_time: task.start_time ?? "",
          end_time: task.end_time ?? "",
          done: Boolean(task.status === "done" || task.done)
        }));
        setTasks(normalizedTasks);
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      });
  }, []);

  const addTask = async (taskData: {
    title: string;
    description: string;
    task_date: string;
    start_time: string;
    end_time: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          status: "pending",
          task_date: taskData.task_date || null,
          start_time: taskData.start_time || null,
          end_time: taskData.end_time || null
        })
      });
      const newTask = await res.json();
      // Normalize the new task fields to ensure consistency
      const normalizedNewTask = {
        ...newTask,
        task_date: newTask.task_date ?? "",
        start_time: newTask.start_time ?? "",
        end_time: newTask.end_time ?? "",
        text: newTask.title,
        done: Boolean(newTask.status === "done")
      };
      setTasks([...tasks, normalizedNewTask]);
      setIsModalOpen(false); // Close modal after successful creation
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedStatus = task.done ? "pending" : "done";
    setLoading(true);
    
    const requestBody = {
      title: task.title,
      description: task.description || "",
      status: updatedStatus,
      task_date: task.task_date || null,
      start_time: task.start_time || null,
      end_time: task.end_time || null
    };
    
    console.log('Sending update request:', requestBody);
    
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update task:', error);
        alert('Failed to update task: ' + (error.error || 'Unknown error'));
        return;
      }
      
      setTasks(tasks.map(t =>
        t.id === id ? { 
          ...t, 
          status: updatedStatus, 
          done: Boolean(updatedStatus === "done"),
          task_date: t.task_date ?? "",
          start_time: t.start_time ?? "",
          end_time: t.end_time ?? ""
        } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  // Delete task handler
  const deleteTask = async (id: number) => {
    setLoading(true);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t: Task) => t.id !== id));
    setLoading(false);
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Update task logs
  const updateTaskLogs = (taskId: number, logs: TaskLog[]) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { 
        ...task, 
        logs,
        task_date: task.task_date ?? "",
        start_time: task.start_time ?? "",
        end_time: task.end_time ?? "",
        done: Boolean(task.status === "done" || task.done)
      } : task
    ));
  };



  return (
    <div style={{
      background: JET_BLACK,
      minHeight: "100vh",
      color: "#fff",
      padding: "2rem",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* Header with Add Task Button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem"
      }}>
        <h1 style={{ color: SCHOOL_BUS_YELLOW, margin: 0 }}>Task Manager</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: SCHOOL_BUS_YELLOW,
            color: JET_BLACK,
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.5rem",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(255, 216, 0, 0.3)",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 216, 0, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 216, 0, 0.3)";
          }}
          title="Create new task"
        >
          <span style={{ fontSize: "1.2rem" }}>+</span>
          New Task
        </button>
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreate={addTask}
        loading={loading}
      />
      {/* Tasks List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#666",
            background: "#181818",
            borderRadius: "12px",
            border: "2px dashed #333"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📝</div>
            <h3 style={{ color: "#888", marginBottom: "0.5rem" }}>No tasks yet</h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Click the "New Task" button to create your first task
            </p>
          </div>
        ) : (
          tasks.map(task => (
          <div
            key={task.id}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#181818",
              borderRadius: "8px",
              padding: "1rem 1.5rem",
              boxShadow: task.done ? `0 0 0 2px ${SCHOOL_BUS_YELLOW}` : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                style={{
                  accentColor: SCHOOL_BUS_YELLOW,
                  width: "1.5rem",
                  height: "1.5rem",
                  marginRight: "1.25rem"
                }}
              />
              <span style={{
                flex: 1,
                textDecoration: task.done ? "line-through" : "none",
                color: task.done ? SCHOOL_BUS_YELLOW : "#fff",
                fontWeight: 500,
                fontSize: "1.1rem"
              }}>{task.title}</span>
              <span style={{
                color: task.done ? SCHOOL_BUS_YELLOW : "#888",
                fontWeight: 700,
                marginLeft: "1rem"
              }}>
                {task.done ? "Done" : "Pending"}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff5555",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  marginLeft: "1rem"
                }}
                title="Delete Task"
                aria-label="Delete Task"
                disabled={loading}
              >
                🗑️
              </button>
            </div>
            {task.description && (
              <div style={{ color: "#bbb", marginTop: "0.5rem", marginLeft: "2.75rem" }}>
                {task.description}
              </div>
            )}
            {(task.task_date || task.start_time || task.end_time) && (
              <div style={{ color: SCHOOL_BUS_YELLOW, marginTop: "0.25rem", marginLeft: "2.75rem", fontWeight: 600 }}>
                {formatTaskDateTime(task.task_date, task.start_time, task.end_time)}
              </div>
            )}
            
            {/* Logs section */}
            <div style={{ marginTop: "0.5rem", marginLeft: "2.75rem" }}>
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: SCHOOL_BUS_YELLOW,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  textDecoration: "underline",
                  padding: 0
                }}
              >
                {expandedTasks.has(task.id) ? "Hide Logs" : `Show Logs ${task.logs ? `(${task.logs.length})` : "(0)"}`}
              </button>
            </div>
            
            {expandedTasks.has(task.id) && (
              <TaskLogs
                taskId={task.id}
                logs={task.logs || []}
                onLogsUpdate={(logs) => updateTaskLogs(task.id, logs)}
              />
            )}
          </div>
          ))
        )}
      </div>

    </div>
  );
}
