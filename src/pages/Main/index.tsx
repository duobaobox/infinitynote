import React from "react";
// 引入Ant Design图标组件
import {
  FolderOpenFilled,
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  RedoOutlined,
  UndoOutlined,
  RollbackOutlined
} from "@ant-design/icons";
// 引入Ant Design组件
import {
  Layout,
  Button,
  Input,
  Segmented,
  Badge,
  Card,
  Space,
  Splitter,
} from "antd";
// 引入CSS模块样式
import styles from "./index.module.css";

// 解构Layout组件中的Sider和Content子组件
const { Sider, Content } = Layout;

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
  // 生成画布列表假数据（5个画布）
  const canvasItems = Array.from({ length: 5 }, (_, index) => (
    <div
      key={index}
      className={index === 0 ? styles.canvasItemActive : styles.canvasItem}
    >
      <div className={styles.canvasItemHeader}>
        {/* 文件夹图标 */}
        <FolderOpenFilled
          style={{ fontSize: 24, color: "rgba(0, 0, 0, 0.45)" }}
        />
        {/* 画布项内容区域 */}
        <div className={styles.canvasItemContent}>
          {/* 标题行 */}
          <div className={styles.canvasItemTitleRow}>
            <div className={styles.canvasTitle}>
              {index === 0 ? "默认画布" : `画布${index + 1}`}
            </div>
            {/* 星标图标（仅默认画布） */}
            {index === 0 && <div className={styles.starIcon}>★</div>}
            {/* 空白占位符（非默认画布） */}
            {index !== 0 && <div></div>}
          </div>
          {/* 统计信息行 */}
          <div className={styles.canvasItemStatsRow}>
            <div className={styles.notesCount}>{index % 3}便签</div>
            {/* 空白占位符，用于布局对齐 */}
            <div></div>
          </div>
        </div>
      </div>
    </div>
  ));

  // 生成便签列表假数据（8个便签）
  const noteItems = Array.from({ length: 8 }, (_, index) => (
    <Card size="small" className={styles.noteItem} key={index}>
      <div className={styles.noteItemContent}>
        {/* 便签颜色指示器 */}
        <div className={styles.noteColorIndicator}></div>
        {/* 便签标题 */}
        <div className={styles.noteTitle}>
          {index === 0 ? "便签" : `便签${index + 1}`}
        </div>
      </div>
    </Card>
  ));

  return (
    // 主布局容器
    <div className={styles.container}>
      {/* 侧边栏 - 固定宽度200px */}
      <Sider width={200} theme="light" className={styles.sidebar}>
        {/* 侧边栏顶部设置区域 */}
        <div className={styles.sidebarHeader}>
          {/* 设置按钮 */}
          <Button
            type="text"
            icon={<SettingOutlined />}
            size="small"
            className={styles.settingsButton}
          >
            设置
          </Button>

          {/* 弹性间距，将两侧元素分开 */}
          <div style={{ flex: 1 }}></div>

          {/* 操作按钮组（折叠、刷新、撤销、撤回） */}
          <Space size={4} className={styles.actionButtons}>
            <Button type="text" size="small" icon={<MenuFoldOutlined />}></Button>
            <Button type="text" size="small" icon={<RedoOutlined />}></Button>
            <Button type="text" size="small" icon={<UndoOutlined />}></Button>
            <Button type="text" size="small" icon={<RollbackOutlined />}></Button>
          </Space>
        </div>

        {/* 分段控制器 - 用于切换视图模式（Daily/Weekly等） */}
        <div className={styles.segmentedWrapper}>
          <Segmented
            size="small"
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
            ]}
            className={styles.segmentedControl}
            block
          />
        </div>

        {/* 添加画布按钮 */}
        <div className={styles.addButtonWrapper}>
          <Button
            type="text"
            icon={<PlusOutlined />}
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
                  <div className={styles.notesListTitleText}>默认画布</div>
                  {/* 徽标数字 - 显示便签数量 */}
                  <Badge count={21} style={{ backgroundColor: "#1677ff" }} />
                </div>

                {/* 搜索输入框 */}
                <Input
                  placeholder="输入搜索内容"
                  prefix={<SearchOutlined />}
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

      {/* 画布区域 - 自适应宽度 */}
      <Content className={styles.canvas}>
        {/* 画布内容区域，暂时为空 */}
        {/* 这里将显示选中画布的内容 */}
      </Content>
    </div>
  );
};

export default Main;