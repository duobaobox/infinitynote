/**
 * 便签位置计算工具函数
 */

import type { Note, Position, Size } from "../types";

/**
 * 检查两个矩形是否重叠
 */
function isRectOverlapping(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
  margin: number = 10
): boolean {
  return (
    rect1.x < rect2.x + rect2.width + margin &&
    rect1.x + rect1.width + margin > rect2.x &&
    rect1.y < rect2.y + rect2.height + margin &&
    rect1.y + rect1.height + margin > rect2.y
  );
}

/**
 * 获取不重叠的便签位置
 */
export function getNonOverlappingPosition(
  basePosition: Position,
  size: Size,
  existingNotes: Note[],
  maxAttempts: number = 20
): Position {
  let position = { ...basePosition };
  let attempts = 0;

  while (attempts < maxAttempts) {
    // 检查当前位置是否与现有便签重叠
    const isOverlapping = existingNotes.some(note => 
      isRectOverlapping(
        { x: position.x, y: position.y, width: size.width, height: size.height },
        { x: note.position.x, y: note.position.y, width: note.size.width, height: note.size.height }
      )
    );

    if (!isOverlapping) {
      return position;
    }

    // 如果重叠，尝试新的位置
    // 使用螺旋式偏移策略
    const offset = Math.floor(attempts / 4) + 1; // 每4次尝试增加偏移量
    const angle = (attempts % 4) * (Math.PI / 2); // 0, 90, 180, 270度
    const distance = offset * 30; // 每层偏移30px

    position = {
      x: basePosition.x + Math.cos(angle) * distance,
      y: basePosition.y + Math.sin(angle) * distance,
    };

    attempts++;
  }

  // 如果所有尝试都失败，使用随机偏移
  const randomOffset = Math.floor(Math.random() * 100) + 50;
  return {
    x: basePosition.x + randomOffset,
    y: basePosition.y + randomOffset,
  };
}

/**
 * 为新便签生成智能位置
 * 优先考虑视口中心，然后避免重叠
 */
export function generateSmartPosition(
  viewport: { offset: { x: number; y: number }; scale: number },
  windowSize: { width: number; height: number },
  size: Size,
  existingNotes: Note[]
): Position {
  // 计算视口中心在画布坐标系中的位置
  const viewportCenterX = (windowSize.width / 2 - viewport.offset.x) / viewport.scale;
  const viewportCenterY = (windowSize.height / 2 - viewport.offset.y) / viewport.scale;

  // 以视口中心为基础，偏移半个便签大小，使便签居中显示
  const basePosition: Position = {
    x: viewportCenterX - size.width / 2,
    y: viewportCenterY - size.height / 2,
  };

  // 获取不重叠的位置
  return getNonOverlappingPosition(basePosition, size, existingNotes);
}
