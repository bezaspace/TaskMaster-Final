"use client";
import React, { useState, useEffect } from "react";
import AIFormFiller from "./AIFormFiller";
import { validateTimeRange } from "../../../lib/timeUtils";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (taskData: {
    title: string;
    description: string;
    task_date: string;
    start_time: string;
    end_time: string;
  }) => void;
  loading: boolean;
}

export default function TaskCreationModal({ 
  isOpen, 
  onClose, 
  onTaskCreate, 
  loading 
}: TaskCreationModalProps) {
  const [input, setInput] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [taskDate, setTaskDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [aiFilledData, setAiFilledData] = useState<any>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInput("");
      setDescription("");
      setTaskDate("");
      setStartTime("");
      setEndTime("");
      setAiFilledData(null);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (input.trim() === "") return;
    
    // Basic validation: end time must be after start time if both are provided
    if (!validateTimeRange(startTime || null, endTime || null)) {
      alert('End time must be after start time');
      return;
    }

    onTaskCreate({
      title: input,
      description: description,
      task_date: taskDate,
      start_time: startTime,
      end_time: endTime
    });
  };

  // Handle AI form fill
  const handleAIFormFill = (data: any) => {
    setInput(data.title || "");
    setDescription(data.description || "");
    setTaskDate(data.task_date || "");
    setStartTime(data.start_time || "");
    setEndTime(data.end_time || "");
    setAiFilledData(data);
  };

  // Clear AI filled data when form is manually changed
  const clearAIFilledData = () => {
    setAiFilledData(null);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: JET_BLACK,
          borderRadius: "16px",
          border: `2px solid ${SCHOOL_BUS_YELLOW}`,
          padding: "2rem",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem"
        }}>
          <h2 style={{
            color: SCHOOL_BUS_YELLOW,
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700
          }}>
            Create New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* AI Form Filler */}
        <AIFormFiller 
          onFormFill={handleAIFormFill}
          disabled={loading}
        />
        
        {/* AI Filled Data Indicator */}
        {aiFilledData && (
          <div style={{
            background: "#1a2d1a",
            border: "1px solid #4CAF50",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>✨</span>
              <span style={{ color: "#4CAF50", fontWeight: 600 }}>
                Form filled by AI - Review and confirm details
              </span>
            </div>
            <button
              onClick={clearAIFilledData}
              style={{
                background: "none",
                border: "none",
                color: "#4CAF50",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0.25rem"
              }}
              title="Clear AI suggestions"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          <input
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (aiFilledData) clearAIFilledData();
            }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Task title..."
            style={{
              background: aiFilledData ? "#1a2d1a" : "#222",
              border: `1px solid ${aiFilledData ? "#4CAF50" : SCHOOL_BUS_YELLOW}`,
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              outline: "none",
              fontSize: "1rem"
            }}
          />
          <textarea
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              if (aiFilledData) clearAIFilledData();
            }}
            placeholder="Task description..."
            rows={3}
            style={{
              background: aiFilledData ? "#1a2d1a" : "#222",
              border: `1px solid ${aiFilledData ? "#4CAF50" : SCHOOL_BUS_YELLOW}`,
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              outline: "none",
              fontSize: "1rem",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
          <input
            type="date"
            value={taskDate}
            onChange={e => {
              setTaskDate(e.target.value);
              if (aiFilledData) clearAIFilledData();
            }}
            placeholder="Task date"
            style={{
              background: aiFilledData && aiFilledData.task_date ? "#1a2d1a" : "#222",
              border: `1px solid ${aiFilledData && aiFilledData.task_date ? "#4CAF50" : SCHOOL_BUS_YELLOW}`,
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              outline: "none",
              fontSize: "1rem"
            }}
          />
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="time"
              value={startTime}
              onChange={e => {
                setStartTime(e.target.value);
                if (aiFilledData) clearAIFilledData();
              }}
              placeholder="Start time"
              style={{
                background: aiFilledData && aiFilledData.start_time ? "#1a2d1a" : "#222",
                border: `1px solid ${aiFilledData && aiFilledData.start_time ? "#4CAF50" : SCHOOL_BUS_YELLOW}`,
                color: "#fff",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                outline: "none",
                flex: 1,
                fontSize: "1rem"
              }}
            />
            <input
              type="time"
              value={endTime}
              onChange={e => {
                setEndTime(e.target.value);
                if (aiFilledData) clearAIFilledData();
              }}
              placeholder="End time"
              style={{
                background: aiFilledData && aiFilledData.end_time ? "#1a2d1a" : "#222",
                border: `1px solid ${aiFilledData && aiFilledData.end_time ? "#4CAF50" : SCHOOL_BUS_YELLOW}`,
                color: "#fff",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                outline: "none",
                flex: 1,
                fontSize: "1rem"
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || input.trim() === ""}
            style={{
              background: loading || input.trim() === "" ? "#666" : SCHOOL_BUS_YELLOW,
              color: loading || input.trim() === "" ? "#ccc" : JET_BLACK,
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontWeight: 700,
              cursor: loading || input.trim() === "" ? "not-allowed" : "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {loading ? (
              <>
                <span style={{ 
                  display: "inline-block", 
                  animation: "spin 1s linear infinite",
                  fontSize: "1rem"
                }}>⟳</span>
                Creating...
              </>
            ) : (
              <>
                <span>+</span>
                Create Task
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}