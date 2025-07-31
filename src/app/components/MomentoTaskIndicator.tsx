"use client";
import React, { useState, useEffect } from "react";
import { Task } from "../types/task";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

interface MomentoTaskIndicatorProps {
  task: Task;
  onFinish?: (taskId: number) => void;
}

export default function MomentoTaskIndicator({ task, onFinish }: MomentoTaskIndicatorProps) {
  const [currentDuration, setCurrentDuration] = useState<string>("");

  useEffect(() => {
    if (!task.momento_start_timestamp) return;

    const updateDuration = () => {
      const startTime = new Date(task.momento_start_timestamp!);
      const now = new Date();
      const durationMs = now.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const durationHours = Math.floor(durationMinutes / 60);
      const remainingMinutes = durationMinutes % 60;
      
      if (durationHours > 0) {
        setCurrentDuration(`${durationHours}h ${remainingMinutes}m`);
      } else {
        setCurrentDuration(`${durationMinutes}m`);
      }
    };

    // Update immediately
    updateDuration();

    // Update every minute
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [task.momento_start_timestamp]);

  const handleFinish = () => {
    if (onFinish) {
      onFinish(task.id);
    }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${SCHOOL_BUS_YELLOW}15, ${SCHOOL_BUS_YELLOW}25)`,
      border: `2px solid ${SCHOOL_BUS_YELLOW}`,
      borderRadius: "12px",
      padding: "1rem 1.5rem",
      marginBottom: "1rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated pulse background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(90deg, transparent, ${SCHOOL_BUS_YELLOW}10, transparent)`,
        animation: "pulse 2s ease-in-out infinite"
      }} />
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: SCHOOL_BUS_YELLOW,
              animation: "blink 1.5s ease-in-out infinite"
            }} />
            <span style={{
              color: SCHOOL_BUS_YELLOW,
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              ACTIVE MOMENTO
            </span>
          </div>
          
          <button
            onClick={handleFinish}
            style={{
              background: SCHOOL_BUS_YELLOW,
              color: JET_BLACK,
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${SCHOOL_BUS_YELLOW}40`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Finish this momento task"
          >
            Finish
          </button>
        </div>
        
        <h3 style={{
          color: "#fff",
          margin: "0 0 0.5rem 0",
          fontSize: "1.1rem",
          fontWeight: 600
        }}>
          {task.title}
        </h3>
        
        {task.description && (
          <p style={{
            color: "#ccc",
            margin: "0 0 0.75rem 0",
            fontSize: "0.9rem",
            lineHeight: "1.4"
          }}>
            {task.description}
          </p>
        )}
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          fontSize: "0.85rem"
        }}>
          <div style={{ color: SCHOOL_BUS_YELLOW, fontWeight: 600 }}>
            Duration: {currentDuration}
          </div>
          <div style={{ color: "#aaa" }}>
            Started: {task.momento_start_timestamp ? 
              new Date(task.momento_start_timestamp).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Unknown'
            }
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}