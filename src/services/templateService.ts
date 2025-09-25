/**
 * 便签模板服务
 *
 * 管理便签模板的创建、使用和管理
 */

import type { Note, Size, NoteTemplate } from "../types";
// 导入新的颜色配置系统，替换废弃的 NoteColor 枚举
import { getNoteColorPresetByName } from "../config/noteColors";
import { NOTE_DEFAULT_SIZE } from "../types/constants";
import { NoteService } from "./noteService";

/**
 * 内置便签模板
 */
export const BUILTIN_TEMPLATES: Omit<
  NoteTemplate,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "待办事项",
    description: "简单的待办事项模板",
    content: "□ 任务1\n□ 任务2\n□ 任务3",
    color: getNoteColorPresetByName("yellow")?.value || "#FFF2CC",
    size: NOTE_DEFAULT_SIZE, // 使用新的默认尺寸 (270x240像素) 提供更好的显示效果
    contentType: "text",
    isSystem: true,
  },
  {
    name: "会议记录",
    description: "会议记录模板",
    content:
      "# 会议记录\n\n**时间：** \n**参与者：** \n**议题：** \n\n## 要点\n- \n\n## 行动项\n- ",
    color: getNoteColorPresetByName("blue")?.value || "#E6F3FF",
    size: { width: 300, height: 250 },
    contentType: "markdown",
    isSystem: true,
  },
  {
    name: "想法收集",
    description: "收集灵感和想法",
    content: "💡 想法：\n\n\n🎯 目标：\n\n\n📝 备注：",
    color: getNoteColorPresetByName("purple")?.value || "#F0E6FF",
    size: { width: 250, height: 200 },
    contentType: "text",
    isSystem: true,
  },
  {
    name: "日程安排",
    description: "每日日程规划",
    content: "📅 日期：\n\n🌅 上午：\n-\n-\n\n🌞 下午：\n-\n-\n\n🌙 晚上：\n-",
    color: getNoteColorPresetByName("green")?.value || "#E6FFE6",
    size: { width: 280, height: 220 },
    contentType: "text",
    isSystem: true,
  },
  {
    name: "学习笔记",
    description: "学习内容整理",
    content: "# 学习主题\n\n## 重点内容\n\n\n## 问题记录\n\n\n## 总结",
    color: getNoteColorPresetByName("orange")?.value || "#FFE7D4",
    size: { width: 320, height: 240 },
    contentType: "markdown",
    isSystem: true,
  },
];

/**
 * 便签模板服务类
 */
export class NoteTemplateService {
  /**
   * 获取所有可用模板
   */
  static async getTemplates(): Promise<NoteTemplate[]> {
    // TODO: 从数据库获取用户自定义模板
    // const customTemplates = await dbOperations.getTemplates();

    const now = new Date();
    const builtinTemplates: NoteTemplate[] = BUILTIN_TEMPLATES.map(
      (template, index) => ({
        ...template,
        id: `builtin_${index}`,
        createdAt: now,
        updatedAt: now,
      })
    );

    return builtinTemplates;
  }

  /**
   * 根据模板创建便签
   */
  static async createNoteFromTemplate(
    templateId: string,
    canvasId: string,
    position: { x: number; y: number }
  ): Promise<Note> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // 使用模板数据创建便签
    const noteData = {
      canvasId,
      position,
      title: template.name,
      content: template.content,
      color: template.color,
      size: template.size,
      zIndex: 1,
    };

    const noteId = await NoteService.createNote(noteData);

    // 获取创建的便签并设置模板ID
    const notes = await NoteService.getAllNotes();
    const newNote = notes.find((n) => n.id === noteId);

    if (newNote) {
      await NoteService.updateNote(noteId, { templateId });
      return { ...newNote, templateId };
    }

    throw new Error("Failed to create note from template");
  }

  /**
   * 从现有便签创建模板
   */
  static async createTemplateFromNote(
    note: Note,
    templateName: string,
    templateDescription?: string
  ): Promise<NoteTemplate> {
    const now = new Date();
    const templateId = `template_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const template: NoteTemplate = {
      id: templateId,
      name: templateName,
      description: templateDescription || `基于便签"${note.title}"创建的模板`,
      content: note.content,
      color: note.color,
      size: note.size,
      contentType: note.contentType || "text",
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: 保存到数据库
    // await dbOperations.createTemplate(template);

    return template;
  }

  /**
   * 获取模板统计信息
   */
  static async getTemplateStats(): Promise<{
    total: number;
    builtin: number;
    custom: number;
    mostUsed: Array<{ templateId: string; name: string; usageCount: number }>;
  }> {
    const templates = await this.getTemplates();
    const allNotes = await NoteService.getAllNotes();

    // 统计模板使用情况
    const usageMap = new Map<string, number>();
    const templateNameMap = new Map<string, string>();

    templates.forEach((template) => {
      templateNameMap.set(template.id, template.name);
      usageMap.set(template.id, 0);
    });

    allNotes.forEach((note) => {
      if (note.templateId && usageMap.has(note.templateId)) {
        usageMap.set(note.templateId, (usageMap.get(note.templateId) || 0) + 1);
      }
    });

    const mostUsed = Array.from(usageMap.entries())
      .map(([templateId, usageCount]) => ({
        templateId,
        name: templateNameMap.get(templateId) || "未知模板",
        usageCount,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    return {
      total: templates.length,
      builtin: templates.filter((t) => t.isSystem).length,
      custom: templates.filter((t) => !t.isSystem).length,
      mostUsed,
    };
  }

  /**
   * 预览模板
   */
  static async previewTemplate(templateId: string): Promise<{
    template: NoteTemplate;
    preview: {
      title: string;
      content: string;
      color: string;
      size: Size;
    };
  }> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    return {
      template,
      preview: {
        title: template.name,
        content: template.content,
        color: template.color,
        size: template.size,
      },
    };
  }
}
