import {
  MenuFoldOutlined,
  RedoOutlined,
  UndoOutlined,
  RightOutlined,
  FolderOpenFilled,
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';

// 创建图标注册表
export const iconRegistry = {
  MenuFoldOutlined,
  RedoOutlined,
  UndoOutlined,
  RightOutlined,
  FolderOpenFilled,
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled
};

// 导出图标类型
export type IconType = keyof typeof iconRegistry;