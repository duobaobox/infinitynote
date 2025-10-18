import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { App } from "antd";
import type { Note, Size } from "../../types";
import type { AICustomProperties } from "../../types/ai";
import { NOTE_MIN_SIZE } from "../../types/constants";
import { useNoteStore } from "../../store/noteStore";
import { useFocusModeStore } from "../../store/focusModeStore";
import { useTheme, noteColorThemes } from "../../theme";
import { TiptapEditor } from "../TiptapEditor";
import { AntdStepsThinkingChain } from "../TiptapEditor/AntdStepsThinkingChain";
import { NoteToolbar } from "../NoteToolbar/NoteToolbar";
import type { ToolbarAction } from "../NoteToolbar/types";
import { useOptimizedNoteDrag } from "../../utils/dragOptimization";
import { ConnectionPoint } from "../ConnectionPoint";
import { useConnectionStore } from "../../store/connectionStore";
import { useVerticalScrollbarDetection } from "../../hooks/useScrollbarDetection";
import { useSimpleAIAutoScroll } from "../../hooks/useSimpleAIAutoScroll";
import { NOTE_COLOR_PRESETS } from "../../config/noteColors";
import { loadSettingsFromStorage } from "../SettingsModal/utils";
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
  ({ note, onSelect, isSelected, onResize, scale }) => {
    const { isDark } = useTheme();
    const { message } = App.useApp();
    const {
      updateNote,
      deleteNote,
      moveNote,
      resizeNote,
      aiGenerating,
      aiStreamingData,
    } = useNoteStore();

    // 专注模式状态
    const { openFocusMode } = useFocusModeStore();

    // 连接状态
    const {
      isNoteConnected,
      addConnection,
      canAddConnection,
      removeConnection,
    } = useConnectionStore();
    const [isHovered, setIsHovered] = useState(false);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);

    // 标题编辑状态
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(note.title || "");
    const titleInputRef = useRef<HTMLInputElement>(null);

    // 工具栏显示状态
    const [showToolbar, setShowToolbar] = useState(false);

    // 编辑状态时断开所有连接线
    useEffect(() => {
      if (isEditing) {
        removeConnection(note.id);
      }
    }, [isEditing, note.id, removeConnection]);
    // 退出编辑时自动隐藏悬浮
    useEffect(() => {
      if (!isEditing) {
        setIsHovered(false);
      }
    }, [isEditing]);

    // AI 数据提取
    const aiData = note.customProperties?.ai as
      | AICustomProperties["ai"]
      | undefined;

    // AI自动滚动功能
    const { performAutoScroll } = useSimpleAIAutoScroll();

    // 监听AI流式数据变化，触发自动滚动
    useEffect(() => {
      if (aiGenerating[note.id] && aiStreamingData[note.id]) {
        console.log(
          `🔄 [AI滚动] 检测到便签 ${note.id.slice(-8)} 的AI数据更新`,
          {
            contentLength: aiStreamingData[note.id]?.length || 0,
            isGenerating: aiGenerating[note.id],
          }
        );

        // 稍微延迟以确保DOM更新完成
        const timer = setTimeout(() => {
          performAutoScroll(note.id);
        }, 50);

        return () => clearTimeout(timer);
      }
    }, [
      aiGenerating[note.id],
      aiStreamingData[note.id],
      note.id,
      performAutoScroll,
    ]);

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

    // 思维链展开状态（默认折叠）
    const [thinkingChainExpanded, setThinkingChainExpanded] = useState(false);

    // 思维链默认保持折叠状态，不自动展开
    // useEffect(() => {
    //   if (aiData?.showThinking !== undefined) {
    //     // 根据thinkingCollapsed字段决定展开状态
    //     const shouldExpand = aiData.showThinking && !aiData.thinkingCollapsed;
    //     setThinkingChainExpanded(shouldExpand);
    //   }
    // }, [aiData?.showThinking, note.id]);

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

        // 如果点击的是连接点，不处理 - 让连接点自己处理
        if (
          target.closest("[data-note-connection-point]") ||
          target.hasAttribute("data-note-connection-point")
        ) {
          return;
        }

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

        // AI生成时不显示工具栏
        if (!aiGenerating[note.id]) {
          setShowToolbar(true);
        }

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

        // 如果点击的是连接点，不处理 - 让连接点自己处理
        if (
          target.closest("[data-note-connection-point]") ||
          target.hasAttribute("data-note-connection-point")
        ) {
          return;
        }

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
        // 注意：不修改 showThinking 字段，showThinking 控制思维链功能的整体开关
        // expanded 只控制当前便签的思维链内容区域展开/折叠状态
        // 这样可以确保点击头部折叠时，只隐藏内容区域而不是整个思维链容器
      },
      [
        // 移除不必要的依赖项，简化依赖数组
        thinkingChainExpanded,
      ]
    );

    // 删除这个函数，合并到 handleMouseUp 中

    // 处理双击进入编辑（保留作为备用）

    // 处理编辑器获得焦点
    const handleEditorFocus = useCallback(() => {
      if (!isEditing) {
        setIsEditing(true);
      }
    }, [isEditing]);

    // 处理连接点点击
    const handleConnectionClick = useCallback(
      (noteId: string) => {
        // 检查是否已经连接
        if (isNoteConnected(noteId)) {
          return;
        }

        // 检查是否可以添加连接
        if (!canAddConnection()) {
          return;
        }

        // 添加连接
        const success = addConnection(note);
        if (success) {
          console.log("✅ 便签连接成功");
        } else {
          console.log("❌ 便签连接失败");
        }
      },
      [note, isNoteConnected, canAddConnection, addConnection]
    );

    // 处理工具栏操作
    const handleToolbarAction = useCallback(
      async (action: ToolbarAction, data?: any) => {
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
            // 复制便签文本内容到剪贴板
            try {
              // 从HTML内容中提取纯文本
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = note.content;
              const plainText = tempDiv.textContent || tempDiv.innerText || "";

              // 复制到剪贴板
              await navigator.clipboard.writeText(plainText);

              // 显示成功提示
              message.success("文本已复制到剪贴板");
            } catch (error) {
              console.error("复制文本失败:", error);
              message.error("复制失败，请重试");
            }
            break;
          case "floating":
            // 创建悬浮便签
            try {
              if (window.electronAPI?.floating?.createFloatingNote) {
                const result =
                  await window.electronAPI.floating.createFloatingNote({
                    noteId: note.id,
                    title: note.title,
                    content: note.content,
                    color: note.color,
                    width: note.size.width,
                    height: note.size.height,
                  });

                if (result.success) {
                  message.success("便签已设为悬浮显示");
                  setShowToolbar(false);
                } else {
                  message.error(
                    "创建悬浮便签失败: " + (result.error || "未知错误")
                  );
                }
              } else {
                message.warning("悬浮功能仅在桌面应用中可用");
              }
            } catch (error) {
              console.error("创建悬浮便签失败:", error);
              message.error("创建悬浮便签失败");
            }
            break;
          case "pin":
            message.info("该功能暂未开放");
            break;
          case "focus-mode":
            // 打开专注模式，传入当前便签ID
            openFocusMode(note.id);
            setShowToolbar(false);
            break;

          default:
            console.log("Unhandled action:", action);
        }
      },
      [
        note.id,
        note.content,
        note.title,
        note.color,
        note.size,
        updateNote,
        deleteNote,
        openFocusMode,
        message,
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

    // 点击外部退出标题编辑
    const handleTitleBlur = useCallback(() => {
      if (isEditingTitle) {
        // 更新标题
        updateNote(note.id, { title: titleValue.trim() || "Untitled" });
        setIsEditingTitle(false);
      }
    }, [isEditingTitle, note.id, titleValue, updateNote]);

    // ESC键或回车键处理标题编辑
    const handleTitleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setIsEditingTitle(false);
          setTitleValue(note.title || "");
        } else if (e.key === "Enter") {
          e.preventDefault();
          updateNote(note.id, { title: titleValue.trim() || "Untitled" });
          setIsEditingTitle(false);
        }
      },
      [note.id, note.title, titleValue, updateNote]
    );

    // 双击标题编辑
    const handleTitleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        // 如果当前正在编辑内容，先停止内容编辑
        if (isEditing) {
          setIsEditing(false);
        }
        setIsEditingTitle(true);
        setTitleValue(note.title || "");
        // 延迟聚焦到输入框
        setTimeout(() => {
          titleInputRef.current?.focus();
          titleInputRef.current?.select();
        }, 10); // 多延迟一点时间以确保组件完全渲染
      },
      [note.title, isEditing]
    );

    // 当前便签的引用
    const currentNoteRef = useRef<HTMLDivElement>(null);

    // ProseMirror滚动容器的引用 - 用于滚动条检测
    const [proseMirrorElement, setProseMirrorElement] =
      useState<HTMLElement | null>(null);

    // 检测TiptapEditor内容区域是否有垂直滚动条
    const hasVerticalScrollbar = useVerticalScrollbarDetection(
      proseMirrorElement,
      {
        debounceDelay: 16, // 约一个动画帧的时间
        immediate: false, // 保持防抖，但使用很短的延迟
      }
    );

    // 当编辑状态或便签尺寸变化时，重新获取ProseMirror元素
    useEffect(() => {
      if (currentNoteRef.current) {
        // 使用requestAnimationFrame代替setTimeout，更快响应
        const frameId = requestAnimationFrame(() => {
          const proseMirror = currentNoteRef.current?.querySelector(
            ".ProseMirror"
          ) as HTMLElement;
          setProseMirrorElement(proseMirror);
        });

        return () => cancelAnimationFrame(frameId);
      } else {
        // 便签引用不存在时清除引用
        setProseMirrorElement(null);
      }
    }, [isEditing, note.size, note.content]); // 添加note.content以在内容变化时重新检测

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

        // 检查点击是否在标题编辑输入框内部
        const isInTitleInput =
          target === titleInputRef.current ||
          (titleInputRef.current && titleInputRef.current.contains(target));

        if (!isInNoteCard && !isInToolbar && !isInModal && !isInTitleInput) {
          if (isEditing) {
            setIsEditing(false);
          }
          if (showToolbar) {
            setShowToolbar(false);
          }
          if (isEditingTitle) {
            // 更新标题
            updateNote(note.id, { title: titleValue.trim() || "Untitled" });
            setIsEditingTitle(false);
          }
        }
      },
      [isEditing, showToolbar, isEditingTitle, note.id, titleValue, updateNote]
    );

    // 管理点击外部事件监听
    useEffect(() => {
      if (isEditing || showToolbar || isEditingTitle) {
        document.addEventListener("mousedown", handleClickOutside, true);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside, true);
        };
      }
    }, [isEditing, showToolbar, isEditingTitle, handleClickOutside]);

    // AI生成时自动隐藏工具栏，生成结束后不自动显示
    useEffect(() => {
      if (aiGenerating[note.id]) {
        setShowToolbar(false);
      }
    }, [aiGenerating, note.id]);

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
    const handleResizeMove = useCallback(
      (e: MouseEvent) => {
        const resizeData = resizeDataRef.current;
        if (!resizeData || !resizeData.isActive) return;

        e.preventDefault();

        // CSS zoom 会影响坐标系统，需要将鼠标位移除以 scale
        const deltaX = (e.clientX - resizeData.startX) / scale;
        const deltaY = (e.clientY - resizeData.startY) / scale;

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
      },
      [scale]
    );

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

    const [noteSettings, setNoteSettings] = useState(
      () => loadSettingsFromStorage().note
    );

    // 监听设置变化事件
    useEffect(() => {
      const handleSettingsChange = (e: Event) => {
        // 安全检查：只处理包含 detail 的 CustomEvent
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.section === "note") {
          setNoteSettings((prev) => ({
            ...prev,
            [customEvent.detail.key]: customEvent.detail.value,
          }));
        }
      };

      window.addEventListener(
        "settingsChanged",
        handleSettingsChange as EventListener
      );
      return () => {
        window.removeEventListener(
          "settingsChanged",
          handleSettingsChange as EventListener
        );
      };
    }, []);

    const getColorStyle = () => {
      // 根据主题选择颜色映射
      const themeColors = isDark ? noteColorThemes.dark : noteColorThemes.light;

      // 动态生成颜色映射，从颜色配置中获取
      const colorHexToName: Record<string, keyof typeof themeColors> = {};
      NOTE_COLOR_PRESETS.forEach((preset) => {
        colorHexToName[preset.value] = preset.name as keyof typeof themeColors;
      });

      // 获取颜色名称，默认为 yellow
      const colorName = colorHexToName[note.color] || "yellow";
      const backgroundColor = themeColors[colorName];

      // 应用透明度设置
      const opacity = noteSettings.noteOpacity || 1.0;

      return {
        backgroundColor,
        // 在暗黑主题下调整边框和文字颜色
        border: isDark ? `1px solid ${backgroundColor}` : "none",
        color: isDark ? "var(--color-text)" : "var(--color-text)",
        opacity: opacity,
      };
    };

    // 计算拖拽时的样式
    // dnd-kit 的 transform 是屏幕坐标偏移，但会被父容器的 scale 放大
    // 所以需要除以 scale 来抵消这个放大效果，保持拖动跟手
    const dragStyle = transform
      ? {
          transform: `translate3d(${transform.x / scale}px, ${
            transform.y / scale
          }px, 0)`,
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
            data-note-id={note.id}
            className={`${styles.noteCard} ${
              dndIsDragging ? styles.dragging : ""
            } ${isSelected ? styles.selected : ""} ${
              isResizing ? styles.resizing : ""
            } ${isEditing ? styles.editing : ""} ${
              aiGenerating[note.id] ? styles.aiGenerating : ""
            }`}
            data-theme={isDark ? "dark" : "light"}
            style={{
              width: resizeSize?.width ?? note.size.width,
              height: resizeSize?.height ?? note.size.height,
              position: "relative",
              ...getColorStyle(),
            }}
            onMouseEnter={() => {
              if (isEditing) return;
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              if (isEditing) return;
              setIsHovered(false);
            }}
          >
            {/* AI生成时隐藏选中边框 */}
            {isSelected && !aiGenerating[note.id] && (
              <div className={styles.selectionBorder} />
            )}

            {/* 
              便签头部区域 - 统一拖拽管理
              拖拽策略：
              1. 非编辑状态：整个便签可拖拽（通过主容器的listeners）
              2. 缩放状态：禁用所有拖拽
              3. 标题编辑状态：双击可编辑标题
            */}
            <div
              className={styles.noteHeader}
              // 在标题编辑模式下禁用拖拽，否则允许拖拽
              {...(!isResizing && !isEditingTitle ? listeners : {})}
              {...(!isResizing && !isEditingTitle ? attributes : {})}
              style={{
                cursor: !isResizing && !isEditingTitle ? "grab" : "default",
              }}
              onMouseDown={(e) => {
                // 在标题编辑模式下，不处理mousedown事件
                if (!isResizing && !isEditingTitle) {
                  handleMouseDown(e);
                }
              }}
              onDoubleClick={(e) => {
                // 如果点击的是标题区域，则允许双击标题编辑事件发生
                const target = e.target as HTMLElement;
                if (
                  target.tagName !== "H3" &&
                  !target.closest("h3") &&
                  !target.classList.contains("titleInput")
                ) {
                  e.stopPropagation();
                }
              }}
            >
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className={styles.titleInput}
                  autoFocus
                />
              ) : (
                <h3
                  className={styles.noteTitle}
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {note.title || "Untitled"}
                </h3>
              )}
            </div>

            {/* 思维链显示区域 - 基于数据存在性自动显示 */}
            {aiData?.thinkingChain && (
              <div
                className={styles.thinkingChainSection}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <AntdStepsThinkingChain
                  thinkingData={aiData.thinkingChain}
                  isCollapsed={!thinkingChainExpanded}
                  onToggle={() =>
                    handleThinkingChainToggle(!thinkingChainExpanded)
                  }
                  aiStatus={{
                    isStreaming: aiData.isStreaming,
                    generated: aiData.generated,
                    generationPhase: aiData.generationPhase,
                    isThinkingPhase: aiData.isThinkingPhase,
                    isAnsweringPhase: aiData.isAnsweringPhase,
                  }}
                />
              </div>
            )}

            {/* 便签内容区域 - 编辑器 */}
            <div
              className={`${styles.noteContent} ${
                hasVerticalScrollbar ? styles.hasScrollbar : styles.noScrollbar
              }`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <TiptapEditor
                content={
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
                readonly={!isEditing || aiGenerating[note.id]}
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                onEscape={handleEditorEscape}
                debounceDelay={300}
                enableAutoScroll={aiGenerating[note.id]}
                autoScrollBehavior="smooth"
              />
            </div>

            {/* 连接点组件 - 左下角 */}
            {!isEditing && (
              <ConnectionPoint
                noteId={note.id}
                isConnected={isNoteConnected(note.id)}
                onConnect={handleConnectionClick}
                isNoteHovered={isHovered && !isEditing}
              />
            )}

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

          {/* 便签工具栏 - 使用CSS定位在便签右侧，AI生成时隐藏 */}
          {showToolbar && isSelected && !aiGenerating[note.id] && (
            <div className={styles.noteToolbarWrapper}>
              <NoteToolbar
                noteId={note.id}
                visible={true}
                color={note.color}
                onAction={handleToolbarAction}
                onClose={handleCloseToolbar}
              />
            </div>
          )}
        </div>
      </>
    );
  }
);

NoteCard.displayName = "NoteCard";
