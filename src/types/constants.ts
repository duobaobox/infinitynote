import type { Size } from "./index";

/**
 * 便签默认尺寸
 * 宽度: 270像素 - 便签的默认宽度，适合显示中等长度的文本内容
 * 高度: 240像素 - 便签的默认高度，提供足够的垂直空间用于多行文本
 */
export const NOTE_DEFAULT_SIZE: Size = {
  width: 270,
  height: 240,
};

/**
 * 便签最小尺寸
 */
export const NOTE_MIN_SIZE: Size = {
  width: 120,
  height: 80,
};

/**
 * 便签最大尺寸 (无限制)
 */
export const NOTE_MAX_SIZE: Size = {
  width: Infinity,
  height: Infinity,
};
