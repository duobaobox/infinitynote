/**
 * EnhancedTooltip - 增强版 Tooltip 组件
 *
 * 功能说明：
 * 提供统一的 Tooltip 样式和行为配置，确保在整个应用中的一致性
 * 解决主题切换时 Tooltip 显示问题
 *
 * 主要特性：
 * - 🎨 主题自适应：自动适配浅色/深色主题
 * - 📐 统一样式：确保 Tooltip 在所有场景下的显示效果一致
 * - ⚡ 性能优化：使用合理的延迟时间，提升交互体验
 * - 🔧 易于扩展：支持所有原生 Tooltip 属性
 *
 * @example
 * ```tsx
 * import { EnhancedTooltip } from '@/components/common/EnhancedTooltip';
 *
 * <EnhancedTooltip title="提示内容">
 *   <Button>悬停查看</Button>
 * </EnhancedTooltip>
 * ```
 */

import React from "react";
import { Tooltip } from "antd";
import type { TooltipProps as AntdTooltipProps } from "antd";
import { useTheme } from "../../../theme";

export interface EnhancedTooltipProps extends Omit<AntdTooltipProps, "title"> {
  /** Tooltip 显示的内容 */
  title?: React.ReactNode;
  /** 子元素 */
  children: React.ReactNode;
  /** 是否使用对比色方案（明亮主题用暗色，暗黑主题用亮色） */
  contrast?: boolean;
}

/**
 * 增强版 Tooltip 组件
 * 自动适配主题，确保显示效果清晰可见
 */
export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  title,
  contrast = true,
  placement = "top",
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  arrow = true,
  ...restProps
}) => {
  const { isDark } = useTheme();

  // 根据主题决定 Tooltip 的配置
  const tooltipConfig: Partial<AntdTooltipProps> = contrast
    ? {
        // 对比色方案：明亮主题用暗色背景，暗黑主题用亮色背景
        color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
        overlayInnerStyle: {
          color: isDark ? "#000000" : "#ffffff",
        },
      }
    : {};

  return (
    <Tooltip
      title={title}
      placement={placement}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      arrow={arrow}
      {...tooltipConfig}
      {...restProps}
    >
      {children}
    </Tooltip>
  );
};

export default EnhancedTooltip;
