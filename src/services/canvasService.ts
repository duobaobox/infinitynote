import type { Canvas, Position } from "../types";
import { STORAGE_KEYS, CANVAS_CONFIG } from "../constants";

// 默认背景色 - 使用白色作为默认值，主题切换会在CSS层面处理
const DEFAULT_BG_COLOR = "#ffffff";

export class CanvasService {
  // 获取所有画布
  static getCanvases(): Canvas[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CANVAS_STATE);
      if (stored) {
        const canvases = JSON.parse(stored);
        return canvases.map((canvas: any) => ({
          ...canvas,
          createdAt: new Date(canvas.createdAt),
          updatedAt: new Date(canvas.updatedAt),
        }));
      }
    } catch (error) {
      console.error("获取画布列表失败:", error);
    }

    // 返回默认画布
    return [this.createDefaultCanvas()];
  }

  // 创建默认画布
  static createDefaultCanvas(): Canvas {
    return {
      id: "default",
      name: "默认画布",
      scale: CANVAS_CONFIG.DEFAULT_SCALE,
      offset: { x: 0, y: 0 },
      backgroundColor: DEFAULT_BG_COLOR,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: true,
    };
  }

  // 保存画布列表
  static saveCanvases(canvases: Canvas[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CANVAS_STATE, JSON.stringify(canvases));
    } catch (error) {
      console.error("保存画布列表失败:", error);
    }
  }

  // 创建新画布
  static createCanvas(name: string): Canvas {
    const newCanvas: Canvas = {
      id: Date.now().toString(),
      name,
      scale: CANVAS_CONFIG.DEFAULT_SCALE,
      offset: { x: 0, y: 0 },
      backgroundColor: DEFAULT_BG_COLOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const canvases = this.getCanvases();
    canvases.push(newCanvas);
    this.saveCanvases(canvases);

    return newCanvas;
  }

  // 更新画布
  static updateCanvas(
    id: string,
    changes: Partial<Omit<Canvas, "id" | "createdAt">>
  ): void {
    const canvases = this.getCanvases();
    const canvasIndex = canvases.findIndex((canvas) => canvas.id === id);

    if (canvasIndex >= 0) {
      canvases[canvasIndex] = {
        ...canvases[canvasIndex],
        ...changes,
        updatedAt: new Date(),
      };
      this.saveCanvases(canvases);
    }
  }

  // 删除画布
  static deleteCanvas(id: string): void {
    if (id === "default") {
      throw new Error("不能删除默认画布");
    }

    const canvases = this.getCanvases();
    const filteredCanvases = canvases.filter((canvas) => canvas.id !== id);
    this.saveCanvases(filteredCanvases);
  }

  // 获取单个画布
  static getCanvas(id: string): Canvas | null {
    const canvases = this.getCanvases();
    return canvases.find((canvas) => canvas.id === id) || null;
  }

  // 重置画布视图
  static resetCanvasView(id: string): void {
    this.updateCanvas(id, {
      scale: CANVAS_CONFIG.DEFAULT_SCALE,
      offset: { x: 0, y: 0 },
    });
  }

  // 缩放画布
  static zoomCanvas(id: string, scale: number, _center?: Position): void {
    const clampedScale = Math.max(
      CANVAS_CONFIG.MIN_SCALE,
      Math.min(CANVAS_CONFIG.MAX_SCALE, scale)
    );

    this.updateCanvas(id, { scale: clampedScale });
  }

  // 平移画布
  static panCanvas(id: string, deltaX: number, deltaY: number): void {
    const canvas = this.getCanvas(id);
    if (canvas) {
      this.updateCanvas(id, {
        offset: {
          x: canvas.offset.x + deltaX,
          y: canvas.offset.y + deltaY,
        },
      });
    }
  }

  // 获取画布边界
  static getCanvasBounds(_id: string): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    // 这里可以根据便签位置计算画布的实际使用边界
    // 暂时返回默认值
    return {
      minX: -1000,
      minY: -1000,
      maxX: 1000,
      maxY: 1000,
    };
  }

  // 适应画布内容
  static fitToContent(
    id: string,
    notes: Array<{
      position: Position;
      size: { width: number; height: number };
    }>
  ): void {
    if (notes.length === 0) {
      this.resetCanvasView(id);
      return;
    }

    // 计算所有便签的边界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    notes.forEach((note) => {
      minX = Math.min(minX, note.position.x);
      minY = Math.min(minY, note.position.y);
      maxX = Math.max(maxX, note.position.x + note.size.width);
      maxY = Math.max(maxY, note.position.y + note.size.height);
    });

    // 计算中心点和合适的缩放比例
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // 假设视口大小
    const viewportWidth = window.innerWidth * 0.8;
    const viewportHeight = window.innerHeight * 0.8;

    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, CANVAS_CONFIG.MAX_SCALE) * 0.9; // 留些边距

    this.updateCanvas(id, {
      scale: Math.max(scale, CANVAS_CONFIG.MIN_SCALE),
      offset: {
        x: -centerX * scale + viewportWidth / 2,
        y: -centerY * scale + viewportHeight / 2,
      },
    });
  }
}
