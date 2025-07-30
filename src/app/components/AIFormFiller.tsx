"use client";
import React, { useState } from "react";
import { AIFormFillerProps, AIFormParseRequest, AIFormParseResponse } from "../types/aiForm";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

export default function AIFormFiller({ onFormFill, disabled = false }: AIFormFillerProps) {
  const [aiText, setAiText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAIFill = async () => {
    if (!aiText.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/ai-form-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText } as AIFormParseRequest)
      });

      const result: AIFormParseResponse = await response.json();

      if (result.success && result.data) {
        onFormFill(result.data);
        setSuccess(true);
        setAiText(""); // Clear the text area after successful parsing
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to parse the text");
      }
    } catch (err) {
      console.error("AI form fill error:", err);
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAIFill();
    }
  };

  return (
    <div style={{
      background: "#1a1a1a",
      border: `1px solid ${SCHOOL_BUS_YELLOW}`,
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "2rem",
      maxWidth: 600
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
        gap: "0.5rem"
      }}>
        <span style={{ fontSize: "1.5rem" }}>🤖</span>
        <h3 style={{
          color: SCHOOL_BUS_YELLOW,
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 600
        }}>
          AI Task Assistant
        </h3>
      </div>
      
      <p style={{
        color: "#bbb",
        fontSize: "0.9rem",
        margin: "0 0 1rem 0",
        lineHeight: 1.4
      }}>
        Describe your task in natural language and I'll fill out the form for you!
        <br />
        <span style={{ color: "#888", fontSize: "0.8rem" }}>
          Try: "Meeting with John tomorrow at 3pm" or "Buy groceries this weekend"
        </span>
      </p>

      <div style={{ position: "relative" }}>
        <textarea
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your task here... (Ctrl+Enter to analyze)"
          disabled={disabled || loading}
          style={{
            width: "100%",
            minHeight: "80px",
            background: "#222",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#fff",
            padding: "0.75rem",
            fontSize: "0.95rem",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.4
          }}
        />
        
        <button
          onClick={handleAIFill}
          disabled={disabled || loading || !aiText.trim()}
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: loading ? "#666" : SCHOOL_BUS_YELLOW,
            color: loading ? "#ccc" : JET_BLACK,
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: disabled || loading || !aiText.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            transition: "all 0.2s ease"
          }}
          title="Analyze text and fill form (Ctrl+Enter)"
        >
          {loading ? (
            <>
              <span style={{ 
                display: "inline-block", 
                animation: "spin 1s linear infinite",
                fontSize: "0.9rem"
              }}>⟳</span>
              Analyzing...
            </>
          ) : (
            <>
              <span>✨</span>
              Fill Form
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "#2d1b1b",
          border: "1px solid #ff5555",
          borderRadius: "6px",
          color: "#ff8888",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "#1b2d1b",
          border: "1px solid #55ff55",
          borderRadius: "6px",
          color: "#88ff88",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>✅</span>
          Form filled successfully! Review the details below.
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}