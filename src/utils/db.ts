import Dexie, { type Table } from "dexie";
import type { Note } from "../types";

export interface NoteDB extends Omit<Note, "id"> {
  id?: number;
}

class InfinityNoteDatabase extends Dexie {
  notes!: Table<NoteDB>;

  constructor() {
    super("InfinityNoteDatabase");
    this.version(1).stores({
      notes:
        "++id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height",
    });
  }
}

export const db = new InfinityNoteDatabase();

// 数据库操作方法
export const dbOperations = {
  // 添加便签
  async addNote(note: Omit<NoteDB, "id">): Promise<number> {
    return await db.notes.add(note);
  },

  // 更新便签
  async updateNote(id: number, changes: Partial<NoteDB>): Promise<number> {
    return await db.notes.update(id, {
      ...changes,
      updatedAt: new Date(),
    });
  },

  // 删除便签
  async deleteNote(id: number): Promise<void> {
    await db.notes.delete(id);
  },

  // 获取所有便签
  async getAllNotes(): Promise<NoteDB[]> {
    return await db.notes.toArray();
  },

  // 根据ID获取便签
  async getNoteById(id: number): Promise<NoteDB | undefined> {
    return await db.notes.get(id);
  },

  // 清空所有便签
  async clearAllNotes(): Promise<void> {
    await db.notes.clear();
  },
};
