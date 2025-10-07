import React, { useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "../../store/connectionStore";

// 动态加载 leader-line
let LeaderLine: any = null;
let loadPromise: Promise<any> | null = null;

// 异步加载 leader-line
const loadLeaderLine = async () => {
  if (LeaderLine) return LeaderLine;

  // 避免重复加载
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    try {
      // 创建 script 标签动态加载
      const script = document.createElement("script");
      script.src = "./leader-line.min.js";
      script.onload = () => {
        LeaderLine = (window as any).LeaderLine;
        if (LeaderLine) {
          resolve(LeaderLine);
        } else {
          reject(new Error("LeaderLine not found on window object"));
        }
      };
      script.onerror = () => {
        reject(new Error("Failed to load leader-line script"));
      };
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return loadPromise;
};

// 类型定义
interface LeaderLineInstance {
  remove(): void;
  position(): void;
  setOptions(options: any): void;
}

interface LeaderLineVisualizerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Leader-Line 连接线可视化组件
 * 使用 Leader-Line 库替代手写的连接线实现
 *
 * 优势：
 * - 自动处理坐标计算和位置更新
 * - 丰富的样式和动画选项
 * - 性能优化和浏览器兼容性
 * - 大幅简化代码复杂度
 */
export const LeaderLineVisualizer: React.FC<LeaderLineVisualizerProps> = ({
  containerRef,
}) => {
  const { connectedNotes } = useConnectionStore();
  const linesRef = useRef<LeaderLineInstance[]>([]);
  const isMountedRef = useRef<boolean>(false); // 清理所有连接线
  const clearLines = useCallback(() => {
    linesRef.current.forEach((line) => {
      try {
        line.remove();
      } catch (error) {
        console.warn("清理连接线时出错:", error);
      }
    });
    linesRef.current = [];
  }, []);

  // 创建连接线
  const createLines = useCallback(async () => {
    if (!isMountedRef.current || connectedNotes.length === 0) {
      return;
    }

    // 动态加载 Leader-Line
    const LeaderLineClass = await loadLeaderLine();
    if (!LeaderLineClass) {
      console.error("LeaderLine 库加载失败");
      return;
    }

    // 先清理现有连接线
    clearLines();

    // 等待DOM更新后创建新连接线
    requestAnimationFrame(() => {
      connectedNotes.forEach((note, index) => {
        const startElement = document.querySelector(
          `[data-note-connection-point="${note.id}"]`
        ) as HTMLElement;

        const endElement = document.querySelector(
          `[data-slot-container] [data-index="${index + 1}"]`
        ) as HTMLElement;

        if (startElement && endElement) {
          try {
            const line = new LeaderLineClass(startElement, endElement, {
              // 基本样式
              color: "#52c41a", // 绿色主色调
              size: 3, // 线条粗细
              path: "fluid", // 流体路径（S形曲线效果）

              // 连接点设置
              startSocket: "auto", // 自动选择最佳起点
              endSocket: "auto", // 自动选择最佳终点

              // 端点样式
              startPlug: "behind", // 起点隐藏
              endPlug: "disc", // 终点圆点
              endPlugSize: 1.2, // 终点大小
              endPlugColor: "#52c41a", // 终点颜色

              // 轮廓效果
              outline: true, // 启用轮廓
              outlineColor: "rgba(82, 196, 26, 0.3)", // 轮廓颜色
              outlineSize: 0.5, // 轮廓大小

              // 动画效果
              dash: {
                animation: true, // 启用流动动画
                len: 8, // 虚线长度
                gap: 4, // 虚线间隔
              },

              // 阴影效果
              dropShadow: {
                dx: 0,
                dy: 2,
                blur: 6,
                color: "#52c41a",
                opacity: 0.2,
              },
            }) as LeaderLineInstance;

            linesRef.current.push(line);
          } catch (error) {
            console.error(`创建连接线失败 (${note.id}):`, error);
          }
        } else {
          console.warn(
            `找不到连接元素: start=${!!startElement}, end=${!!endElement}, noteId=${
              note.id
            }, slotIndex=${index + 1}`
          );
        }
      });
    });
  }, [connectedNotes, clearLines]);

  // 更新连接线位置
  const updateLines = useCallback(() => {
    linesRef.current.forEach((line) => {
      try {
        line.position();
      } catch (error) {
        console.warn("更新连接线位置时出错:", error);
      }
    });
  }, []);

  // 监听连接状态变化
  useEffect(() => {
    isMountedRef.current = true;

    if (connectedNotes.length > 0) {
      // 延迟创建，确保DOM已就绪
      const timer = setTimeout(() => createLines(), 100);
      return () => clearTimeout(timer);
    } else {
      // 没有连接时清理现有连接线
      clearLines();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [connectedNotes, createLines, clearLines]);

  // 监听窗口大小变化和滚动事件
  useEffect(() => {
    if (connectedNotes.length === 0) return;

    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(updateLines, 100);
    };

    const handleScroll = () => {
      updateLines();
    };

    // 监听窗口调整大小
    window.addEventListener("resize", handleResize);

    // 监听滚动事件
    window.addEventListener("scroll", handleScroll, true);

    // 监听便签位置变化（通过 MutationObserver）
    const observer = new MutationObserver((mutations) => {
      let needUpdate = false;
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "style" ||
            mutation.attributeName === "class")
        ) {
          const target = mutation.target as HTMLElement;
          if (
            target.hasAttribute("data-note-card") ||
            target.querySelector("[data-note-card]")
          ) {
            needUpdate = true;
          }
        }
      });

      if (needUpdate) {
        updateLines();
      }
    });

    // 观察便签容器的变化
    const noteContainer = containerRef.current;
    if (noteContainer) {
      observer.observe(noteContainer, {
        attributes: true,
        subtree: true,
        attributeFilter: ["style", "class"],
      });
    }

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      observer.disconnect();
    };
  }, [connectedNotes.length, updateLines, containerRef]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearLines();
    };
  }, [clearLines]);

  // 开发调试：暴露控制函数到全局
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugLeaderLineVisualizer = {
        lines: linesRef.current,
        connectedNotes,
        updateLines,
        createLines,
        clearLines,
        forceRecreate: () => {
          console.log("强制重新创建连接线...");
          createLines();
        },
      };
    }
  }, [connectedNotes, updateLines, createLines, clearLines]);

  // Leader-Line 直接操作DOM，不需要渲染任何React元素
  return null;
};

export default LeaderLineVisualizer;
