import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Note, Size } from "../../types";
import type { AICustomProperties } from "../../types/ai";
import { NOTE_MIN_SIZE } from "../../types/constants";
import { useNoteStore } from "../../store/noteStore";
import { useTheme, noteColorThemes } from "../../theme";
import { TiptapEditor } from "../TiptapEditor";
import { NoteToolbar } from "../NoteToolbar/NoteToolbar";
import type { ToolbarAction } from "../NoteToolbar/types";
import { PromptTemplateSelector } from "../PromptTemplateSelector";
import type { PromptTemplate } from "../../config/promptTemplates";
import { useOptimizedNoteDrag } from "../../utils/dragOptimization";
import styles from "./index.module.css";

interface NoteCardProps {
  note: Note;
  scale: number;
  onSelect: (noteId: string) => void;
  isSelected: boolean;
  onResize?: (noteId: string, size: Size) => void;
}

/**
 * 便签卡片组件
 *
 * 功能特性：
 * - 支持拖拽操作
 * - 响应式缩放显示
 * - 主题颜色适配
 * - 选中状态显示
 *
 * 性能优化：
 * - 使用 memo 避免不必要的重渲染
 * - 硬件加速的拖拽动画
 */
export const NoteCard = memo<NoteCardProps>(
  ({ note, onSelect, isSelected, onResize }) => {
    const { isDark } = useTheme();
    const {
      updateNote,
      deleteNote,
      moveNote,
      resizeNote,
      startAIGeneration,
      aiGenerating,
      aiStreamingData,
    } = useNoteStore(); // 悬浮状态
    const [isHovered, setIsHovered] = useState(false);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);

    // 工具栏显示状态
    const [showToolbar, setShowToolbar] = useState(false);

    // AI内容编辑状态
    const [isEditingAIContent, setIsEditingAIContent] = useState(false);

    // 提示词模板选择器状态
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // AI 数据提取
    const aiData = note.customProperties?.ai as
      | AICustomProperties["ai"]
      | undefined;

    // 调试AI数据传递
    useEffect(() => {
      if (aiData) {
        console.log("📝 NoteCard AI数据:", {
          noteId: note.id.slice(-8),
          hasAiData: !!aiData,
          hasThinkingChain: !!aiData.thinkingChain,
          showThinking: aiData.showThinking,
          thinkingSteps: aiData.thinkingChain?.totalSteps || 0,
          model: aiData.model,
          provider: aiData.provider,
        });
      }
    }, [aiData, note.id]);

    // AI生成完成后自动进入编辑模式
    useEffect(() => {
      const wasGenerating = aiGenerating[note.id];
      const isCurrentlyGenerating = aiGenerating[note.id];

      // 如果AI刚刚完成生成（从生成中变为非生成中），且有AI数据，自动进入编辑模式
      if (!isCurrentlyGenerating && aiData?.generated && note.content) {
        // 延迟一点时间让用户看到生成完成的效果
        const timer = setTimeout(() => {
          setIsEditingAIContent(true);
          setIsEditing(true);
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [aiGenerating, note.id, aiData, note.content]);

    // 思维链展开状态（根据AI数据的thinkingCollapsed字段决定默认状态）
    const [thinkingChainExpanded, setThinkingChainExpanded] = useState(
      aiData?.showThinking !== false && aiData?.thinkingCollapsed !== true
    );

    // 🔧 关键修复：当 AI 数据变化时，同步思维链展开状态
    useEffect(() => {
      if (aiData?.showThinking !== undefined) {
        // 根据thinkingCollapsed字段决定展开状态
        const shouldExpand = aiData.showThinking && !aiData.thinkingCollapsed;
        setThinkingChainExpanded(shouldExpand);
        console.log(
          `🔄 NoteCard ${note.id.slice(-8)} 同步思维链展开状态: ${
            aiData.showThinking
          }`
        );
      }
    }, [aiData?.showThinking, note.id]);

    // 缩放状态
    const [isResizing, setIsResizing] = useState(false);
    const [resizeSize, setResizeSize] = useState<Size | null>(null);
    const resizeDataRef = useRef<{
      isActive: boolean;
      direction: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      currentWidth: number;
      currentHeight: number;
    } | null>(null);

    // 拖拽性能优化
    const {
      displayPosition,
      updateDrag,
      endDrag: endOptimizedDrag,
    } = useOptimizedNoteDrag(note.id, note.position, moveNote); // 使用 dnd-kit 的拖拽功能
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: dndIsDragging,
    } = useDraggable({
      id: note.id,
      data: {
        note,
      },
      // 只有在缩放时禁用拖拽，编辑时允许通过头部拖拽
      disabled: isResizing,
    }); // 拖拽状态跟踪
    const dragStateRef = useRef({
      isDragging: false,
      hasMoved: false,
      startX: 0,
      startY: 0,
    });

    // 监控拖拽状态变化
    useEffect(() => {
      if (dndIsDragging) {
        dragStateRef.current.isDragging = true;
        dragStateRef.current.hasMoved = true;

        // 如果使用transform，更新优化的拖拽状态
        if (transform) {
          updateDrag({ x: transform.x, y: transform.y });
        }
      } else {
        // 拖拽结束时使用优化的结束逻辑
        endOptimizedDrag();

        // 拖拽结束后短暂延迟重置状态，防止立即触发点击
        setTimeout(() => {
          dragStateRef.current = {
            isDragging: false,
            hasMoved: false,
            startX: 0,
            startY: 0,
          };
        }, 100);
      }
    }, [dndIsDragging, transform, updateDrag, endOptimizedDrag]);

    // 处理鼠标按下
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // 如果点击的是缩放控件，不处理
        if (
          target.closest(`.${styles.resizeHandle}`) ||
          target.classList.contains(styles.resizeHandle)
        ) {
          return;
        }

        // 选中便签
        if (!note.isSelected) {
          onSelect(note.id);
        }

        // 显示工具栏
        setShowToolbar(true);

        // 如果已经在编辑模式，直接返回让编辑器处理
        if (isEditing) {
          return;
        }

        // 记录开始位置
        dragStateRef.current = {
          isDragging: false,
          hasMoved: false,
          startX: e.clientX,
          startY: e.clientY,
        };
      },
      [note.id, note.isSelected, onSelect, isEditing]
    );

    // 处理点击编辑
    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        // 只处理左键单击
        if (e.button !== 0) return;

        const target = e.target as HTMLElement;

        // 如果点击的是缩放控件，不进入编辑模式
        if (
          target.closest(`.${styles.resizeHandle}`) ||
          target.classList.contains(styles.resizeHandle)
        ) {
          return;
        }

        // 检查是否有拖拽行为
        const hasMoved =
          Math.abs(e.clientX - dragStateRef.current.startX) > 5 ||
          Math.abs(e.clientY - dragStateRef.current.startY) > 5;

        // 只有在没有拖拽且不在缩放状态时才进入编辑模式
        if (!hasMoved && !isResizing && !isEditing) {
          e.stopPropagation();
          console.log("✍️ 单击进入编辑模式");
          setIsEditing(true);
        }
      },
      [note.id, onSelect, isSelected, isResizing, isEditing]
    );

    // 处理内容变化
    const handleContentChange = useCallback(
      (newContent: string) => {
        updateNote(note.id, { content: newContent });
      },
      [note.id, updateNote]
    );

    // 处理思维链展开/收起
    const handleThinkingChainToggle = useCallback(
      (expanded: boolean) => {
        setThinkingChainExpanded(expanded);
        // 同时更新便签的 AI 数据
        if (aiData) {
          updateNote(note.id, {
            customProperties: {
              ...note.customProperties,
              ai: {
                ...aiData,
                showThinking: expanded,
              },
            },
          });
        }
      },
      [note.id, note.customProperties, aiData, updateNote]
    );

    // 删除这个函数，合并到 handleMouseUp 中

    // 处理双击进入编辑（保留作为备用）
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // 阻止冒泡到画布
        if (!isEditing) {
          setIsEditing(true);
          // 确保便签被选中
          if (!isSelected) {
            onSelect(note.id);
          }
        }
      },
      [isEditing, isSelected, onSelect, note.id]
    );

    // 处理编辑器获得焦点
    const handleEditorFocus = useCallback(() => {
      if (!isEditing) {
        setIsEditing(true);
      }
    }, [isEditing]);

    // 处理AI生成
    const handleAIGenerate = useCallback(async () => {
      try {
        // 打开提示词模板选择器
        setShowTemplateSelector(true);
        setShowToolbar(false); // 关闭工具栏
      } catch (error) {
        console.error("AI生成失败:", error);
        // 可以在这里显示错误提示
      }
    }, []);

    // 处理模板选择
    const handleTemplateSelect = useCallback(
      async (template: PromptTemplate) => {
        try {
          let finalPrompt = template.prompt;

          // 处理模板中的变量替换
          if (template.prompt.includes("{{")) {
            // 提取模板变量
            const variables = template.prompt.match(/\{\{(\w+)\}\}/g);
            if (variables) {
              const variableValues: Record<string, string> = {};

              // 为每个变量请求用户输入
              for (const variable of variables) {
                const varName = variable.replace(/[{}]/g, "");
                const value = window.prompt(`请输入 ${varName}:`);
                if (value === null) return; // 用户取消
                variableValues[varName] = value || "";
              }

              // 替换模板中的变量
              finalPrompt = template.prompt.replace(
                /\{\{(\w+)\}\}/g,
                (match, varName) => {
                  return variableValues[varName] || match;
                }
              );
            }
          }

          console.log(
            `🤖 使用模板"${template.name}"为便签 ${note.id.slice(
              -8
            )} 生成AI内容`
          );
          await startAIGeneration(note.id, finalPrompt);
        } catch (error) {
          console.error("AI生成失败:", error);
          // 可以在这里显示错误提示
        }
      },
      [note.id, startAIGeneration]
    );

    // 处理AI配置
    const handleAIConfig = useCallback(() => {
      console.log("🔧 打开AI设置");
      // TODO: 打开设置模态框的AI标签页
      // 这里可以通过事件总线或上下文来打开设置
      setShowToolbar(false); // 关闭工具栏
    }, []);

    // 处理编辑AI内容
    const handleEditAIContent = useCallback(() => {
      setIsEditingAIContent(true);
      setIsEditing(true);
      setShowToolbar(false);
    }, []);

    // 处理重新生成AI内容
    const handleRegenerateAI = useCallback(async () => {
      if (!aiData?.prompt) {
        // 如果没有原始提示词，询问用户
        const prompt = window.prompt("请输入新的提示词:", aiData?.prompt || "");
        if (!prompt?.trim()) return;

        console.log(`🔄 重新生成便签 ${note.id.slice(-8)} 的AI内容`);
        await startAIGeneration(note.id, prompt.trim());
      } else {
        // 使用原始提示词重新生成
        console.log(
          `🔄 使用原提示词重新生成便签 ${note.id.slice(-8)} 的AI内容`
        );
        await startAIGeneration(note.id, aiData.prompt);
      }
      setShowToolbar(false);
    }, [note.id, aiData, startAIGeneration]);

    // 处理完成AI内容编辑
    const handleFinishEditingAI = useCallback(() => {
      setIsEditingAIContent(false);
      setIsEditing(false);
    }, []);

    // 处理工具栏操作
    const handleToolbarAction = useCallback(
      (action: ToolbarAction, data?: any) => {
        switch (action) {
          case "color":
            if (data?.color) {
              updateNote(note.id, { color: data.color });
            }
            break;
          case "delete":
            deleteNote(note.id);
            setShowToolbar(false);
            break;
          case "duplicate":
            // TODO: 实现复制功能
            console.log("Duplicate note:", note.id);
            break;
          case "pin":
            // TODO: 实现置顶功能
            console.log("Pin note:", note.id);
            break;
          case "ai-generate":
            handleAIGenerate();
            break;
          case "ai-config":
            handleAIConfig();
            break;
          case "ai-edit-content":
            handleEditAIContent();
            break;
          case "ai-regenerate":
            handleRegenerateAI();
            break;
          case "ai-finish-editing":
            handleFinishEditingAI();
            break;
          default:
            console.log("Unhandled action:", action);
        }
      },
      [
        note.id,
        updateNote,
        deleteNote,
        handleAIGenerate,
        handleAIConfig,
        handleEditAIContent,
        handleRegenerateAI,
        handleFinishEditingAI,
      ]
    ); // 关闭工具栏
    const handleCloseToolbar = useCallback(() => {
      setShowToolbar(false);
    }, []);

    // 优化的失焦处理 - 更加智能的编辑模式退出
    const handleEditorBlur = useCallback(
      (_editor?: any, _event?: FocusEvent) => {
        // 立即返回，让用户通过ESC或点击外部明确退出
        return;

        // 以下代码暂时禁用，改为手动退出模式
        /*
      // 检查焦点是否转移到了相关的编辑器元素（如工具栏）
      if (event?.relatedTarget) {
        const relatedElement = event.relatedTarget as HTMLElement;

        // 如果焦点转移到了工具栏按钮或其他编辑器相关元素，不要退出编辑模式
        if (
          relatedElement.closest(".tiptap-toolbar") ||
          relatedElement.closest(".tiptap-editor-container") ||
          relatedElement.classList.contains("tiptap-toolbar-button")
        ) {
          return;
        }
      }

      // 使用requestAnimationFrame + setTimeout确保在工具栏点击处理完成后再检查
      requestAnimationFrame(() => {
        setTimeout(() => {
          // 双重检查：如果当前焦点在编辑器相关元素上，不要退出编辑模式
          const activeElement = document.activeElement as HTMLElement;
          if (
            activeElement &&
            (activeElement.closest(".tiptap-toolbar") ||
              activeElement.closest(".tiptap-editor-container") ||
              activeElement.classList.contains("tiptap-toolbar-button"))
          ) {
            return;
          }
          setIsEditing(false);
        }, 100);
      });
      */
      },
      []
    );

    // 处理ESC键退出编辑
    const handleEditorEscape = useCallback(() => {
      setIsEditing(false);
    }, []);

    // 当前便签的引用
    const currentNoteRef = useRef<HTMLDivElement>(null);

    // 处理点击外部退出编辑模式和关闭工具栏
    const handleClickOutside = useCallback(
      (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // 检查点击是否在当前便签内部或工具栏内部
        const isInNoteCard =
          currentNoteRef.current && currentNoteRef.current.contains(target);
        const isInToolbar =
          target.closest("[data-note-toolbar]") ||
          target.closest(".noteToolbar");

        // 检查点击是否在Modal内部 (包括AI生成、设置等各种Modal)
        const isInModal =
          target.closest(".ant-modal") ||
          target.closest(".ant-modal-content") ||
          target.closest(".ant-modal-mask") ||
          target.closest("[role='dialog']") ||
          target.closest(".ant-drawer") ||
          target.closest(".ant-popover") ||
          target.closest(".ant-tooltip");

        if (!isInNoteCard && !isInToolbar && !isInModal) {
          if (isEditing) {
            setIsEditing(false);
          }
          if (showToolbar) {
            setShowToolbar(false);
          }
        }
      },
      [isEditing, showToolbar]
    );

    // 管理点击外部事件监听
    useEffect(() => {
      if (isEditing || showToolbar) {
        document.addEventListener("mousedown", handleClickOutside, true);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside, true);
        };
      }
    }, [isEditing, showToolbar, handleClickOutside]);

    // 缩放开始处理 - 使用useRef避免闭包问题
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: string) => {
        // 非常重要：阻止所有事件传播，防止触发拖拽
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }

        // console.log(
        //   `🔧 开始缩放便签 ${noteIdRef.current.slice(-8)}, 方向: ${direction}`
        // );

        // 确保便签被选中
        if (!isSelected) {
          onSelect(noteIdRef.current);
        }

        // 初始化缩放数据 - 使用当前的尺寸
        const currentSize = note.size;
        resizeDataRef.current = {
          isActive: true,
          direction,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: currentSize.width,
          startHeight: currentSize.height,
          currentWidth: currentSize.width,
          currentHeight: currentSize.height,
        };

        setIsResizing(true);

        // 防止页面滚动和文本选择
        document.body.style.userSelect = "none";
        document.body.style.cursor = "se-resize";
      },
      [isSelected, onSelect, note.size]
    );

    // 使用useRef保存最新的函数引用，避免闭包问题
    const resizeNoteRef = useRef(resizeNote);
    const onResizeRef = useRef(onResize);
    const noteIdRef = useRef(note.id);

    // 更新refs
    useEffect(() => {
      resizeNoteRef.current = resizeNote;
      onResizeRef.current = onResize;
      noteIdRef.current = note.id;
    });

    // 缩放过程处理 - 使用useRef避免闭包问题
    const handleResizeMove = useCallback((e: MouseEvent) => {
      const resizeData = resizeDataRef.current;
      if (!resizeData || !resizeData.isActive) return;

      e.preventDefault();

      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;

      let newWidth = resizeData.startWidth;
      let newHeight = resizeData.startHeight;

      // 只支持右下角缩放（最常用的缩放方式）
      if (resizeData.direction === "se") {
        newWidth = resizeData.startWidth + deltaX;
        newHeight = resizeData.startHeight + deltaY;
      }

      // 应用尺寸限制，只限制最小值，不限制最大值
      newWidth = Math.max(NOTE_MIN_SIZE.width, newWidth);
      newHeight = Math.max(NOTE_MIN_SIZE.height, newHeight);

      const finalWidth = Math.round(newWidth);
      const finalHeight = Math.round(newHeight);

      // 更新ref中的当前尺寸，避免不必要的调用
      if (
        finalWidth !== resizeData.currentWidth ||
        finalHeight !== resizeData.currentHeight
      ) {
        resizeData.currentWidth = finalWidth;
        resizeData.currentHeight = finalHeight;

        // 只更新本地视觉状态，避免频繁触发全局状态更新
        setResizeSize({ width: finalWidth, height: finalHeight });

        // console.log(`📏 缩放中: ${finalWidth}x${finalHeight}`);
      }
    }, []);

    // 缩放结束处理 - 使用useRef避免闭包问题
    const handleResizeEnd = useCallback(() => {
      const resizeData = resizeDataRef.current;
      if (!resizeData || !resizeData.isActive) return;

      // console.log("🔚 缩放结束");

      // 设置为非活动状态
      resizeData.isActive = false;
      setIsResizing(false);
      setResizeSize(null); // 清除本地调整状态

      // 移除全局事件监听器
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("mouseleave", handleResizeEnd);

      // 重置光标和用户选择
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // 最终保存到数据库 - 使用最新的函数引用和数据
      if (
        resizeData.currentWidth &&
        resizeData.currentHeight &&
        (resizeData.currentWidth !== resizeData.startWidth ||
          resizeData.currentHeight !== resizeData.startHeight)
      ) {
        const finalSize: Size = {
          width: resizeData.currentWidth,
          height: resizeData.currentHeight,
        };
        resizeNoteRef.current(noteIdRef.current, finalSize);
        onResizeRef.current?.(noteIdRef.current, finalSize);
        // console.log(`💾 保存最终尺寸: ${finalSize.width}x${finalSize.height}`);
      }
    }, [handleResizeMove]);

    // 缩放时的键盘支持
    const handleResizeKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isResizing) return;

        // ESC键取消缩放
        if (e.key === "Escape") {
          e.preventDefault();
          handleResizeEnd();
        }
      },
      [isResizing, handleResizeEnd]
    );

    // 管理缩放事件监听器
    useEffect(() => {
      if (isResizing) {
        // 添加全局事件监听
        document.addEventListener("mousemove", handleResizeMove, true);
        document.addEventListener("mouseup", handleResizeEnd, true);
        document.addEventListener("keydown", handleResizeKeyDown, true);

        return () => {
          // 清理事件监听
          document.removeEventListener("mousemove", handleResizeMove, true);
          document.removeEventListener("mouseup", handleResizeEnd, true);
          document.removeEventListener("keydown", handleResizeKeyDown, true);
        };
      }
    }, [isResizing, handleResizeMove, handleResizeEnd, handleResizeKeyDown]);

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        // 确保清理所有可能残留的事件监听器
        document.removeEventListener("mousemove", handleResizeMove, true);
        document.removeEventListener("mouseup", handleResizeEnd, true);
        document.removeEventListener("keydown", handleResizeKeyDown, true);

        // 恢复页面状态
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }, []);

    const getColorStyle = () => {
      // 根据主题选择颜色映射
      const themeColors = isDark ? noteColorThemes.dark : noteColorThemes.light;

      // 十六进制颜色到颜色名称的映射
      const colorHexToName: Record<string, keyof typeof themeColors> = {
        "#FFF2CC": "yellow",
        "#FFE6E6": "pink",
        "#E6F3FF": "blue",
        "#E6FFE6": "green",
        "#F0E6FF": "purple",
        "#FFE6CC": "orange",
        "#FFD6D6": "red",
        "#F0F0F0": "gray",
      };

      // 获取颜色名称，默认为 yellow
      const colorName = colorHexToName[note.color] || "yellow";
      const backgroundColor = themeColors[colorName];

      return {
        backgroundColor,
        // 在暗黑主题下调整边框和文字颜色
        border: isDark ? `1px solid ${backgroundColor}` : "none",
        color: isDark ? "var(--color-text)" : "var(--color-text)",
      };
    };

    // 计算拖拽时的样式
    const dragStyle = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : {};

    return (
      <>
        {" "}
        {/* 便签容器包装器 - 统一管理便签和工具栏的布局 */}
        <div
          className={styles.noteCardContainer}
          style={{
            left: displayPosition.x,
            top: displayPosition.y,
            zIndex: note.zIndex,
            ...dragStyle,
          }}
        >
          {/* 便签主体 */}
          <div
            ref={(node) => {
              setNodeRef(node);
              currentNoteRef.current = node;
            }}
            data-note-card
            className={`${styles.noteCard} ${
              dndIsDragging ? styles.dragging : ""
            } ${isSelected ? styles.selected : ""} ${
              isResizing ? styles.resizing : ""
            } ${isEditing ? styles.editing : ""}`}
            style={{
              width: resizeSize?.width ?? note.size.width,
              height: resizeSize?.height ?? note.size.height,
              position: "relative", // 相对定位，不再需要left/top
              ...getColorStyle(),
            }}
            // 非编辑状态：整个便签可拖拽
            {...(!isEditing && !isResizing ? listeners : {})}
            {...(!isEditing && !isResizing ? attributes : {})}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={handleDoubleClick}
          >
            {isSelected && <div className={styles.selectionBorder} />}

            {/* 
              便签头部区域 - 统一拖拽管理
              拖拽策略：
              1. 非编辑状态：整个便签可拖拽（通过主容器的listeners）
              2. 编辑状态：只有头部可拖拽（通过头部的listeners）
              3. 缩放状态：禁用所有拖拽
            */}
            <div
              className={styles.noteHeader}
              // 编辑状态下应用拖拽监听器到头部
              {...(isEditing && !isResizing ? listeners : {})}
              {...(isEditing && !isResizing ? attributes : {})}
              style={{
                cursor: isEditing ? "grab" : "default",
              }}
              onMouseDown={(e) => {
                if (isEditing) {
                  // 编辑状态下，阻止事件冒泡，确保只通过dnd-kit处理拖拽
                  e.stopPropagation();
                } else {
                  // 非编辑状态下，正常处理点击（用于选择等操作）
                  handleMouseDown(e);
                }
              }}
            >
              <h3 className={styles.noteTitle}>{note.title || "Untitled"}</h3>
            </div>

            {/* 便签内容区域 - 编辑器 */}
            <div className={styles.noteContent}>
              <TiptapEditor
                content={
                  // 如果正在生成AI内容且有流式数据，显示流式内容；否则显示原内容
                  aiGenerating[note.id] && aiStreamingData[note.id]
                    ? aiStreamingData[note.id] || ""
                    : note.content || ""
                }
                onContentChange={handleContentChange}
                placeholder={
                  aiGenerating[note.id]
                    ? "AI正在生成内容..."
                    : isSelected
                    ? "开始输入内容..."
                    : "点击编辑便签内容..."
                }
                height="100%"
                className={styles.noteText}
                autoFocus={isEditing}
                readonly={
                  (!isEditing && !isEditingAIContent) || aiGenerating[note.id]
                }
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                onEscape={handleEditorEscape}
                debounceDelay={300}
                // AI 功能相关属性
                aiData={aiData}
                thinkingChainExpanded={thinkingChainExpanded}
                onThinkingChainToggle={handleThinkingChainToggle}
              />
            </div>

            {/* 缩放控件 - 只显示右下角，悬浮或选中时显示 */}
            {(isSelected || isHovered || isResizing) && (
              <div
                className={`${styles.resizeHandle} ${styles["resize-se"]}`}
                onMouseDown={(e) => handleResizeStart(e, "se")}
                onPointerDown={(e) => {
                  // 阻止事件冒泡到拖拽监听器
                  e.stopPropagation();
                }}
                title="拖拽调整便签大小"
              />
            )}
          </div>

          {/* 便签工具栏 - 使用CSS定位在便签右侧 */}
          {showToolbar && isSelected && (
            <div className={styles.noteToolbarWrapper}>
              <NoteToolbar
                noteId={note.id}
                visible={true}
                color={note.color}
                onAction={handleToolbarAction}
                onClose={handleCloseToolbar}
                hasAIContent={!!aiData?.generated}
                isAIGenerating={!!aiGenerating[note.id]}
                isEditingAIContent={isEditingAIContent}
              />
            </div>
          )}
        </div>
        {/* 提示词模板选择器 */}
        <PromptTemplateSelector
          visible={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleTemplateSelect}
        />
      </>
    );
  }
);

NoteCard.displayName = "NoteCard";
