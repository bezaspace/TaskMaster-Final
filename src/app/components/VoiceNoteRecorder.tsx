"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  onRecorded: (blob: Blob) => void;
  onError?: (err: any) => void;
  maxDurationMs?: number; // e.g., 180000 for 3 minutes
  mimeType?: string; // default "audio/webm"
  startAutomatically?: boolean;
};

export default function VoiceNoteRecorder({
  onRecorded,
  onError,
  maxDurationMs = 180000,
  mimeType = "audio/webm;codecs=opus",
  startAutomatically = false,
}: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [supportedMime, setSupportedMime] = useState(mimeType);
  const [pulsing, setPulsing] = useState(false);
  const [clicked, setClicked] = useState<null | "start" | "stop" | "cancel">(null);

  useEffect(() => {
    // Pick a supported mimeType
    if (typeof MediaRecorder !== "undefined") {
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          setSupportedMime("audio/webm");
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          setSupportedMime("audio/mp4");
        } else {
          setSupportedMime("");
        }
      }
    } else {
      setSupportedMime("");
    }
  }, [mimeType]);

  useEffect(() => {
    if (startAutomatically) {
      startRecording().catch((e) => onError?.(e));
    }
    // cleanup on unmount
    return () => {
      stopInternal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    if (!("MediaRecorder" in window)) {
      throw new Error("MediaRecorder is not supported in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    chunksRef.current = [];
    const rec = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
    mediaRecorderRef.current = rec;

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: supportedMime || "audio/webm" });
      onRecorded(blob);
    };
    rec.onerror = (e) => onError?.(e);

    rec.start(250); // small timeslice to gather chunks
    setIsRecording(true);
    setPulsing(true);
    setDurationMs(0);

    // duration ticker
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setDurationMs(elapsed);
      if (elapsed >= maxDurationMs) {
        stopRecording();
      }
    }, 250);
  }

  function stopInternal(callOnStop: boolean = true) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        // onstop handler will trigger onRecorded only if callOnStop is true
        const rec = mediaRecorderRef.current;
        if (!callOnStop) {
          rec.onstop = null as any;
        }
        rec.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setPulsing(false);
    setClicked(null);
  }

  function stopRecording() {
    stopInternal(true);
  }

  function cancelRecording() {
    // Stop without emitting final blob
    stopInternal(false);
    chunksRef.current = [];
    setDurationMs(0);
  }

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  const isSupported = !!supportedMime;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {!isSupported && (
        <div style={{ color: "#ff6666" }}>
          This browser does not support MediaRecorder for audio. Please try a recent Chromium-based
          browser.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            setClicked("start");
            setTimeout(() => setClicked(null), 180);
            startRecording().catch((e) => onError?.(e));
          }}
          disabled={isRecording || !isSupported}
          title="Start Recording"
          style={{
            padding: "10px 16px",
            cursor: isRecording || !isSupported ? "not-allowed" : "pointer",
            borderRadius: 999,
            border: "1px solid #2f2f2f",
            background: isRecording ? "#1a1a1a" : "#222",
            color: "#f5c518",
            boxShadow:
              clicked === "start"
                ? "0 0 0 0 rgba(245,197,24, 0.7)"
                : "0 0 0 0 rgba(0,0,0,0)",
            transform: clicked === "start" ? "scale(0.98)" : "scale(1)",
            transition: "transform 150ms ease, box-shadow 250ms ease, background 200ms ease",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              filter: isRecording || !isSupported ? "grayscale(0.5)" : "none",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff3b3b",
                boxShadow: pulsing
                  ? "0 0 0 0 rgba(255,59,59, 0.6)"
                  : "0 0 0 0 rgba(0,0,0,0)",
                animation: pulsing ? "pulseDot 1.2s ease-out infinite" : "none",
                display: "inline-block",
              }}
            />
            ⏺ Start
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setClicked("stop");
            setTimeout(() => setClicked(null), 180);
            stopRecording();
          }}
          disabled={!isRecording}
          title="Stop Recording"
          style={{
            padding: "10px 16px",
            cursor: !isRecording ? "not-allowed" : "pointer",
            borderRadius: 999,
            border: "1px solid #2f2f2f",
            background: !isRecording ? "#1a1a1a" : "#2b2b2b",
            color: "#eee",
            transform: clicked === "stop" ? "scale(0.98)" : "scale(1)",
            transition: "transform 150ms ease, background 200ms ease",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "#ff3b3b",
                display: "inline-block",
              }}
            />
            ⏹ Stop
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setClicked("cancel");
            setTimeout(() => setClicked(null), 180);
            cancelRecording();
          }}
          disabled={!isRecording}
          title="Cancel and discard"
          style={{
            padding: "10px 16px",
            cursor: !isRecording ? "not-allowed" : "pointer",
            borderRadius: 999,
            border: "1px solid #2f2f2f",
            background: !isRecording ? "#1a1a1a" : "#222",
            color: "#bbb",
            transform: clicked === "cancel" ? "scale(0.98)" : "scale(1)",
            transition: "transform 150ms ease, background 200ms ease",
          }}
        >
          ✖ Cancel
        </button>
        <span style={{ fontFamily: "monospace" }}>Duration: {minutes}:{seconds}</span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Format: {supportedMime || "unsupported"} • Max duration: {Math.floor(maxDurationMs / 1000)}s
      </div>
      {/* inline keyframes for pulse effect */}
      <style>
        {`
          @keyframes pulseDot {
            0% { box-shadow: 0 0 0 0 rgba(255,59,59, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(255,59,59, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255,59,59, 0); }
          }
        `}
      </style>
    </div>
  );
}
