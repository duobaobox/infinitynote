import { useState, useEffect } from "react";
import type { Note } from "../types";
import { dbOperations } from "../utils/db";

export const useNoteDatabase = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有便签
  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const dbNotes = await dbOperations.getAllNotes();
      const formattedNotes: Note[] = dbNotes.map((note) => ({
        id: note.id?.toString() || "",
        title: note.title,
        content: note.content,
        color: note.color,
        position: note.position,
        size: note.size,
        zIndex: note.zIndex,
        canvasId: note.canvasId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));
      setNotes(formattedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载便签失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加便签
  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();
      const id = await dbOperations.addNote({
        ...note,
        createdAt: now,
        updatedAt: now,
      });
      await loadNotes();
      return id.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加便签失败");
      throw err;
    }
  };

  // 更新便签
  const updateNote = async (id: string, changes: Partial<Note>) => {
    try {
      const { id: _, ...updateData } = changes;
      await dbOperations.updateNote(parseInt(id), {
        ...updateData,
        updatedAt: new Date(),
      });
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新便签失败");
      throw err;
    }
  };

  // 删除便签
  const deleteNote = async (id: string) => {
    try {
      await dbOperations.deleteNote(parseInt(id));
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除便签失败");
      throw err;
    }
  };

  // 初始化时加载数据
  useEffect(() => {
    loadNotes();
  }, []);

  return {
    notes,
    loading,
    error,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
  };
};
