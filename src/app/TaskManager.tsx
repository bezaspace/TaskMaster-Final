"use client";
import React, { useState, useEffect } from "react";


const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  time_slot?: string | null;
  done?: boolean;
};

export default function TaskManager() {




  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch tasks from backend
  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  const addTask = async () => {
    if (input.trim() === "") return;
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input,
        description: description,
        status: "pending",
        time_slot: timeSlot || null
      })
    });
    const newTask = await res.json();
    setTasks([...tasks, { ...newTask, text: newTask.title, done: newTask.status === "done" }]);
    setInput("");
    setDescription("");
    setTimeSlot("");
    setLoading(false);
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedStatus = task.status === "done" ? "pending" : "done";
    setLoading(true);
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        status: updatedStatus,
        time_slot: task.time_slot || null
      })
    });
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, status: updatedStatus, done: updatedStatus === "done" } : t
    ));
    setLoading(false);
  };

  // Delete task handler
  const deleteTask = async (id: number) => {
    setLoading(true);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t: Task) => t.id !== id));
    setLoading(false);
  };

  return (
    <div style={{
      background: JET_BLACK,
      minHeight: "100vh",
      color: "#fff",
      padding: "2rem",
      fontFamily: "Inter, sans-serif"
    }}>
      <h1 style={{ color: SCHOOL_BUS_YELLOW, marginBottom: "2rem" }}>Task Manager</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem", maxWidth: 600 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          style={{
            background: "#222",
            border: `1px solid ${SCHOOL_BUS_YELLOW}`,
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            outline: "none"
          }}
        />
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Task details..."
          style={{
            background: "#222",
            border: `1px solid ${SCHOOL_BUS_YELLOW}`,
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            outline: "none"
          }}
        />
        <input
          type="datetime-local"
          value={timeSlot || ""}
          onChange={e => setTimeSlot(e.target.value)}
          placeholder="Time slot"
          style={{
            background: "#222",
            border: `1px solid ${SCHOOL_BUS_YELLOW}`,
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            outline: "none"
          }}
        />
        <button
          onClick={addTask}
          style={{
            background: SCHOOL_BUS_YELLOW,
            color: JET_BLACK,
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#181818",
              borderRadius: "8px",
              padding: "1rem 1.5rem",
              boxShadow: (task.status === "done" || task.done) ? `0 0 0 2px ${SCHOOL_BUS_YELLOW}` : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={task.status === "done" || task.done}
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
                textDecoration: (task.status === "done" || task.done) ? "line-through" : "none",
                color: (task.status === "done" || task.done) ? SCHOOL_BUS_YELLOW : "#fff",
                fontWeight: 500,
                fontSize: "1.1rem"
              }}>{task.title}</span>
              <span style={{
                color: (task.status === "done" || task.done) ? SCHOOL_BUS_YELLOW : "#888",
                fontWeight: 700,
                marginLeft: "1rem"
              }}>
                {(task.status === "done" || task.done) ? "Done" : "Pending"}
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
            {task.time_slot && (
              <div style={{ color: SCHOOL_BUS_YELLOW, marginTop: "0.25rem", marginLeft: "2.75rem", fontWeight: 600 }}>
                Time Slot: {new Date(task.time_slot).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
