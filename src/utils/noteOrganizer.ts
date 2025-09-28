/**
 * 便签整理工具函数
 * 提供一键整理功能，将散乱的便签统一大小并整齐排列
 */

import type { Note, Position, Size, CanvasViewport } from "../types";
import { NOTE_DEFAULT_SIZE } from "../types";

/**
 * 整理配置接口
 */
export interface OrganizeConfig {
  /** 统一后的便签尺寸 */
  standardSize: Size;
  /** 网格水平间距 */
  gridSpacingX: number;
  /** 网格垂直间距 */
  gridSpacingY: number;
  /** 左边距 */
  marginX: number;
  /** 上边距 */
  marginY: number;
  /** 每行列数（0表示自动计算） */
  columns: number;
  /** 排序方式 */
  sortBy: 'creation' | 'title' | 'zIndex' | 'position';
}

/**
 * 默认整理配置
 */
export const DEFAULT_ORGANIZE_CONFIG: OrganizeConfig = {
  standardSize: NOTE_DEFAULT_SIZE, // 使用默认便签尺寸 270x240
  gridSpacingX: 20, // 水平间距20px
  gridSpacingY: 20, // 垂直间距20px
  marginX: 50, // 左边距50px
  marginY: 50, // 上边距50px
  columns: 0, // 自动计算列数
  sortBy: 'creation', // 按创建时间排序
};

/**
 * 便签整理结果接口
 */
export interface OrganizeResult {
  /** 需要更新的便签列表 */
  updates: Array<{
    id: string;
    position: Position;
    size: Size;
  }>;
  /** 整理后的网格信息 */
  gridInfo: {
    rows: number;
    columns: number;
    totalWidth: number;
    totalHeight: number;
  };
}

/**
 * 根据排序方式对便签进行排序
 */
function sortNotes(notes: Note[], sortBy: OrganizeConfig['sortBy']): Note[] {
  const sortedNotes = [...notes];
  
  switch (sortBy) {
    case 'creation':
      return sortedNotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    case 'title':
      return sortedNotes.sort((a, b) => {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB, 'zh-CN');
      });
    
    case 'zIndex':
      return sortedNotes.sort((a, b) => a.zIndex - b.zIndex);
    
    case 'position':
      // 按位置排序：先按Y坐标，再按X坐标
      return sortedNotes.sort((a, b) => {
        const yDiff = a.position.y - b.position.y;
        if (Math.abs(yDiff) > 50) { // 如果Y坐标差距大于50px，按Y排序
          return yDiff;
        }
        return a.position.x - b.position.x; // 否则按X排序
      });
    
    default:
      return sortedNotes;
  }
}

/**
 * 计算最优列数
 * 根据视口大小和便签尺寸自动计算合适的列数
 */
function calculateOptimalColumns(
  noteCount: number,
  viewport: CanvasViewport,
  windowSize: { width: number; height: number },
  config: OrganizeConfig
): number {
  if (config.columns > 0) {
    return config.columns; // 如果指定了列数，直接使用
  }

  // 计算视口可见区域的尺寸（画布坐标系）
  const visibleWidth = windowSize.width / viewport.scale;
  // const visibleHeight = windowSize.height / viewport.scale; // 暂时不需要，但保留以备后用

  // 计算可用宽度（减去边距）
  const availableWidth = visibleWidth - config.marginX * 2;
  
  // 计算单个便签占用的宽度（包括间距）
  const noteWidthWithSpacing = config.standardSize.width + config.gridSpacingX;
  
  // 计算最大可容纳的列数
  const maxColumns = Math.floor((availableWidth + config.gridSpacingX) / noteWidthWithSpacing);
  
  // 根据便签数量调整列数
  const optimalColumns = Math.min(
    maxColumns,
    Math.max(1, Math.ceil(Math.sqrt(noteCount * 1.2))) // 稍微偏向横向布局
  );

  return Math.max(1, optimalColumns);
}

/**
 * 计算网格布局的起始位置
 * 将整个网格在视口中居中显示
 */
function calculateGridStartPosition(
  viewport: CanvasViewport,
  windowSize: { width: number; height: number },
  gridInfo: { columns: number; rows: number; totalWidth: number; totalHeight: number }
): Position {
  // 计算视口中心在画布坐标系中的位置
  const viewportCenterX = (windowSize.width / 2 - viewport.offset.x) / viewport.scale;
  const viewportCenterY = (windowSize.height / 2 - viewport.offset.y) / viewport.scale;

  // 将网格中心对齐到视口中心
  const startX = viewportCenterX - gridInfo.totalWidth / 2;
  const startY = viewportCenterY - gridInfo.totalHeight / 2;

  return { x: startX, y: startY };
}

/**
 * 整理便签布局
 * 将便签统一大小并按网格排列
 */
export function organizeNotes(
  notes: Note[],
  viewport: CanvasViewport,
  windowSize: { width: number; height: number },
  config: Partial<OrganizeConfig> = {}
): OrganizeResult {
  // 合并配置
  const finalConfig: OrganizeConfig = { ...DEFAULT_ORGANIZE_CONFIG, ...config };
  
  // 如果没有便签，返回空结果
  if (notes.length === 0) {
    return {
      updates: [],
      gridInfo: { rows: 0, columns: 0, totalWidth: 0, totalHeight: 0 }
    };
  }

  // 对便签进行排序
  const sortedNotes = sortNotes(notes, finalConfig.sortBy);

  // 计算最优列数
  const columns = calculateOptimalColumns(notes.length, viewport, windowSize, finalConfig);
  const rows = Math.ceil(notes.length / columns);

  // 计算网格总尺寸
  const totalWidth = columns * finalConfig.standardSize.width + (columns - 1) * finalConfig.gridSpacingX;
  const totalHeight = rows * finalConfig.standardSize.height + (rows - 1) * finalConfig.gridSpacingY;

  const gridInfo = { rows, columns, totalWidth, totalHeight };

  // 计算网格起始位置（居中显示）
  const startPosition = calculateGridStartPosition(viewport, windowSize, gridInfo);

  // 生成便签更新列表
  const updates = sortedNotes.map((note, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    const position: Position = {
      x: startPosition.x + col * (finalConfig.standardSize.width + finalConfig.gridSpacingX),
      y: startPosition.y + row * (finalConfig.standardSize.height + finalConfig.gridSpacingY),
    };

    return {
      id: note.id,
      position,
      size: finalConfig.standardSize,
    };
  });

  return { updates, gridInfo };
}

/**
 * 检查便签是否需要整理
 * 判断当前便签布局是否已经是整齐的网格状态
 */
export function needsOrganization(
  notes: Note[],
  tolerance: number = 10
): boolean {
  if (notes.length <= 1) {
    return false; // 单个或无便签不需要整理
  }

  // 检查尺寸是否统一
  const firstSize = notes[0].size;
  const hasUniformSize = notes.every(note => 
    Math.abs(note.size.width - firstSize.width) <= tolerance &&
    Math.abs(note.size.height - firstSize.height) <= tolerance
  );

  if (!hasUniformSize) {
    return true; // 尺寸不统一，需要整理
  }

  // 检查是否按网格排列
  const sortedByPosition = [...notes].sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > tolerance) {
      return yDiff;
    }
    return a.position.x - b.position.x;
  });

  // 检查行列对齐
  let currentRowY = sortedByPosition[0].position.y;
  let rowStartIndex = 0;
  
  for (let i = 1; i < sortedByPosition.length; i++) {
    const note = sortedByPosition[i];
    // const prevNote = sortedByPosition[i - 1]; // 暂时不需要，但保留以备后用
    
    // 如果Y坐标差距较大，说明是新的一行
    if (Math.abs(note.position.y - currentRowY) > tolerance) {
      // 检查上一行的X坐标间距是否均匀
      for (let j = rowStartIndex + 1; j < i; j++) {
        const spacing = sortedByPosition[j].position.x - sortedByPosition[j - 1].position.x;
        const expectedSpacing = firstSize.width + 20; // 假设间距为20px
        if (Math.abs(spacing - expectedSpacing) > tolerance) {
          return true; // 间距不均匀，需要整理
        }
      }
      
      currentRowY = note.position.y;
      rowStartIndex = i;
    }
  }

  return false; // 已经是整齐的网格布局
}

/**
 * 预览整理效果
 * 返回整理后的布局信息，但不实际执行
 */
export function previewOrganization(
  notes: Note[],
  viewport: CanvasViewport,
  windowSize: { width: number; height: number },
  config: Partial<OrganizeConfig> = {}
): {
  result: OrganizeResult;
  summary: {
    noteCount: number;
    gridSize: string;
    standardSize: string;
    sortMethod: string;
  };
} {
  const finalConfig: OrganizeConfig = { ...DEFAULT_ORGANIZE_CONFIG, ...config };
  const result = organizeNotes(notes, viewport, windowSize, finalConfig);
  
  const summary = {
    noteCount: notes.length,
    gridSize: `${result.gridInfo.columns} × ${result.gridInfo.rows}`,
    standardSize: `${finalConfig.standardSize.width} × ${finalConfig.standardSize.height}`,
    sortMethod: finalConfig.sortBy,
  };

  return { result, summary };
}