"use client";

import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        width: "100%",
        background: "#222",
        color: "#fff",
        padding: "1rem 2rem",
        textAlign: "center",
        marginBottom: 32,
        fontFamily: "Inter, sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  // Don't show navbar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav style={{
      width: "100%",
      background: "#222",
      color: "#fff",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ fontWeight: 700, fontSize: 22 }}>TaskMaster</div>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Tasks</Link>
        <Link href="/notes" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Notes</Link>
        <Link href="/activity-log" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>📋 Activity Log</Link>
        <Link href="/trash" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>🗑️ Trash</Link>
        <Link href="/aichat" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>AI Chat</Link>
        <button
          onClick={handleLogout}
          style={{
            background: "#dc3545",
            color: "#fff",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "14px"
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
