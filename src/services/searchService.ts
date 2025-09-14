/**
 * 便签搜索服务
 *
 * 提供高级搜索功能，包括全文搜索、标签搜索、智能搜索等
 */

import type { Note } from "../types";
import { NoteService } from "./noteService";

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索范围 */
  scope?: "title" | "content" | "all";
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否模糊搜索 */
  fuzzy?: boolean;
  /** 是否支持正则表达式 */
  regex?: boolean;
  /** 搜索结果限制 */
  limit?: number;
  /** 高亮匹配文本 */
  highlight?: boolean;
  /** 过滤条件 */
  filters?: {
    canvasId?: string;
    colors?: string[];
    tags?: string[];
    priority?: number[];
    dateRange?: { start: Date; end: Date };
  };
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  note: Note;
  /** 匹配评分 */
  score: number;
  /** 匹配的字段 */
  matchedFields: Array<"title" | "content" | "tags">;
  /** 高亮的内容片段 */
  highlights?: {
    title?: string;
    content?: string[];
  };
}

/**
 * 搜索统计
 */
export interface SearchStats {
  total: number;
  byCanvas: Record<string, number>;
  byColor: Record<string, number>;
  byPriority: Record<number, number>;
  searchTime: number;
}

/**
 * 便签搜索服务类
 */
export class NoteSearchService {
  /**
   * 全文搜索便签
   */
  static async searchNotes(
    query: string,
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[];
    stats: SearchStats;
  }> {
    const startTime = Date.now();

    const {
      scope = "all",
      caseSensitive = false,
      fuzzy = false,
      regex = false,
      limit = 50,
      highlight = true,
      filters = {},
    } = options;

    // 获取所有便签
    let allNotes = await NoteService.getAllNotes();

    // 应用过滤条件
    allNotes = this.applyFilters(allNotes, filters);

    // 执行搜索
    const searchResults: SearchResult[] = [];

    for (const note of allNotes) {
      const result = this.searchInNote(note, query, {
        scope,
        caseSensitive,
        fuzzy,
        regex,
        highlight,
      });

      if (result.score > 0) {
        searchResults.push(result);
      }
    }

    // 按评分排序
    searchResults.sort((a, b) => b.score - a.score);

    // 限制结果数量
    const limitedResults = searchResults.slice(0, limit);

    // 生成统计信息
    const stats = this.generateSearchStats(limitedResults, startTime);

    return {
      results: limitedResults,
      stats,
    };
  }

  /**
   * 智能搜索（基于相似度）
   */
  static async smartSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { results } = await this.searchNotes(query, options);

    // 使用更复杂的评分算法
    return results
      .map((result) => ({
        ...result,
        score: this.calculateSmartScore(result, query),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 标签搜索
   */
  static async searchByTags(
    tags: string[],
    matchAll: boolean = false
  ): Promise<Note[]> {
    const allNotes = await NoteService.getAllNotes();

    return allNotes.filter((note) => {
      if (!note.tags || note.tags.length === 0) return false;

      if (matchAll) {
        // 必须包含所有标签
        return tags.every((tag) => note.tags!.includes(tag));
      } else {
        // 包含任意一个标签即可
        return tags.some((tag) => note.tags!.includes(tag));
      }
    });
  }

  /**
   * 相似便签搜索
   */
  static async findSimilarNotes(
    noteId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const allNotes = await NoteService.getAllNotes();
    const targetNote = allNotes.find((note) => note.id === noteId);

    if (!targetNote) {
      throw new Error(`Note with id ${noteId} not found`);
    }

    const similarityResults: SearchResult[] = [];

    for (const note of allNotes) {
      if (note.id === noteId) continue;

      const similarity = this.calculateSimilarity(targetNote, note);
      if (similarity > 0.1) {
        // 最低相似度阈值
        similarityResults.push({
          note,
          score: similarity,
          matchedFields: this.getMatchedFields(targetNote, note),
        });
      }
    }

    return similarityResults.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 搜索建议（自动完成）
   */
  static async getSearchSuggestions(
    partialQuery: string,
    limit: number = 10
  ): Promise<
    Array<{
      text: string;
      type: "content" | "title" | "tag";
      count: number;
    }>
  > {
    const allNotes = await NoteService.getAllNotes();
    const suggestions = new Map<
      string,
      { type: "content" | "title" | "tag"; count: number }
    >();

    const query = partialQuery.toLowerCase();

    for (const note of allNotes) {
      // 标题建议
      if (note.title.toLowerCase().includes(query)) {
        const key = note.title;
        suggestions.set(key, {
          type: "title",
          count: (suggestions.get(key)?.count || 0) + 1,
        });
      }

      // 内容建议（提取关键词）
      const words = note.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.includes(query) && word.length > 2) {
          suggestions.set(word, {
            type: "content",
            count: (suggestions.get(word)?.count || 0) + 1,
          });
        }
      }

      // 标签建议
      if (note.tags) {
        for (const tag of note.tags) {
          if (tag.toLowerCase().includes(query)) {
            suggestions.set(tag, {
              type: "tag",
              count: (suggestions.get(tag)?.count || 0) + 1,
            });
          }
        }
      }
    }

    return Array.from(suggestions.entries())
      .map(([text, data]) => ({ text, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 在单个便签中搜索
   */
  private static searchInNote(
    note: Note,
    query: string,
    options: {
      scope: "title" | "content" | "all";
      caseSensitive: boolean;
      fuzzy: boolean;
      regex: boolean;
      highlight: boolean;
    }
  ): SearchResult {
    const { scope, caseSensitive, fuzzy, regex, highlight } = options;

    let score = 0;
    const matchedFields: Array<"title" | "content" | "tags"> = [];
    const highlights: { title?: string; content?: string[] } = {};

    const searchQuery = caseSensitive ? query : query.toLowerCase();

    // 搜索标题
    if (scope === "title" || scope === "all") {
      const title = caseSensitive ? note.title : note.title.toLowerCase();
      const titleMatch = this.performMatch(title, searchQuery, {
        fuzzy,
        regex,
      });

      if (titleMatch.matches) {
        score += titleMatch.score * 2; // 标题匹配权重更高
        matchedFields.push("title");

        if (highlight) {
          highlights.title = this.highlightText(
            note.title,
            query,
            caseSensitive
          );
        }
      }
    }

    // 搜索内容
    if (scope === "content" || scope === "all") {
      const content = caseSensitive ? note.content : note.content.toLowerCase();
      const contentMatch = this.performMatch(content, searchQuery, {
        fuzzy,
        regex,
      });

      if (contentMatch.matches) {
        score += contentMatch.score;
        matchedFields.push("content");

        if (highlight) {
          highlights.content = this.extractHighlightedSnippets(
            note.content,
            query,
            caseSensitive
          );
        }
      }
    }

    // 搜索标签
    if (note.tags && note.tags.length > 0) {
      const tagMatches = note.tags.filter((tag) => {
        const tagText = caseSensitive ? tag : tag.toLowerCase();
        return this.performMatch(tagText, searchQuery, { fuzzy, regex })
          .matches;
      });

      if (tagMatches.length > 0) {
        score += tagMatches.length * 1.5; // 标签匹配也有较高权重
        matchedFields.push("tags");
      }
    }

    return {
      note,
      score,
      matchedFields,
      highlights: Object.keys(highlights).length > 0 ? highlights : undefined,
    };
  }

  /**
   * 执行匹配
   */
  private static performMatch(
    text: string,
    query: string,
    options: { fuzzy: boolean; regex: boolean }
  ): { matches: boolean; score: number } {
    const { fuzzy, regex } = options;

    if (regex) {
      try {
        const regexPattern = new RegExp(query, "gi");
        const matches = text.match(regexPattern);
        return {
          matches: matches !== null,
          score: matches ? matches.length : 0,
        };
      } catch {
        // 正则表达式无效，回退到普通搜索
        return {
          matches: text.includes(query),
          score: text.includes(query) ? 1 : 0,
        };
      }
    }

    if (fuzzy) {
      const score = this.fuzzyMatch(text, query);
      return {
        matches: score > 0.3, // 模糊匹配阈值
        score,
      };
    }

    // 普通匹配
    const exactMatches = (text.match(new RegExp(query, "gi")) || []).length;
    return {
      matches: exactMatches > 0,
      score: exactMatches,
    };
  }

  /**
   * 模糊匹配算法（简化版）
   */
  private static fuzzyMatch(text: string, query: string): number {
    if (query.length === 0) return 0;
    if (text.length === 0) return 0;

    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i].toLowerCase() === query[queryIndex].toLowerCase()) {
        score++;
        queryIndex++;
      }
    }

    return queryIndex === query.length ? score / query.length : 0;
  }

  /**
   * 高亮文本
   */
  private static highlightText(
    text: string,
    query: string,
    caseSensitive: boolean
  ): string {
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(`(${query})`, flags);
    return text.replace(regex, "<mark>$1</mark>");
  }

  /**
   * 提取高亮片段
   */
  private static extractHighlightedSnippets(
    text: string,
    query: string,
    caseSensitive: boolean,
    snippetLength: number = 100
  ): string[] {
    const flags = caseSensitive ? "gi" : "gi";
    const regex = new RegExp(query, flags);
    const matches = [...text.matchAll(regex)];

    const snippets: string[] = [];

    for (const match of matches) {
      if (match.index !== undefined) {
        const start = Math.max(0, match.index - snippetLength / 2);
        const end = Math.min(
          text.length,
          match.index + query.length + snippetLength / 2
        );
        const snippet = text.slice(start, end);
        const highlightedSnippet = this.highlightText(
          snippet,
          query,
          caseSensitive
        );

        snippets.push(
          (start > 0 ? "..." : "") +
            highlightedSnippet +
            (end < text.length ? "..." : "")
        );
      }
    }

    return snippets.slice(0, 3); // 最多返回3个片段
  }

  /**
   * 应用过滤条件
   */
  private static applyFilters(
    notes: Note[],
    filters: SearchOptions["filters"] = {}
  ): Note[] {
    return notes.filter((note) => {
      // 画布过滤
      if (filters.canvasId && note.canvasId !== filters.canvasId) {
        return false;
      }

      // 颜色过滤
      if (filters.colors && !filters.colors.includes(note.color)) {
        return false;
      }

      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const noteTags = note.tags || [];
        if (!filters.tags.some((tag) => noteTags.includes(tag))) {
          return false;
        }
      }

      // 优先级过滤
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(note.priority || 0)) {
          return false;
        }
      }

      // 日期范围过滤
      if (filters.dateRange) {
        const noteDate = new Date(note.createdAt);
        if (
          noteDate < filters.dateRange.start ||
          noteDate > filters.dateRange.end
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 计算便签相似度
   */
  private static calculateSimilarity(note1: Note, note2: Note): number {
    let similarity = 0;

    // 标签相似度
    if (note1.tags && note2.tags) {
      const commonTags = note1.tags.filter((tag) => note2.tags!.includes(tag));
      similarity += commonTags.length * 0.3;
    }

    // 颜色相似度
    if (note1.color === note2.color) {
      similarity += 0.1;
    }

    // 内容相似度（简化版）
    const content1Words = note1.content.toLowerCase().split(/\s+/);
    const content2Words = note2.content.toLowerCase().split(/\s+/);
    const commonWords = content1Words.filter(
      (word) => word.length > 3 && content2Words.includes(word)
    );
    similarity +=
      (commonWords.length /
        Math.max(content1Words.length, content2Words.length)) *
      0.5;

    return similarity;
  }

  /**
   * 获取匹配字段
   */
  private static getMatchedFields(
    note1: Note,
    note2: Note
  ): Array<"title" | "content" | "tags"> {
    const fields: Array<"title" | "content" | "tags"> = [];

    if (note1.tags && note2.tags) {
      const commonTags = note1.tags.filter((tag) => note2.tags!.includes(tag));
      if (commonTags.length > 0) {
        fields.push("tags");
      }
    }

    return fields;
  }

  /**
   * 计算智能评分
   */
  private static calculateSmartScore(
    result: SearchResult,
    query: string
  ): number {
    let score = result.score;

    // 标题匹配加分
    if (result.matchedFields.includes("title")) {
      score *= 1.5;
    }

    // 完全匹配加分
    if (result.note.title.toLowerCase().includes(query.toLowerCase())) {
      score *= 1.2;
    }

    // 最近更新的便签加分
    const daysSinceUpdate =
      (Date.now() - result.note.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      score *= 1.1;
    }

    return score;
  }

  /**
   * 生成搜索统计
   */
  private static generateSearchStats(
    results: SearchResult[],
    startTime: number
  ): SearchStats {
    const stats: SearchStats = {
      total: results.length,
      byCanvas: {},
      byColor: {},
      byPriority: {},
      searchTime: Date.now() - startTime,
    };

    results.forEach((result) => {
      const note = result.note;

      // 按画布统计
      stats.byCanvas[note.canvasId] = (stats.byCanvas[note.canvasId] || 0) + 1;

      // 按颜色统计
      stats.byColor[note.color] = (stats.byColor[note.color] || 0) + 1;

      // 按优先级统计
      const priority = note.priority || 0;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return stats;
  }
}
