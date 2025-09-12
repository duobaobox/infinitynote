// 明确导入需要的图标，避免类型问题
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
  StarFilled,
  LeftOutlined
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
  StarFilled,
  LeftOutlined
};

// 导出图标类型
export type IconType = keyof typeof iconRegistry;