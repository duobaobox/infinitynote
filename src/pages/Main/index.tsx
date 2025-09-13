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
import type { Position } from "../../types";
// 引入画布组件
import Canvas from "../Canvas";
// 引入工具栏组件
import { CanvasToolbar } from "../../components/CanvasToolbar";
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

  // 状态管理
  const { createNote, notes, getNotesByCanvas, initialize } = useNoteStore();
  const { activeCanvasId, viewport, canvases } = useCanvasStore();

  // 主题状态
  const { isDark } = useTheme();

  // 初始化应用数据
  useEffect(() => {
    let isInitialized = false;

    const initializeApp = async () => {
      if (isInitialized) return; // 防止重复初始化
      isInitialized = true;

      try {
        // 先初始化画布（画布数据需要先加载，便签依赖画布ID）
        await initializeDefaultCanvas();

        // 再初始化便签数据（从数据库加载）
        await initialize();

        logWithDedup("🎉 应用启动完成");
      } catch (error) {
        console.error("❌ 应用初始化失败:", error);
        // 即使初始化失败，也让应用继续运行
      }
    };

    initializeApp();
  }, [initialize]);

  // 创建新便签
  const handleCreateNote = useCallback(
    async (position?: Position) => {
      if (!activeCanvasId) return;

      try {
        // 计算在画布坐标系中的位置
        const canvasPosition = position || {
          x: (window.innerWidth / 2 - viewport.offset.x) / viewport.scale - 100,
          y: (window.innerHeight / 2 - viewport.offset.y) / viewport.scale - 75,
        };

        await createNote(activeCanvasId, canvasPosition, NoteColor.YELLOW);
        console.log("✅ 便签创建成功");
      } catch (error) {
        console.error("❌ 创建便签失败:", error);
        // 可以在这里添加用户提示
      }
    },
    [activeCanvasId, viewport, createNote]
  );

  // 获取当前画布的便签数量
  const getCurrentCanvasNoteCount = (canvasId: string) => {
    return getNotesByCanvas(canvasId).length;
  };

  // 渲染画布列表（使用真实数据）
  const canvasItems = canvases.map((canvas, index) => (
    <div
      key={canvas.id}
      className={
        canvas.id === activeCanvasId
          ? styles.canvasItemActive
          : styles.canvasItem
      }
    >
      <div className={styles.canvasItemHeader}>
        {/* 文件夹图标 */}
        <DynamicIcon type="FolderOpenFilled" />
        {/* 画布项内容区域 */}
        <div className={styles.canvasItemContent}>
          {/* 标题行 */}
          <div className={styles.canvasItemTitleRow}>
            <div className={styles.canvasTitle}>{canvas.name}</div>
            {/* 星标图标（仅默认画布） */}
            {canvas.isDefault && <div className={styles.starIcon}>★</div>}
            {/* 空白占位符（非默认画布） */}
            {!canvas.isDefault && <div></div>}
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
    <Card size="small" className={styles.noteItem} key={note.id}>
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
              disabled
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
        <Canvas />

        {/* 画布工具栏 */}
        <CanvasToolbar onCreateNote={handleCreateNote} />
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
