import React, { useState, useCallback, useEffect, useRef } from "react";
// 引入图标注册表
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
// 引入统一的动画配置
import { MODAL_METHOD_CONFIG } from "../../config/antdAnimations";
// 引入状态管理
import { useNoteStore } from "../../store/noteStore";
import {
  useCanvasStore,
  initializeDefaultCanvas,
} from "../../store/canvasStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useFocusModeStore } from "../../store/focusModeStore";
import { useHistoryStore } from "../../store/historyStore";
// 引入历史工具
import { HistoryHelper } from "../../utils/historyHelper";
// 引入主题
import { useTheme } from "../../theme";
import type { Position, Note } from "../../types";
import { NOTE_DEFAULT_SIZE } from "../../types/constants";
// 引入画布组件
import Canvas from "../Canvas";
// 引入工作台组件
import Workspace from "../Workspace";
// 引入便签工作台组件
import { NoteWorkbench } from "../../components/NoteWorkbench";
// 引入设置弹窗组件
import SettingsModal from "../../components/SettingsModal/index";
// 引入专注模式组件
import { FocusMode } from "../../components/FocusMode";
// 引入Ant Design组件
import {
  Layout, // 用于整体页面布局，包含Sider和Content
  Button, // 用于设置按钮、添加画布按钮和操作按钮组
  Input, // 用于便签列表的搜索框
  Segmented, // 用于视图模式切换（Daily/Weekly）
  Badge, // 用于显示便签数量的徽标
  Card, // 用于便签项的容器
  Space, // 用于操作按钮组的间距控制
  Splitter, // 用于分隔画布列表和便签列表区域
  App, // 用于提供Context
  Tooltip, // 提示信息
} from "antd";
import type { InputRef } from "antd";
// 引入CSS模块样式
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

// 解构Layout组件中的Sider和Content子组件
const { Sider, Content } = Layout;

// 侧边栏底部按钮（设置在左，同步在右并占满剩余空间）
type CloudConnectionState = "connected" | "disconnected" | "unknown";
const SidebarFooterButtons: React.FC<{ onOpenSettings: () => void }> = ({
  onOpenSettings,
}) => {
  const [cloudState, setCloudState] = useState<CloudConnectionState>("unknown");
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("infinitynote-webdav-last-status");
      if (raw) {
        const obj = JSON.parse(raw) as {
          state: CloudConnectionState;
          message?: string;
        };
        setCloudState(obj.state || "unknown");
      }
    } catch {}

    try {
      const last = localStorage.getItem("infinitynote-webdav-last-backup-time");
      if (last) setLastBackupAt(last);
    } catch {}

    const onStatus = (e: Event) => {
      const { state } = (e as CustomEvent).detail as {
        state: CloudConnectionState;
        message?: string;
      };
      setCloudState(state);
    };
    window.addEventListener("cloudSyncStatus", onStatus as EventListener);
    const onBackup = (e: Event) => {
      const { at } = (e as CustomEvent).detail as { at: string };
      setLastBackupAt(at);
    };
    window.addEventListener("cloudSyncBackup", onBackup as EventListener);
    return () => {
      window.removeEventListener("cloudSyncStatus", onStatus as EventListener);
      window.removeEventListener("cloudSyncBackup", onBackup as EventListener);
    };
  }, []);

  const stateText =
    cloudState === "connected"
      ? "已连接"
      : cloudState === "disconnected"
      ? "未连接"
      : "未检测";

  const formatTime = (iso?: string | null) => {
    if (!iso) return "无";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "无";
      return d.toLocaleString("zh-CN", { hour12: false });
    } catch {
      return "无";
    }
  };

  const tooltipNode = (
    <div style={{ lineHeight: 1.5 }}>
      <div>连接状态：{stateText}</div>
      <div>上次备份：{formatTime(lastBackupAt)}</div>
    </div>
  );

  return (
    <div className={styles.sidebarFooter}>
      <div style={{ display: "flex", width: "100%", gap: 8 }}>
        {/* 左侧：设置按钮（占满剩余空间） */}
        <Button
          type="text"
          icon={<DynamicIcon type="SettingOutlined" />}
          size="small"
          className={styles.settingsButton}
          onClick={onOpenSettings}
          style={{ flex: 1 }}
        >
          设置
        </Button>
        {/* 右侧：同步按钮（仅图标） */}
        <Tooltip title={tooltipNode} placement="topRight">
          <Button
            type="text"
            icon={<DynamicIcon type="CloudOutlined" />}
            size="small"
            className={styles.settingsButton}
            onClick={() => {
              onOpenSettings();
              window.dispatchEvent(
                new CustomEvent("openSettings", { detail: { tab: "cloud" } })
              );
            }}
            style={{
              width: 32,
              minWidth: 32,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* icon-only */}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

// 日志去重机制
const loggedMessages = new Set<string>();
const logWithDedup = (message: string, ...args: any[]) => {
  const key = `${message}_${JSON.stringify(args)}`;
  if (!loggedMessages.has(key)) {
    loggedMessages.add(key);
    console.log(message, ...args);
    // 5秒后清除记录，允许重新打印
    setTimeout(() => loggedMessages.delete(key), 5000);
  }
};

/**
 * 主页面组件
 * 这是应用的主页面，包含侧边栏和主内容区域
 *
 * 页面结构：
 * - 左侧边栏（固定宽度200px）
 *   - 顶部设置区域
 *   - 分段控制器
 *   - 添加画布按钮
 *   - 画布列表区域
 *   - 便签列表区域
 * - 右侧主内容区域（自适应宽度）
 */
const Main: React.FC = () => {
  // 侧边栏便签搜索关键字
  const [noteSearchKeyword, setNoteSearchKeyword] = useState("");

  // 视图模式状态：canvas（画布）或 workspace（工作台）
  const [viewMode, setViewMode] = useState<"canvas" | "workspace">("canvas");

  // 控制侧边栏折叠状态
  // 初始化时从 localStorage 读取侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem("sidebarCollapsed") === null
      ? true
      : localStorage.getItem("sidebarCollapsed") === "true"
  );

  // 包装 setCollapsed，持久化到 localStorage
  const handleSetCollapsed = (nextValue: boolean) => {
    setCollapsed(nextValue);
    localStorage.setItem("sidebarCollapsed", String(nextValue));
  };
  // 控制设置弹窗状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 控制初始化状态，防止重复初始化
  const [isInitialized, setIsInitialized] = useState(false);
  // 控制画布拖动模式状态
  const [isDragMode, setIsDragMode] = useState(false);
  // 当前正在生成的便签ID
  const [currentGeneratingNoteId, setCurrentGeneratingNoteId] = useState<
    string | undefined
  >(undefined);

  // 专注模式状态
  const {
    isVisible: focusModeVisible,
    activeNoteId: focusActiveNoteId,
    closeFocusMode,
    setActiveNote: setFocusActiveNote,
  } = useFocusModeStore();

  // 获取App Context中的modal和notification实例
  const { modal, notification, message: messageApi } = App.useApp();

  // 初始化通知服务，让非 React 组件也能使用通知功能
  useEffect(() => {
    const setupNotificationService = async () => {
      // 设置 ErrorNotification
      const { errorNotification } = await import(
        "../../components/ErrorNotification"
      );
      errorNotification.setNotificationApi(notification);

      // 设置全局通知服务（供 Zustand store 使用）
      const { notificationService } = await import(
        "../../services/notificationService"
      );
      notificationService.initialize({
        notification,
        message: messageApi,
        modal,
      });
    };
    setupNotificationService();
  }, [notification, messageApi, modal]);
  // 状态管理
  const {
    notes,
    createNote,
    getNotesByCanvas,
    initialize,
    selectNote,
    createAINoteFromPrompt,
    startAIGeneration,
    cancelAIGeneration,
    aiGenerating,
  } = useNoteStore();
  const {
    activeCanvasId,
    viewport,
    canvases,
    setActiveCanvas,
    createCanvas,
    deleteCanvas,
    updateCanvas,
    focusToNote,
  } = useCanvasStore();

  // 历史记录状态
  const { canUndo, canRedo } = useHistoryStore();

  // 连接状态管理
  const { connectedNotes } = useConnectionStore();

  // 主题状态
  const { isDark } = useTheme();

  // 初始化应用数据
  useEffect(() => {
    const initializeApp = async () => {
      if (isInitialized) {
        logWithDedup("🔄 应用已初始化，跳过重复初始化");
        return; // 防止重复初始化
      }

      try {
        setIsInitialized(true);

        // 检查是否为数据清除后的初始化
        const isDataClearing = sessionStorage.getItem("isDataClearing");
        if (isDataClearing) {
          logWithDedup("🎉 检测到数据清除标记，开始全新初始化");
        }

        // 先初始化画布（画布数据需要先加载，便签依赖画布ID）
        await initializeDefaultCanvas();

        // 再初始化便签数据（从数据库加载）
        await initialize();

        logWithDedup("🎉 应用启动完成");
      } catch (error) {
        console.error("❌ 应用初始化失败:", error);
        // 初始化失败时重置状态，允许重试
        setIsInitialized(false);
      }
    };

    initializeApp();
  }, [initialize, isInitialized, setIsInitialized]);

  // 键盘快捷键处理 - 使用新的统一键盘事件管理器
  useEffect(() => {
    const keyboardManager = (window as any).globalKeyboardManager;

    if (!keyboardManager) {
      console.warn("全局键盘事件管理器未初始化，使用旧版本处理");

      // 保留原有逻辑作为后备
      const handleKeyDown = (e: KeyboardEvent) => {
        // 如果焦点在输入框或编辑器中，不处理快捷键
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.isContentEditable ||
          target.closest("[contenteditable='true']") ||
          target.closest(".tiptap") ||
          target.closest(".tiptap-editor-content")
        ) {
          return;
        }

        switch (e.key) {
          case "d":
          case "D":
            // D键切换拖动模式
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              setIsDragMode(!isDragMode);
            }
            break;
          case "Escape":
            // ESC键退出拖动模式
            if (isDragMode) {
              e.preventDefault();
              setIsDragMode(false);
            }
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }

    // 使用新的键盘事件管理器
    const handlers = [
      {
        key: "main-drag-toggle",
        priority: 85,
        handler: (e: KeyboardEvent) => {
          if (
            (e.key === "d" || e.key === "D") &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            e.preventDefault();
            setIsDragMode(!isDragMode);
            return true;
          }
          return false;
        },
        context: "global" as const,
      },
      {
        key: "main-drag-exit",
        priority: 85,
        handler: (e: KeyboardEvent) => {
          if (e.key === "Escape" && isDragMode) {
            e.preventDefault();
            setIsDragMode(false);
            return true;
          }
          return false;
        },
        context: "global" as const,
      },
    ];

    // 注册所有处理器
    handlers.forEach((handler) => {
      keyboardManager.registerHandler(handler.key, handler);
    });

    // 清理函数
    return () => {
      handlers.forEach((handler) => {
        keyboardManager.unregisterHandler(handler.key);
      });
    };
  }, [isDragMode, setIsDragMode]);
  // 创建新便签
  const handleCreateNote = useCallback(
    async (position?: Position) => {
      if (!activeCanvasId) return;

      try {
        let canvasPosition: Position;

        if (position) {
          // 如果指定了位置，直接使用
          canvasPosition = position;
        } else {
          // 使用智能位置计算，避免重叠
          const { generateSmartPosition } = await import(
            "../../utils/notePositioning"
          );
          const currentCanvasNotes = notes.filter(
            (note: Note) => note.canvasId === activeCanvasId
          );

          canvasPosition = generateSmartPosition(
            viewport,
            { width: window.innerWidth, height: window.innerHeight },
            NOTE_DEFAULT_SIZE, // 使用配置的默认便签尺寸 (270x240像素)
            currentCanvasNotes
          );
        }

        await createNote(activeCanvasId, canvasPosition);
        console.log("✅ 便签创建成功");
      } catch (error) {
        console.error("❌ 创建便签失败:", error);
        // 可以在这里添加用户提示
      }
    },
    [activeCanvasId, viewport, createNote, notes]
  );

  // 获取当前画布的便签数量
  const getCurrentCanvasNoteCount = (canvasId: string) => {
    return getNotesByCanvas(canvasId).length;
  };

  // 处理画布切换
  const handleCanvasSwitch = useCallback(
    (canvasId: string) => {
      if (canvasId !== activeCanvasId) {
        setActiveCanvas(canvasId);
        logWithDedup(`🎨 切换到画布: ${canvasId.slice(-8)}`);
      }
    },
    [activeCanvasId, setActiveCanvas]
  );

  // 处理添加画布
  const handleAddCanvas = useCallback(async () => {
    try {
      const canvasName = `画布 ${canvases.length + 1}`;
      const newCanvasId = await createCanvas(canvasName, false);

      // 创建成功后自动切换到新画布
      setActiveCanvas(newCanvasId);

      logWithDedup(
        `🎨 创建新画布: ${newCanvasId.slice(-8)} (${canvasName})，已自动切换`
      );

      // 可选：显示成功提示（如果需要的话）
      // modal.success({
      //   title: '画布创建成功',
      //   content: `已创建并切换到 "${canvasName}"，您可以开始添加便签了！`,
      //   duration: 2,
      // });
    } catch (error) {
      console.error("❌ 创建画布失败:", error);

      // 显示错误提示
      modal.error({
        ...MODAL_METHOD_CONFIG,
        title: "创建画布失败",
        content: error instanceof Error ? error.message : "未知错误",
      });
    }
  }, [canvases.length, createCanvas, setActiveCanvas, modal]);

  // 处理拖动模式切换
  const handleToggleDragMode = useCallback((enabled: boolean) => {
    setIsDragMode(enabled);
  }, []);

  // 监听 ZoomIndicator 的拖动模式切换事件
  useEffect(() => {
    const handleToggleDragModeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      handleToggleDragMode(customEvent.detail.enabled);
    };

    window.addEventListener("toggleDragMode", handleToggleDragModeEvent);

    return () => {
      window.removeEventListener("toggleDragMode", handleToggleDragModeEvent);
    };
  }, [handleToggleDragMode]);

  // 监听打开设置页面事件
  useEffect(() => {
    const handleOpenSettingsEvent = () => {
      setSettingsOpen(true);
      // CanvasToolbar 触发时会指定打开 model tab
      // SettingsModal 会处理这个逻辑
    };

    window.addEventListener("openSettings", handleOpenSettingsEvent);

    return () => {
      window.removeEventListener("openSettings", handleOpenSettingsEvent);
    };
  }, []);

  // 处理整理便签（已移至 ZoomIndicator，但保留函数以防需要）
  // const handleOrganizeNotes = useCallback(async () => {
  //   if (!activeCanvasId) {
  //     message.warning("没有活动画布");
  //     return;
  //   }
  //
  //   const canvasNotes = getNotesByCanvas(activeCanvasId);
  //
  //   if (canvasNotes.length === 0) {
  //     message.info("当前画布没有便签");
  //     return;
  //   }
  //
  //   if (canvasNotes.length === 1) {
  //     message.info("只有一个便签，无需整理");
  //     return;
  //   }
  //
  //   try {
  //     const hideLoading = message.loading("正在整理便签...", 0);
  //     await organizeCurrentCanvasNotes(activeCanvasId);
  //     hideLoading();
  //     message.success(`✅ 已整理 ${canvasNotes.length} 个便签`);
  //   } catch (error) {
  //     console.error("整理便签失败:", error);
  //     message.error(
  //       `整理失败: ${error instanceof Error ? error.message : "未知错误"}`
  //     );
  //   }
  // }, [activeCanvasId, getNotesByCanvas, organizeCurrentCanvasNotes]);

  // 画布名称编辑状态
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editingCanvasName, setEditingCanvasName] = useState<string>("");
  const canvasNameInputRef = useRef<InputRef>(null);

  // 开始编辑画布名称
  const handleCanvasNameDoubleClick = useCallback(
    (e: React.MouseEvent, canvas: (typeof canvases)[0]) => {
      e.stopPropagation(); // 阻止触发画布切换
      setEditingCanvasId(canvas.id);
      setEditingCanvasName(canvas.name);
      // 延迟聚焦，确保 input 已渲染
      setTimeout(() => {
        canvasNameInputRef.current?.focus();
        canvasNameInputRef.current?.select();
      }, 0);
    },
    []
  );

  // 保存画布名称
  const handleCanvasNameSave = useCallback(
    async (canvasId: string) => {
      const newName = editingCanvasName.trim();
      if (!newName) {
        messageApi.warning("画布名称不能为空");
        return;
      }

      try {
        await updateCanvas(canvasId, { name: newName });
        messageApi.success("画布名称已更新");
        setEditingCanvasId(null);
      } catch (error) {
        console.error("❌ 更新画布名称失败:", error);
        messageApi.error("更新失败，请重试");
      }
    },
    [editingCanvasName, updateCanvas, messageApi]
  );

  // 取消编辑
  const handleCanvasNameCancel = useCallback(() => {
    setEditingCanvasId(null);
    setEditingCanvasName("");
  }, []);

  // 处理编辑输入框的键盘事件
  const handleCanvasNameKeyDown = useCallback(
    (e: React.KeyboardEvent, canvasId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCanvasNameSave(canvasId);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCanvasNameCancel();
      }
    },
    [handleCanvasNameSave, handleCanvasNameCancel]
  );

  // 处理便签点击 - 聚焦到画布中的便签并置顶
  const handleNoteClick = useCallback(
    async (note: Note) => {
      try {
        // 如果当前不在该便签所属的画布，先切换画布
        if (activeCanvasId !== note.canvasId) {
          setActiveCanvas(note.canvasId);
        }

        // 使用selectNote统一处理选中和置顶逻辑
        // 这样确保便签列表和画布点击行为一致
        selectNote(note.id, false);

        // 聚焦到便签位置
        focusToNote(note.position, note.size);

        console.log(`🎯 聚焦并立即置顶便签: ${note.title || "无标题"}`);
      } catch (error) {
        console.error("❌ 聚焦便签失败:", error);
      }
    },
    [activeCanvasId, setActiveCanvas, focusToNote, selectNote]
  );

  // 处理删除画布
  const handleDeleteCanvas = useCallback(
    async (canvasId: string, canvasName: string, isDefault: boolean) => {
      if (isDefault) {
        logWithDedup("⚠️ 默认画布不能删除");
        return;
      }

      // 获取该画布上的便签数量
      const canvasNoteCount = getCurrentCanvasNoteCount(canvasId);

      // 显示确认对话框
      modal.confirm({
        ...MODAL_METHOD_CONFIG,
        title: canvasNoteCount > 0 ? "确认删除画布及便签" : "确认删除画布",
        content: (
          <div style={{ lineHeight: "1.6" }}>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "8px 0" }}>
                <strong>画布名称：</strong>
                <span style={{ color: "#1890ff" }}>{canvasName}</span>
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>便签数量：</strong>
                <span
                  style={{ color: canvasNoteCount > 0 ? "#fa8c16" : "#52c41a" }}
                >
                  {canvasNoteCount} 个
                </span>
              </p>
            </div>

            {canvasNoteCount > 0 ? (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fff2f0",
                  border: "1px solid #ffccc7",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#ff4d4f",
                    margin: "0 0 8px 0",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ 重要警告
                </p>
                <p style={{ color: "#ff4d4f", margin: "0" }}>
                  删除画布将同时删除该画布上的所有{" "}
                  <strong>{canvasNoteCount}</strong> 个便签！
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#52c41a",
                    margin: "0",
                    fontWeight: 600,
                  }}
                >
                  ✅ 该画布为空，删除不会影响任何便签
                </p>
              </div>
            )}

            <p
              style={{
                color: "#8c8c8c",
                fontSize: "14px",
                margin: "0",
                fontStyle: "italic",
              }}
            >
              💡 此操作不可逆，删除后无法恢复，请谨慎操作。
            </p>
          </div>
        ),
        icon: <DynamicIcon type="ExclamationCircleOutlined" />,
        okText: "确认删除",
        okType: "danger",
        cancelText: "取消",
        centered: true,
        okButtonProps: {
          style: {
            backgroundColor: "#ff4d4f",
            borderColor: "#ff4d4f",
            color: "#ffffff",
            fontWeight: 500,
          },
        },
        onOk: async () => {
          try {
            await deleteCanvas(canvasId);
            logWithDedup(
              `🗑️ 删除画布: ${canvasId.slice(
                -8
              )} (${canvasName})，包含 ${canvasNoteCount} 个便签`
            );
          } catch (error) {
            console.error("❌ 删除画布失败:", error);
            // 可以在这里添加错误提示
            modal.error({
              ...MODAL_METHOD_CONFIG,
              title: "删除失败",
              content: `删除画布失败：${
                error instanceof Error ? error.message : "未知错误"
              }`,
            });
          }
        },
        onCancel: () => {
          logWithDedup(`📋 取消删除画布: ${canvasName}`);
        },
      });
    },
    [deleteCanvas, getCurrentCanvasNoteCount]
  );

  // 渲染画布列表（使用真实数据）
  const canvasItems = canvases.map((canvas) => (
    <div
      key={canvas.id}
      className={
        canvas.id === activeCanvasId
          ? styles.canvasItemActive
          : styles.canvasItem
      }
      onClick={() => handleCanvasSwitch(canvas.id)}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.canvasItemHeader}>
        {/* 文件夹图标 */}
        <DynamicIcon type="FolderOpenFilled" />
        {/* 画布项内容区域 */}
        <div className={styles.canvasItemContent}>
          {/* 标题行 */}
          <div className={styles.canvasItemTitleRow}>
            {editingCanvasId === canvas.id ? (
              // 编辑模式：显示输入框
              <Input
                ref={canvasNameInputRef}
                value={editingCanvasName}
                onChange={(e) => setEditingCanvasName(e.target.value)}
                onBlur={() => handleCanvasNameSave(canvas.id)}
                onKeyDown={(e) => handleCanvasNameKeyDown(e, canvas.id)}
                size="small"
                style={{
                  flex: 1,
                  fontSize: "14px",
                  lineHeight: "22px",
                  padding: "0 4px",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              // 显示模式：双击编辑
              <div
                className={styles.canvasTitle}
                onDoubleClick={(e) => handleCanvasNameDoubleClick(e, canvas)}
                title="双击编辑画布名称"
              >
                {canvas.name}
              </div>
            )}
            {/* 删除按钮或星标图标 */}
            {canvas.isDefault ? (
              // 默认画布显示星标（不可删除）
              <div className={styles.starIcon} title="默认画布">
                ★
              </div>
            ) : (
              // 非默认画布显示删除按钮
              <Button
                type="text"
                size="small"
                icon={<DynamicIcon type="DeleteOutlined" />}
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止冒泡到画布切换事件
                  handleDeleteCanvas(
                    canvas.id,
                    canvas.name,
                    canvas.isDefault || false
                  );
                }}
                title="删除画布"
              />
            )}
          </div>
          {/* 统计信息行 */}
          <div className={styles.canvasItemStatsRow}>
            <div className={styles.notesCount}>
              {getCurrentCanvasNoteCount(canvas.id)}便签
            </div>
            {/* 空白占位符，用于布局对齐 */}
            <div></div>
          </div>
        </div>
      </div>
    </div>
  ));

  // 获取当前画布的便签
  const currentCanvasNotes = activeCanvasId
    ? getNotesByCanvas(activeCanvasId)
    : [];

  // 侧边栏搜索过滤
  const filteredNotes = noteSearchKeyword.trim()
    ? currentCanvasNotes.filter(
        (note) =>
          note.title?.toLowerCase().includes(noteSearchKeyword.toLowerCase()) ||
          note.content?.toLowerCase().includes(noteSearchKeyword.toLowerCase())
      )
    : currentCanvasNotes;

  // 渲染便签列表（使用过滤后的数据）
  const noteItems = filteredNotes.map((note) => (
    <Card
      size="small"
      className={styles.noteItem}
      key={note.id}
      onClick={() => handleNoteClick(note)}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.noteItemContent}>
        {/* 便签颜色指示器 */}
        <div
          className={styles.noteColorIndicator}
          style={{ backgroundColor: note.color }}
        ></div>
        {/* 便签标题 */}
        <div className={styles.noteTitle}>{note.title || "无标题"}</div>
      </div>
    </Card>
  ));

  // 处理AI生成的函数，支持连接模式和普通模式
  const handleAddNote = useCallback(
    async (prompt?: string, _isConnectedMode: boolean = false) => {
      // 注意：_isConnectedMode 参数保留用于API兼容性，实际使用 latestConnectedNotes.length 判断
      if (!activeCanvasId) {
        console.error("❌ 没有活动画布");
        return;
      }

      try {
        // 【健壮性增强1】从 store 直接获取最新的连接便签状态
        const latestConnectedNotes =
          useConnectionStore.getState().connectedNotes;
        const actualIsConnectedMode = latestConnectedNotes.length > 0;

        console.log("📋 准备发送AI请求:", {
          prompt: prompt || "(空)",
          isConnectedMode: actualIsConnectedMode,
          connectedNotesCount: latestConnectedNotes.length,
        });

        if (actualIsConnectedMode && latestConnectedNotes.length > 0) {
          // 连接模式：汇总连接的便签内容
          console.log("🤖 连接模式 - 汇总便签内容");
          console.log("  📌 提示词:", prompt || "(空)");
          console.log("  📌 连接的便签数量:", latestConnectedNotes.length);
          console.log(
            "  📌 便签标题:",
            latestConnectedNotes.map((n) => n.title || "无标题").join(", ")
          );

          // 【健壮性增强2】在发送请求前重新获取最新的AI配置
          console.log("🔍 开始检查AI配置完整性...");
          const { aiService } = await import("../../services/aiService");

          // 强制重新加载配置，确保获取最新的模型设置
          const currentConfig = aiService.getActiveConfig();
          console.log("  🔧 当前使用的模型:", {
            provider: currentConfig.provider,
            model: currentConfig.model,
          });

          const configStatus = await aiService.isCurrentConfigurationReady();
          console.log("  ✅ AI配置检查结果:", configStatus);

          if (configStatus.status !== "ready") {
            console.log("❌ AI配置不完整，显示错误提醒...");

            // 根据不同的错误状态显示相应的错误信息
            let errorMessage = "🔑 AI功能需要配置";
            let errorDescription = configStatus.message || "请检查AI配置";

            if (configStatus.status === "unconfigured") {
              errorMessage = "🔑 API密钥未配置";
              errorDescription = "请先配置API密钥才能使用AI功能";
            } else if (configStatus.status === "error") {
              errorMessage = "⚙️ AI配置错误";
              errorDescription = "AI配置存在问题，请重新配置";
            }

            // 显示配置错误提醒
            notification.error({
              message: errorMessage,
              description: errorDescription,
              duration: 0, // 不自动关闭
              key: "ai-config-error", // 防止重复显示
              placement: "topRight",
              btn: (
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    notification.destroy("ai-config-error");
                  }}
                  style={{
                    background: "#1890ff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  打开设置
                </button>
              ),
            });
            console.log("✅ 错误提醒已显示");
            return; // 阻止便签创建
          }

          // 【健壮性增强3】构建AI提示词，使用最新的连接便签内容
          console.log("📝 构建AI提示词...");

          // 导入 HTML→Markdown 转换工具
          const { htmlToMarkdown } = await import("../../utils/htmlToMarkdown");

          const connectedNotesContent = latestConnectedNotes
            .map((note, index) => {
              // 调试日志
              console.log(`  📄 处理便签 ${index + 1}:`, {
                title: note.title,
                contentLength: note.content?.length || 0,
                contentPreview: note.content?.substring(0, 100) || "无内容",
              });

              // 转换 HTML 为干净的 Markdown
              const cleanContent = htmlToMarkdown(note.content || "");

              console.log(`  ✅ 转换结果:`, {
                markdownLength: cleanContent.length,
                markdownPreview: cleanContent.substring(0, 100),
              });

              return `便签${index + 1}: ${
                note.title || "无标题"
              }\n${cleanContent}\n---`;
            })
            .join("\n");

          const aiPrompt = `汇总便签内容进行处理（指令：${
            prompt || "汇总"
          }）：\n\n${connectedNotesContent}`;

          console.log("  📌 最终AI提示词长度:", aiPrompt.length);
          console.log("  📌 提示词预览:", aiPrompt.substring(0, 200) + "...");

          // 获取智能位置
          const { generateSmartPosition } = await import(
            "../../utils/notePositioning"
          );
          const currentCanvasNotes = notes.filter(
            (note: Note) => note.canvasId === activeCanvasId
          );

          const position = generateSmartPosition(
            viewport,
            { width: window.innerWidth, height: window.innerHeight },
            { width: 200, height: 150 },
            currentCanvasNotes
          );

          console.log("🎯 创建AI便签占位符，位置:", position);

          // 创建AI便签占位符
          const noteId = await createAINoteFromPrompt(
            activeCanvasId,
            aiPrompt,
            position
          );

          // 记录当前生成的便签ID
          setCurrentGeneratingNoteId(noteId);

          console.log("🚀 开始AI生成，便签ID:", noteId);
          console.log(
            "  📌 使用模型:",
            currentConfig.provider,
            "/",
            currentConfig.model
          );

          // 开始AI生成
          await startAIGeneration(noteId, aiPrompt);

          // 生成完成后清理状态
          setCurrentGeneratingNoteId(undefined);

          console.log("✅ 连接模式AI便签创建成功");
        } else {
          // 普通模式：根据提示词创建便签或创建空白便签
          if (prompt && prompt.trim()) {
            // 有提示词：使用AI生成便签
            console.log("🤖 普通模式 - AI生成便签");
            console.log("  📌 提示词:", prompt);

            // 【健壮性增强4】在发送请求前重新获取最新的AI配置
            console.log("🔍 开始检查AI配置完整性...");
            const { aiService } = await import("../../services/aiService");

            // 强制重新加载配置，确保获取最新的模型设置
            const currentConfig = aiService.getActiveConfig();
            console.log("  🔧 当前使用的模型:", {
              provider: currentConfig.provider,
              model: currentConfig.model,
            });

            const configStatus = await aiService.isCurrentConfigurationReady();
            console.log("  ✅ AI配置检查结果:", configStatus);

            if (configStatus.status !== "ready") {
              console.log("❌ AI配置不完整，显示错误提醒...");

              // 根据不同的错误状态显示相应的错误信息
              let errorMessage = "🔑 AI功能需要配置";
              let errorDescription = configStatus.message || "请检查AI配置";

              if (configStatus.status === "unconfigured") {
                errorMessage = "🔑 API密钥未配置";
                errorDescription = "请先配置API密钥才能使用AI功能";
              } else if (configStatus.status === "error") {
                errorMessage = "⚙️ AI配置错误";
                errorDescription = "AI配置存在问题，请重新配置";
              }

              // 显示配置错误提醒
              notification.error({
                message: errorMessage,
                description: errorDescription,
                duration: 0, // 不自动关闭
                key: "ai-config-error", // 防止重复显示
                placement: "topRight",
                btn: (
                  <button
                    onClick={() => {
                      setSettingsOpen(true);
                      notification.destroy("ai-config-error");
                    }}
                    style={{
                      background: "#1890ff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 12px",
                      cursor: "pointer",
                    }}
                  >
                    打开设置
                  </button>
                ),
              });
              console.log("✅ 错误提醒已显示");
              return; // 阻止便签创建
            }

            // 获取智能位置
            const { generateSmartPosition } = await import(
              "../../utils/notePositioning"
            );
            const currentCanvasNotes = notes.filter(
              (note: Note) => note.canvasId === activeCanvasId
            );

            const position = generateSmartPosition(
              viewport,
              { width: window.innerWidth, height: window.innerHeight },
              { width: 200, height: 150 },
              currentCanvasNotes
            );

            console.log("🎯 创建AI便签占位符，位置:", position);

            // 创建AI便签占位符
            const noteId = await createAINoteFromPrompt(
              activeCanvasId,
              prompt,
              position
            );

            // 记录当前生成的便签ID
            setCurrentGeneratingNoteId(noteId);

            console.log("🚀 开始AI生成，便签ID:", noteId);
            console.log(
              "  📌 使用模型:",
              currentConfig.provider,
              "/",
              currentConfig.model
            );

            // 开始AI生成
            await startAIGeneration(noteId, prompt);

            // 生成完成后清理状态
            setCurrentGeneratingNoteId(undefined);

            console.log("✅ AI便签创建成功");
          } else {
            // 无提示词：创建空白便签
            console.log("📝 创建空白便签");
            await handleCreateNote();
          }
        }
      } catch (error) {
        console.error("❌ 添加便签失败:", error);
        // 清理状态
        setCurrentGeneratingNoteId(undefined);

        // 显示通用错误提醒（API密钥错误已在前面处理）
        if (error instanceof Error) {
          notification.error({
            message: "❌ 操作失败",
            description: error.message || "操作失败，请重试",
            duration: 4, // 4秒后自动关闭
            placement: "topRight",
          });
        }
      }
    },
    [
      activeCanvasId,
      createAINoteFromPrompt,
      startAIGeneration,
      viewport,
      notes,
      notification,
      setSettingsOpen,
      handleCreateNote,
      setCurrentGeneratingNoteId,
    ]
  );

  return (
    // 主布局容器
    <div
      className={`${styles.container} ${
        isDark ? styles.darkTheme : styles.lightTheme
      }`}
    >
      {/* 侧边栏 - 固定宽度200px */}
      {!collapsed ? (
        <Sider
          width={200}
          theme={isDark ? "dark" : "light"}
          className={styles.sidebar}
        >
          {/* 侧边栏内容容器 - 使用flex布局 */}
          <div className={styles.sidebarContent}>
            {/* 侧边栏顶部操作区域 */}
            <div className={styles.sidebarHeader}>
              {/* 操作按钮组（折叠、刷新、撤销、重做） */}
              <Space size={4} className={styles.actionButtons}>
                <Button
                  type="text"
                  size="small"
                  icon={<DynamicIcon type="MenuFoldOutlined" />}
                  onClick={() => handleSetCollapsed(true)}
                ></Button>
                <Button
                  type="text"
                  size="small"
                  icon={<DynamicIcon type="RedoOutlined" />}
                  onClick={() => window.location.reload()}
                  title="刷新页面"
                ></Button>
                <Button
                  type="text"
                  size="small"
                  icon={<DynamicIcon type="LeftOutlined" />}
                  onClick={() => HistoryHelper.undo().catch(console.error)}
                  disabled={!canUndo}
                  title="撤销 (Ctrl+Z / ⌘Z)"
                ></Button>
                <Button
                  type="text"
                  size="small"
                  icon={<DynamicIcon type="RightOutlined" />}
                  onClick={() => HistoryHelper.redo().catch(console.error)}
                  disabled={!canRedo}
                  title="重做 (Ctrl+Y / ⌘⇧Z)"
                ></Button>
              </Space>
            </div>

            {/* 分段控制器 - 用于切换视图模式（画布/工作台） */}
            <div className={styles.segmentedWrapper}>
              <Segmented
                size="small"
                value={viewMode}
                onChange={(value) =>
                  setViewMode(value as "canvas" | "workspace")
                }
                options={[
                  { label: "画布", value: "canvas" },
                  { label: "工作台", value: "workspace" },
                ]}
                className={styles.segmentedControl}
                block
              />
            </div>

            {/* 添加画布按钮 */}
            <div className={styles.addButtonWrapper}>
              <Button
                type="text"
                icon={<DynamicIcon type="PlusOutlined" />}
                size="small"
                className={styles.addButton}
                onClick={handleAddCanvas}
              >
                添加画布
              </Button>
            </div>

            {/* 使用Splitter组件分隔画布列表和便签列表区域 */}
            <Splitter layout="vertical" className={styles.sidebarSplitter}>
              <Splitter.Panel defaultSize="30%" min="20%" max="80%">
                {/* 画布列表区域 */}
                <div className={styles.canvasListContainer}>{canvasItems}</div>
              </Splitter.Panel>

              <Splitter.Panel defaultSize="70%" min="20%">
                {/* 便签列表区域 */}
                <div className={styles.notesListContainer}>
                  {/* 便签列表头部 */}
                  <div className={styles.notesListHeader}>
                    {/* 标题行 */}
                    <div className={styles.notesListTitle}>
                      <div className={styles.notesListTitleText}>
                        {canvases.find((c) => c.id === activeCanvasId)?.name ||
                          "画布"}
                      </div>
                      {/* 徽标数字 - 显示便签数量 */}
                      <Badge
                        count={currentCanvasNotes.length}
                        style={{ backgroundColor: "var(--color-primary)" }}
                      />
                    </div>

                    {/* 搜索输入框 */}
                    <Input
                      placeholder="输入搜索内容"
                      prefix={<DynamicIcon type="SearchOutlined" />}
                      size="small"
                      className={styles.notesListSearch}
                      value={noteSearchKeyword}
                      onChange={(e) => setNoteSearchKeyword(e.target.value)}
                    />
                  </div>

                  {/* 便签列表内容区域 */}
                  <div className={styles.notesListContent}>{noteItems}</div>
                </div>
              </Splitter.Panel>
            </Splitter>

            {/* 侧边栏底部设置区域 */}
            <SidebarFooterButtons
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </Sider>
      ) : (
        // 折叠状态下的展开按钮
        <Button
          type="text"
          icon={<DynamicIcon type="MenuUnfoldOutlined" />}
          onClick={() => handleSetCollapsed(false)}
          className={styles.floatingCollapseButton}
        />
      )}

      {/* 画布区域 - 自适应宽度 */}
      <Content className={collapsed ? styles.canvasCollapsed : styles.canvas}>
        {/* 根据视图模式渲染不同的内容 */}
        {viewMode === "canvas" ? (
          <>
            {/* 画布内容区域 */}
            <Canvas isDragMode={isDragMode} />

            {/* 便签工作台 - 浮动在画布底部，包含画布工具栏 */}
            <NoteWorkbench
              aiGenerating={aiGenerating}
              currentGeneratingNoteId={currentGeneratingNoteId}
              connectedNotes={connectedNotes}
              onStopAI={() => {
                // 停止AI生成但保留已生成的内容
                if (currentGeneratingNoteId) {
                  cancelAIGeneration(currentGeneratingNoteId);
                  setCurrentGeneratingNoteId(undefined);
                }
              }}
              onAddNote={handleAddNote}
            />
          </>
        ) : (
          /* 工作台视图 */
          <Workspace />
        )}
      </Content>

      {/* 设置弹窗 */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* 专注模式 */}
      <FocusMode
        visible={focusModeVisible}
        activeNoteId={focusActiveNoteId}
        onClose={closeFocusMode}
        onNoteChange={setFocusActiveNote}
      />
    </div>
  );
};

export default Main;
