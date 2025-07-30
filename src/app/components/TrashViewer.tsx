"use client";
import React, { useState, useEffect } from "react";
import { DeletedTask } from "../types/task";
import { formatTaskDateTime, formatLogTimestamp } from "../../../lib/timeUtils";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

export default function TrashViewer() {
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Fetch deleted tasks
  useEffect(() => {
    const fetchTrash = async () => {
      try {
        const response = await fetch("/api/trash");
        if (response.ok) {
          const data = await response.json();
          setDeletedTasks(data);
        } else {
          console.error("Failed to fetch trash");
        }
      } catch (error) {
        console.error("Error fetching trash:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrash();
  }, []);

  // Filter tasks based on search term
  const filteredTasks = deletedTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (loading) {
    return (
      <div style={{
        background: JET_BLACK,
        minHeight: "100vh",
        color: "#fff",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ color: SCHOOL_BUS_YELLOW, fontSize: "1.2rem" }}>
          Loading trash...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: JET_BLACK,
      minHeight: "100vh",
      color: "#fff",
      padding: "2rem",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem"
      }}>
        <h1 style={{ color: SCHOOL_BUS_YELLOW, margin: 0 }}>🗑️ Trash</h1>
        <div style={{ color: "#888", fontSize: "0.9rem" }}>
          {filteredTasks.length} deleted task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Search deleted tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "0.75rem 1rem",
            background: "#181818",
            border: "2px solid #333",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "1rem"
          }}
        />
      </div>

      {/* Deleted Tasks List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#666",
            background: "#181818",
            borderRadius: "12px",
            border: "2px dashed #333"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗑️</div>
            <h3 style={{ color: "#888", marginBottom: "0.5rem" }}>
              {searchTerm ? "No matching deleted tasks" : "Trash is empty"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {searchTerm ? "Try a different search term" : "Deleted tasks will appear here"}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#181818",
                borderRadius: "8px",
                padding: "1.5rem",
                border: "1px solid #333"
              }}
            >
              {/* Task Header */}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: "#fff",
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.1rem",
                    fontWeight: 600
                  }}>
                    {task.title}
                  </h3>
                  <div style={{
                    color: "#888",
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem"
                  }}>
                    Deleted: {formatLogTimestamp(task.deleted_at)}
                  </div>
                  <div style={{
                    color: "#666",
                    fontSize: "0.8rem"
                  }}>
                    Original ID: {task.original_task_id} • Status: {task.status}
                  </div>
                </div>
              </div>

              {/* Task Description */}
              {task.description && (
                <div style={{
                  color: "#bbb",
                  marginBottom: "1rem",
                  fontSize: "0.95rem"
                }}>
                  {task.description}
                </div>
              )}

              {/* Task Date/Time */}
              {(task.task_date || task.start_time || task.end_time) && (
                <div style={{
                  color: SCHOOL_BUS_YELLOW,
                  marginBottom: "1rem",
                  fontWeight: 600,
                  fontSize: "0.9rem"
                }}>
                  📅 {formatTaskDateTime(task.task_date, task.start_time, task.end_time)}
                </div>
              )}

              {/* Task Timestamps */}
              <div style={{
                display: "flex",
                gap: "2rem",
                marginBottom: "1rem",
                fontSize: "0.8rem",
                color: "#666"
              }}>
                <div>Created: {formatLogTimestamp(task.created_at, { includeSeconds: false })}</div>
                <div>Updated: {formatLogTimestamp(task.updated_at, { includeSeconds: false })}</div>
              </div>

              {/* Logs Section */}
              {task.logs && task.logs.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: SCHOOL_BUS_YELLOW,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      textDecoration: "underline",
                      padding: 0,
                      marginBottom: "0.5rem"
                    }}
                  >
                    {expandedTasks.has(task.id) ? "Hide Logs" : `Show Logs (${task.logs.length})`}
                  </button>

                  {expandedTasks.has(task.id) && (
                    <div style={{
                      background: "#0f0f0f",
                      borderRadius: "6px",
                      padding: "1rem",
                      border: "1px solid #222"
                    }}>
                      {task.logs.map((log, index) => (
                        <div
                          key={log.id}
                          style={{
                            marginBottom: index < task.logs!.length - 1 ? "1rem" : 0,
                            paddingBottom: index < task.logs!.length - 1 ? "1rem" : 0,
                            borderBottom: index < task.logs!.length - 1 ? "1px solid #222" : "none"
                          }}
                        >
                          <div style={{
                            color: "#888",
                            fontSize: "0.75rem",
                            marginBottom: "0.25rem"
                          }}>
                            {formatLogTimestamp(log.created_at)} • Log ID: {log.original_log_id}
                          </div>
                          <div style={{
                            color: "#ddd",
                            fontSize: "0.9rem",
                            lineHeight: 1.4
                          }}>
                            {log.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}