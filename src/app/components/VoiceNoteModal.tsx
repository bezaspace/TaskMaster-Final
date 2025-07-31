"use client";

import React, { useState } from "react";
import VoiceNoteRecorder from "./VoiceNoteRecorder";

type Props = {
  onClose: () => void;
  onSuccess: (note: any) => void; // expects created note object from /api/notes
};

export default function VoiceNoteModal({ onClose, onSuccess }: Props) {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loadingStage, setLoadingStage] = useState<null | "analyzing" | "creating-note">(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleCreateFromAudio() {
    if (!recordedBlob) return;
    setErrorMsg("");
    try {
      setLoadingStage("analyzing");

      // Send to AI audio endpoint
      const fd = new FormData();
      // name the field 'audio' to match the API route parser
      fd.append("audio", recordedBlob, "voice-note.webm");

      const analyzeRes = await fetch("/api/ai-audio-note", {
        method: "POST",
        body: fd,
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({}));
        throw new Error(err?.error || "AI audio analysis failed");
      }

      const { title, content } = await analyzeRes.json();

      setLoadingStage("creating-note");

      // Persist the note via existing API
      const createRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create note");
      }

      const newNote = await createRes.json();
      onSuccess(newNote);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Something went wrong");
      setLoadingStage(null);
    }
  }

  function handleRecorded(b: Blob) {
    setRecordedBlob(b);
  }

  function handleError(e: any) {
    setErrorMsg(e?.message || "Recording error");
  }

  const isBusy = loadingStage !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "min(520px, 92vw)",
          background: "#111",
          color: "#eee",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Voice Note</h2>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "transparent",
              color: "#eee",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
            disabled={isBusy}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.85 }}>
          Click Start to record, then Stop. Review the duration. When ready, click Create Note to analyze and save.
        </div>

        <div style={{ marginBottom: 16 }}>
          <VoiceNoteRecorder onRecorded={handleRecorded} onError={handleError} />
        </div>

        {recordedBlob && (
          <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.85 }}>
            Recorded size: {(recordedBlob.size / 1024).toFixed(1)} KB
          </div>
        )}

        {errorMsg && (
          <div style={{ color: "#ff6666", marginBottom: 12 }}>
            {errorMsg}
          </div>
        )}

        {loadingStage && (
          <div style={{ marginBottom: 12, color: "#ddd" }}>
            {loadingStage === "analyzing" && "Analyzing audio with AI…"}
            {loadingStage === "creating-note" && "Creating note…"}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={isBusy}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #444",
              background: "transparent",
              color: "#eee",
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
            title="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFromAudio}
            disabled={!recordedBlob || isBusy}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #444",
              background: "#f5c518",
              color: "#000",
              fontWeight: 600,
              cursor: !recordedBlob || isBusy ? "not-allowed" : "pointer",
            }}
            title="Create Note from audio"
          >
            Create Note
          </button>
        </div>
      </div>
    </div>
  );
}
