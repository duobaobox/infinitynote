import * as AntdIcons from '@ant-design/icons';

// 创建图标注册表
export const iconRegistry = {
  ...AntdIcons,
  // 可以添加自定义图标
};

// 导出图标类型
export type IconType = keyof typeof iconRegistry;