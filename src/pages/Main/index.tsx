import React, { useState, useCallback, useEffect } from "react";
// 引入图标注册表
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
// 引入状态管理
import { useNoteStore } from "../../store/noteStore";
import {
  useCanvasStore,
  initializeDefaultCanvas,
} from "../../store/canvasStore";
// 引入主题
import { useTheme } from "../../theme";
import { NoteColor } from "../../types";
import type { Position, Note } from "../../types";
// 引入画布组件
import Canvas from "../Canvas";
// 引入工具栏组件
import { CanvasToolbar } from "../../components/CanvasToolbar";
// 引入便签工作台组件
import { NoteWorkbench } from "../../components/NoteWorkbench";
// 引入设置弹窗组件
import SettingsModal from "../../components/SettingsModal/index";
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
} from "antd";
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
  // 控制侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false);
  // 控制设置弹窗状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 控制初始化状态，防止重复初始化
  const [isInitialized, setIsInitialized] = useState(false);
  // 控制画布拖动模式状态
  const [isDragMode, setIsDragMode] = useState(false);

  // 获取App Context中的modal实例
  const { modal } = App.useApp();
  // 状态管理
  const { notes, createNote, getNotesByCanvas, initialize, selectNote } =
    useNoteStore();
  const {
    activeCanvasId,
    viewport,
    canvases,
    setActiveCanvas,
    createCanvas,
    deleteCanvas,
    focusToNote,
  } = useCanvasStore();

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
        } else {          // 使用智能位置计算，避免重叠
          const { generateSmartPosition } = await import("../../utils/notePositioning");
          const currentCanvasNotes = notes.filter((note: Note) => note.canvasId === activeCanvasId);
          
          canvasPosition = generateSmartPosition(
            viewport,
            { width: window.innerWidth, height: window.innerHeight },
            { width: 200, height: 150 }, // 默认便签尺寸
            currentCanvasNotes
          );
        }

        await createNote(activeCanvasId, canvasPosition, NoteColor.YELLOW);
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
        title: "创建画布失败",
        content: error instanceof Error ? error.message : "未知错误",
      });
    }
  }, [canvases.length, createCanvas, setActiveCanvas, modal]);

  // 处理拖动模式切换
  const handleToggleDragMode = useCallback((enabled: boolean) => {
    setIsDragMode(enabled);
  }, []);

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
            <div className={styles.canvasTitle}>{canvas.name}</div>
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

  // 渲染便签列表（使用真实数据）
  const noteItems = currentCanvasNotes.map((note) => (
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
          {/* 侧边栏顶部设置区域 */}
          <div className={styles.sidebarHeader}>
            {/* 设置按钮 */}
            <Button
              type="text"
              icon={<DynamicIcon type="SettingOutlined" />}
              size="small"
              className={styles.settingsButton}
              onClick={() => setSettingsOpen(true)}
            >
              设置
            </Button>

            {/* 弹性间距，将两侧元素分开 */}
            <div style={{ flex: 1 }}></div>

            {/* 操作按钮组（折叠、刷新、撤销、撤回） */}
            <Space size={4} className={styles.actionButtons}>
              <Button
                type="text"
                size="small"
                icon={<DynamicIcon type="MenuFoldOutlined" />}
                onClick={() => setCollapsed(true)}
              ></Button>
              <Button
                type="text"
                size="small"
                icon={<DynamicIcon type="RedoOutlined" />}
              ></Button>
              <Button
                type="text"
                size="small"
                icon={<DynamicIcon type="LeftOutlined" />}
              ></Button>
              <Button
                type="text"
                size="small"
                icon={<DynamicIcon type="RightOutlined" />}
              ></Button>
            </Space>
          </div>

          {/* 分段控制器 - 用于切换视图模式（画布/工作台） */}
          <div className={styles.segmentedWrapper}>
            <Segmented
              size="small"
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
                    <Badge count={currentCanvasNotes.length} />
                  </div>

                  {/* 搜索输入框 */}
                  <Input
                    placeholder="输入搜索内容"
                    prefix={<DynamicIcon type="SearchOutlined" />}
                    size="small"
                    className={styles.notesListSearch}
                  />
                </div>

                {/* 便签列表内容区域 */}
                <div className={styles.notesListContent}>{noteItems}</div>
              </div>
            </Splitter.Panel>
          </Splitter>
        </Sider>
      ) : (
        // 折叠状态下的展开按钮
        <Button
          type="text"
          icon={<DynamicIcon type="MenuUnfoldOutlined" />}
          onClick={() => setCollapsed(false)}
          className={styles.floatingCollapseButton}
        />
      )}

      {/* 画布区域 - 自适应宽度 */}
      <Content className={collapsed ? styles.canvasCollapsed : styles.canvas}>
        {/* 画布内容区域 */}
        <Canvas isDragMode={isDragMode} />

        {/* 画布工具栏 */}
        <CanvasToolbar
          isDragMode={isDragMode}
          onToggleDragMode={handleToggleDragMode}
        />

        {/* 便签工作台 - 浮动在画布底部 */}
        <NoteWorkbench
          onAddNote={(prompt) => {
            // TODO: 实现AI生成便签或创建空白便签的逻辑
            console.log("添加便签:", prompt ? `AI生成: ${prompt}` : "空白便签");
            handleCreateNote();
          }}
        />
      </Content>

      {/* 设置弹窗 */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default Main;
