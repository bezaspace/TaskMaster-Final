
"use client";
import TaskManager from "./TaskManager";
import AIChat from "./AIChat";

export default function Home() {
  return (
    <>
      <TaskManager />
      <div style={{ marginTop: 40 }}>
        <AIChat />
      </div>
    </>
  );
}
