"use client";
import React, { useState } from "react";
import { TaskLog } from "../types/task";
import AddLogEntry from "./AddLogEntry";

const SCHOOL_BUS_YELLOW = "#FFD800";

interface TaskLogsProps {
  taskId: number;
  logs: TaskLog[];
  onLogsUpdate: (logs: TaskLog[]) => void;
}

export default function TaskLogs({ taskId, logs, onLogsUpdate }: TaskLogsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleLogAdded = (newLog: TaskLog) => {
    onLogsUpdate([newLog, ...logs]);
  };

  const handleEditLog = (log: TaskLog) => {
    setEditingLogId(log.id);
    setEditContent(log.content);
  };

  const handleUpdateLog = async (logId: number) => {
    if (editContent.trim() === "") return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/logs/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (res.ok) {
        const updatedLog = await res.json();
        onLogsUpdate(logs.map(log => log.id === logId ? updatedLog : log));
        setEditingLogId(null);
        setEditContent("");
      }
    } catch (error) {
      console.error("Error updating log:", error);
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/logs/${logId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        onLogsUpdate(logs.filter(log => log.id !== logId));
      }
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div style={{ marginTop: "0.75rem", marginLeft: "2.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ color: SCHOOL_BUS_YELLOW, fontWeight: 600, fontSize: "0.9rem" }}>
          Logs ({logs.length})
        </span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: "none",
            border: "none",
            color: SCHOOL_BUS_YELLOW,
            cursor: "pointer",
            fontSize: "0.8rem",
            textDecoration: "underline"
          }}
        >
          {showAddForm ? "Cancel" : "Add Log"}
        </button>
      </div>

      {showAddForm && (
        <AddLogEntry
          taskId={taskId}
          onLogAdded={handleLogAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {logs.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                background: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: "4px",
                padding: "0.5rem",
                marginBottom: "0.5rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {editingLogId === log.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%",
                          background: "#222",
                          border: `1px solid ${SCHOOL_BUS_YELLOW}`,
                          color: "#fff",
                          padding: "0.25rem",
                          borderRadius: "2px",
                          outline: "none",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                      <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <button
                          onClick={() => handleUpdateLog(log.id)}
                          style={{
                            background: SCHOOL_BUS_YELLOW,
                            color: "#000",
                            border: "none",
                            borderRadius: "2px",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingLogId(null);
                            setEditContent("");
                          }}
                          style={{
                            background: "transparent",
                            color: "#888",
                            border: "1px solid #444",
                            borderRadius: "2px",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#ddd", fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {log.content}
                    </div>
                  )}
                  <div style={{ color: "#888", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
                {editingLogId !== log.id && (
                  <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }}>
                    <button
                      onClick={() => handleEditLog(log)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                        fontSize: "0.75rem"
                      }}
                      title="Edit log"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff5555",
                        cursor: "pointer",
                        fontSize: "0.75rem"
                      }}
                      title="Delete log"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}