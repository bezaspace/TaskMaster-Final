"use client";
import React, { useState, useEffect } from "react";
import { Note } from "../types/note";
import { formatLogTimestamp } from "../../../lib/timeUtils";

const SCHOOL_BUS_YELLOW = "#FFD800";
const JET_BLACK = "#121212";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch notes from backend
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const createNote = async () => {
    if (newTitle.trim() === "" || newContent.trim() === "") return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
        }),
      });
      
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setNewTitle("");
        setNewContent("");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
    setLoading(false);
  };

  const updateNote = async (id: number, title: string, content: string) => {
    if (title.trim() === "" || content.trim() === "") return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(notes.map(note => note.id === id ? updatedNote : note));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
    setLoading(false);
  };

  const deleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setNotes(notes.filter(note => note.id !== id));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return formatLogTimestamp(dateString, {
      includeDate: true,
      includeTime: true,
      includeSeconds: false
    });
  };

  return (
    <div style={{
      background: JET_BLACK,
      minHeight: "100vh",
      color: "#fff",
      padding: "2rem",
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem" 
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: SCHOOL_BUS_YELLOW }}>
          Notes
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          disabled={loading || isCreating}
          style={{
            background: SCHOOL_BUS_YELLOW,
            color: JET_BLACK,
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: loading || isCreating ? "not-allowed" : "pointer",
            opacity: loading || isCreating ? 0.6 : 1,
          }}
        >
          + New Note
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div style={{
          background: "#181818",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}>
          <input
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value ?? "")}
            style={{
              width: "100%",
              background: "#222",
              border: `1px solid ${SCHOOL_BUS_YELLOW}`,
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              outline: "none",
              marginBottom: "1rem",
              fontSize: "1rem",
            }}
          />
          <textarea
            placeholder="Write your note here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value ?? "")}
            rows={6}
            style={{
              width: "100%",
              background: "#222",
              border: `1px solid ${SCHOOL_BUS_YELLOW}`,
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              outline: "none",
              marginBottom: "1rem",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={createNote}
              disabled={loading}
              style={{
                background: SCHOOL_BUS_YELLOW,
                color: JET_BLACK,
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Save Note
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTitle("");
                setNewContent("");
              }}
              disabled={loading}
              style={{
                background: "none",
                color: "#888",
                border: "1px solid #444",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notes.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            color: "#888",
            fontSize: "1.1rem",
          }}>
            No notes yet. Create your first note to get started!
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onEdit={() => setEditingId(note.id)}
              onSave={(title, content) => updateNote(note.id, title, content)}
              onCancel={() => setEditingId(null)}
              onDelete={() => deleteNote(note.id)}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  loading: boolean;
}

function NoteCard({ note, isEditing, onEdit, onSave, onCancel, onDelete, loading }: NoteCardProps) {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    onSave(editTitle, editContent);
  };

  const formatDate = (dateString: string) => {
    return formatLogTimestamp(dateString, {
      includeDate: true,
      includeTime: true,
      includeSeconds: false
    });
  };

  if (isEditing) {
    return (
      <div style={{
        background: "#181818",
        borderRadius: "8px",
        padding: "1.5rem",
      }}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value ?? "")}
          style={{
            width: "100%",
            background: "#222",
            border: `1px solid ${SCHOOL_BUS_YELLOW}`,
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            outline: "none",
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value ?? "")}
          rows={6}
          style={{
            width: "100%",
            background: "#222",
            border: `1px solid ${SCHOOL_BUS_YELLOW}`,
            color: "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            outline: "none",
            marginBottom: "1rem",
            fontSize: "1rem",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: SCHOOL_BUS_YELLOW,
              color: JET_BLACK,
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "none",
              color: "#888",
              border: "1px solid #444",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#181818",
      borderRadius: "8px",
      padding: "1.5rem",
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        marginBottom: "1rem" 
      }}>
        <h3 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "600", 
          color: "#fff",
          margin: 0,
          flex: 1,
        }}>
          {note.title}
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
          <button
            onClick={onEdit}
            disabled={loading}
            style={{
              background: "none",
              color: SCHOOL_BUS_YELLOW,
              border: `1px solid ${SCHOOL_BUS_YELLOW}`,
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            style={{
              background: "none",
              color: "#ff5555",
              border: "1px solid #ff5555",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Delete
          </button>
        </div>
      </div>
      
      <div style={{
        color: "#bbb",
        lineHeight: "1.6",
        marginBottom: "1rem",
        whiteSpace: "pre-wrap",
      }}>
        {note.content}
      </div>
      
      <div style={{
        fontSize: "0.875rem",
        color: "#888",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>Created: {formatDate(note.created_at)}</span>
        {note.updated_at !== note.created_at && (
          <span>Updated: {formatDate(note.updated_at)}</span>
        )}
      </div>
    </div>
  );
}