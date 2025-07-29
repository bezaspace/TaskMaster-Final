"use client";
import React, { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const history = newMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      let aiText = "";
      setMessages((msgs) => [...msgs, { sender: "ai", text: "" }]);
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = new TextDecoder().decode(value);
          // Each chunk is a JSON string: { text: "..." }
          try {
            const parsed = JSON.parse(chunk);
            aiText += parsed.text;
            setMessages((msgs) => {
              const updated = [...msgs];
              // Update the last AI message
              updated[updated.length - 1] = { sender: "ai", text: aiText };
              return updated;
            });
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: "ai", text: "[Error: Failed to fetch AI response]" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-window">
      <div className="ai-chat-header">AI Chat</div>
      <div className="ai-chat-messages" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`ai-chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
            aria-label={msg.sender === "user" ? "You" : "AI"}
          >
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="ai-chat-input-row" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          aria-label="Type your message"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Send"}
        </button>
      </form>
      <style jsx>{`
        .ai-chat-window {
          border: 1px solid #ccc;
          border-radius: 8px;
          max-width: 100%;
          width: 400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: 500px;
          background: var(--chat-bg, #fff);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: background 0.2s;
        }
        @media (max-width: 500px) {
          .ai-chat-window {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
        }
        .ai-chat-header {
          background: #f7f7f7;
          padding: 12px;
          border-bottom: 1px solid #eee;
          font-weight: bold;
          text-align: center;
          color: #222;
        }
        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: var(--chat-bg, #fff);
        }
        .ai-chat-bubble {
          margin-bottom: 12px;
          padding: 10px 16px;
          border-radius: 18px;
          max-width: 80%;
          word-break: break-word;
          font-size: 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .ai-chat-bubble.user {
          background: #e0f7fa;
          align-self: flex-end;
          color: #00796b;
        }
        .ai-chat-bubble.ai {
          background: #f1f8e9;
          align-self: flex-start;
          color: #33691e;
        }
        .ai-chat-input-row {
          display: flex;
          border-top: 1px solid #eee;
          padding: 10px;
          background: #fafafa;
        }
        .ai-chat-input-row input {
          flex: 1;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          margin-right: 8px;
          font-size: 1rem;
        }
        .ai-chat-input-row button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          background: #00796b;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
        }
        .ai-chat-input-row button:disabled {
          background: #b2dfdb;
          cursor: not-allowed;
        }
        @media (prefers-color-scheme: dark) {
          .ai-chat-window {
            background: #181c1f;
            border-color: #222;
          }
          .ai-chat-header {
            background: #23272b;
            color: #eee;
            border-bottom: 1px solid #222;
          }
          .ai-chat-messages {
            background: #181c1f;
          }
          .ai-chat-bubble.user {
            background: #004d40;
            color: #b2dfdb;
          }
          .ai-chat-bubble.ai {
            background: #263238;
            color: #c5e1a5;
          }
          .ai-chat-input-row {
            background: #23272b;
            border-top: 1px solid #222;
          }
          .ai-chat-input-row input {
            background: #23272b;
            color: #eee;
            border: 1px solid #333;
          }
          .ai-chat-input-row button {
            background: #004d40;
            color: #b2dfdb;
          }
          .ai-chat-input-row button:disabled {
            background: #263238;
            color: #888;
          }
        }
      `}</style>
    </div>
  );
}
