import type { Size } from "./index";

/**
 * 便签默认尺寸
 */
export const NOTE_DEFAULT_SIZE: Size = {
  width: 200,
  height: 150,
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
