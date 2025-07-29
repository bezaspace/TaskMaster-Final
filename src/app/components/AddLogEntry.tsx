"use client";
import React, { useState } from "react";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

interface AddLogEntryProps {
  taskId: number;
  onLogAdded: (log: any) => void;
  onCancel: () => void;
}

export default function AddLogEntry({ taskId, onLogAdded, onCancel }: AddLogEntryProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === "") return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() })
      });

      if (res.ok) {
        const newLog = await res.json();
        onLogAdded(newLog);
        setContent("");
        onCancel();
      } else {
        console.error("Failed to add log entry");
      }
    } catch (error) {
      console.error("Error adding log entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "0.5rem" }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a log entry..."
        rows={3}
        style={{
          width: "100%",
          background: "#222",
          border: `1px solid ${SCHOOL_BUS_YELLOW}`,
          color: "#fff",
          padding: "0.5rem",
          borderRadius: "4px",
          outline: "none",
          resize: "vertical",
          fontFamily: "inherit"
        }}
        disabled={loading}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button
          type="submit"
          disabled={loading || content.trim() === ""}
          style={{
            background: SCHOOL_BUS_YELLOW,
            color: JET_BLACK,
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || content.trim() === "" ? 0.6 : 1
          }}
        >
          {loading ? "Adding..." : "Add Log"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            background: "transparent",
            color: "#888",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}