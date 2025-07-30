"use client";

import React, { useState, useEffect } from "react";
import { ActivityLog } from "../types/activity";
import { formatLogTimestamp, getCurrentDate } from "../../../lib/timeUtils";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '200');

      const response = await fetch(`/api/activity-log?${params}`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const setToday = () => {
    const today = getCurrentDate();
    setStartDate(today);
    setEndDate(today);
  };

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
        <h1 style={{ color: SCHOOL_BUS_YELLOW, margin: 0 }}>Activity Log</h1>
        <div style={{ color: "#888", fontSize: "0.9rem" }}>
          Complete timeline of all your actions
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "#181818",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ color: "#ccc", fontSize: "0.9rem" }}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              background: "#222",
              border: "1px solid #444",
              borderRadius: "4px",
              padding: "0.5rem",
              color: "#fff",
              fontSize: "0.9rem"
            }}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ color: "#ccc", fontSize: "0.9rem" }}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              background: "#222",
              border: "1px solid #444",
              borderRadius: "4px",
              padding: "0.5rem",
              color: "#fff",
              fontSize: "0.9rem"
            }}
          />
        </div>

        <button
          onClick={setToday}
          style={{
            background: SCHOOL_BUS_YELLOW,
            color: JET_BLACK,
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Today
        </button>

        <button
          onClick={clearFilters}
          style={{
            background: "transparent",
            color: "#888",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            cursor: "pointer"
          }}
        >
          Clear Filters
        </button>

        <div style={{ marginLeft: "auto", color: "#888", fontSize: "0.9rem" }}>
          {logs.length} activities
        </div>
      </div>

      {/* Activity Log Table */}
      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          color: "#666"
        }}>
          Loading activity log...
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          color: "#666",
          background: "#181818",
          borderRadius: "12px",
          border: "2px dashed #333"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ color: "#888", marginBottom: "0.5rem" }}>No activities found</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            {startDate || endDate ? "Try adjusting your date filters" : "Start using the app to see your activity timeline"}
          </p>
        </div>
      ) : (
        <div style={{
          background: "#181818",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "1rem",
            padding: "1rem 1.5rem",
            background: "#222",
            borderBottom: "1px solid #333",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: SCHOOL_BUS_YELLOW
          }}>
            <div>Timestamp</div>
            <div>Activity</div>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {logs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: "1rem",
                  padding: "1rem 1.5rem",
                  borderBottom: index < logs.length - 1 ? "1px solid #333" : "none",
                  fontSize: "0.9rem",
                  lineHeight: "1.4"
                }}
              >
                <div style={{ 
                  color: "#888",
                  fontFamily: "monospace",
                  fontSize: "0.85rem"
                }}>
                  {formatLogTimestamp(log.timestamp, {
                    includeDate: true,
                    includeTime: true,
                    includeSeconds: true
                  })}
                </div>
                <div style={{ color: "#fff" }}>
                  {log.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}