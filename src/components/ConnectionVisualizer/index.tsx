import React, { useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "../../store/connectionStore";

interface ConnectionVisualizerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 连接线可视化组件
 *
 * 绘制便签连接点到插槽容器的连接线
 */
export const ConnectionVisualizer: React.FC<ConnectionVisualizerProps> = ({
  containerRef,
}) => {
  const { connectedNotes } = useConnectionStore();
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(false);

  // 优化的CSS连接线更新函数
  const updateCSSConnectionLines = useCallback(() => {
    // 如果没有连接的便签，直接返回
    if (connectedNotes.length === 0) {
      return;
    }

    const now = performance.now();

    // 防抖：如果距离上次更新时间少于100ms，则延迟执行
    if (now - lastUpdateTimeRef.current < 100) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateCSSConnectionLines();
      });
      return;
    }

    lastUpdateTimeRef.current = now;

    // 检查组件是否已挂载和引用是否可用
    if (!isMountedRef.current || !containerRef.current) {
      return;
    }

    // 获取插槽容器位置
    const slotContainer = document.querySelector("[data-slot-container]");
    if (!slotContainer) {
      console.warn("ConnectionVisualizer: 找不到插槽容器");
      return;
    }

    const slotRect = slotContainer.getBoundingClientRect();

    // 清除现有的CSS连接线
    const existingLines = document.querySelectorAll(".css-connection-line");
    existingLines.forEach((line) => line.remove());

    connectedNotes.forEach((note, index) => {
      // 查找连接点
      const connectionPoint = document.querySelector(
        `[data-note-connection-point="${note.id}"]`
      );

      if (!connectionPoint) {
        console.warn(`找不到便签 ${note.id} 的连接点`);
        return;
      }

      const pointRect = connectionPoint.getBoundingClientRect();

      // 计算插槽位置
      const slotElements = slotContainer.querySelectorAll("[data-index]");
      const targetSlot = Array.from(slotElements).find(
        (slot) => slot.getAttribute("data-index") === String(index + 1)
      );

      let slotX, slotY;
      if (targetSlot) {
        const targetRect = targetSlot.getBoundingClientRect();
        slotX = targetRect.left + targetRect.width / 2;
        slotY = targetRect.top + targetRect.height / 2;
      } else {
        slotX = slotRect.left + slotRect.width / 2;
        slotY = slotRect.top + slotRect.height / 2;
      }

      // 连接点坐标
      const startX = pointRect.left + pointRect.width / 2;
      const startY = pointRect.top + pointRect.height / 2;

      // 创建CSS连接线元素
      const connectionLine = document.createElement("div");
      connectionLine.className = "css-connection-line";
      connectionLine.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 999;
        --start-x: ${startX}px;
        --start-y: ${startY}px;
        --end-x: ${slotX}px;
        --end-y: ${slotY}px;
      `;

      // 添加S形连接线样式
      connectionLine.innerHTML = `
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: none;
        ">
          <svg 
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              overflow: visible;
            "
            viewBox="0 0 100vw 100vh" 
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow-${index}">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d="M ${startX} ${startY} 
                 C ${startX + (slotX - startX) * 0.3} ${
        startY + (slotY - startY) * 0.1
      },
                   ${slotX - (slotX - startX) * 0.3} ${
        slotY - (slotY - startY) * 0.1
      },
                   ${slotX} ${slotY}"
              stroke="#52c41a" 
              stroke-width="3" 
              fill="none" 
              stroke-linecap="round" 
              stroke-opacity="0.8"
              filter="url(#glow-${index})"
              style="
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                animation: sLineFlow 3s ease-in-out infinite;
              "
            />
          </svg>
        </div>
      `;

      document.body.appendChild(connectionLine);
    });
  }, [connectedNotes]);

  // 监听连接状态变化
  useEffect(() => {
    // 只有在有连接便签时才执行更新
    if (connectedNotes.length > 0) {
      // 延迟执行，确保 DOM 已就绪
      const timer = setTimeout(() => {
        updateCSSConnectionLines();
      }, 100);

      return () => clearTimeout(timer);
    }

    // 没有连接时也要返回清理函数，保持 hooks 调用一致性
    return () => {};
  }, [connectedNotes, updateCSSConnectionLines]);

  // 监听窗口大小变化、滚动和便签位置变化
  useEffect(() => {
    // 标记组件已挂载
    isMountedRef.current = true;

    let handleResize: (() => void) | null = null;
    let handleScroll: (() => void) | null = null;
    let handleNoteMove: (() => void) | null = null;
    let observer: MutationObserver | null = null;
    let intervalId: number | null = null;

    // 只有在有连接便签时才设置事件监听器
    if (connectedNotes.length > 0) {
      handleResize = () => updateCSSConnectionLines();
      handleScroll = () => updateCSSConnectionLines();

      // 监听便签移动
      handleNoteMove = () => {
        // 使用 requestAnimationFrame 确保在 DOM 更新后执行
        requestAnimationFrame(updateCSSConnectionLines);
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);

      // 监听便签位置变化（通过 MutationObserver）
      observer = new MutationObserver((mutations) => {
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

        if (needUpdate && handleNoteMove) {
          handleNoteMove();
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

      // 移除定期更新 - 只在必要时才更新连接线
      // intervalId = setInterval(updateConnectionLines, 200); // 已移除：导致过度更新
    }

    return () => {
      // 标记组件已卸载
      isMountedRef.current = false;

      // 清理事件监听器
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
      if (handleScroll) {
        window.removeEventListener("scroll", handleScroll, true);
      }
      if (observer) {
        observer.disconnect();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }

      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 清理CSS连接线
      const existingLines = document.querySelectorAll(".css-connection-line");
      existingLines.forEach((line) => line.remove());
    };
  }, [connectedNotes.length, updateCSSConnectionLines]);

  // 开发调试：暴露更新函数到全局
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugConnectionVisualizer = {
        updateConnectionLines: updateCSSConnectionLines,
        connectedNotes,
        forceUpdate: () => {
          console.log("强制更新连接线...");
          updateCSSConnectionLines();
        },
      };
    }
  }, [updateCSSConnectionLines, connectedNotes]);

  if (connectedNotes.length === 0) {
    // 清理现有的CSS连接线
    const existingLines = document.querySelectorAll(".css-connection-line");
    existingLines.forEach((line) => line.remove());
    return null;
  }

  // 使用CSS连接线，不再需要SVG canvas
  return null;
};
