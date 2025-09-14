/**
 * 简化的工具栏组件
 */

import React from "react";
import type { Editor } from "@tiptap/core";

interface ToolbarProps {
  editor: Editor | null;
  className?: string;
  showAdvanced?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  className = "",
  showAdvanced = false,
}) => {
  if (!editor) return null;

  return (
    <div className={`tiptap-toolbar ${className}`}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
        type="button"
      >
        粗体
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
        type="button"
      >
        斜体
      </button>

      {showAdvanced && (
        <>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
            type="button"
          >
            H1
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "active" : ""}
            type="button"
          >
            列表
          </button>
        </>
      )}
    </div>
  );
};
