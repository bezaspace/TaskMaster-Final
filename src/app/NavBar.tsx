// Simple navigation bar for TaskMaster
import Link from "next/link";

export default function NavBar() {
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
      <div style={{ display: "flex", gap: 24 }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Tasks</Link>
        <Link href="/notes" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Notes</Link>
        <Link href="/activity-log" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>📋 Activity Log</Link>
        <Link href="/trash" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>🗑️ Trash</Link>
        <Link href="/aichat" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>AI Chat</Link>
      </div>
    </nav>
  );
}
