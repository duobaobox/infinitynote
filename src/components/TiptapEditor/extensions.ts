/**
 * Tiptap 扩展管理器
 */

import StarterKit from "@tiptap/starter-kit";
import type { Extension } from "@tiptap/core";

export class ExtensionManager {
  private extensions: Extension[] = [];

  constructor() {
    this.initializeDefaultExtensions();
  }

  private initializeDefaultExtensions(): void {
    this.extensions = [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "tiptap-paragraph",
          },
        },
      }),
    ];
  }

  getExtensions(): Extension[] {
    return [...this.extensions];
  }

  addExtension(extension: Extension): void {
    this.extensions.push(extension);
  }

  removeExtension(name: string): void {
    this.extensions = this.extensions.filter((ext) => ext.name !== name);
  }

  hasExtension(name: string): boolean {
    return this.extensions.some((ext) => ext.name === name);
  }
}
