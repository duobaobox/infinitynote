import React, { useEffect, useRef } from "react";
import { useConnectionStore } from "../../store/connectionStore";
import styles from "./index.module.css";

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
  const canvasRef = useRef<SVGSVGElement>(null);
  const { connectedNotes } = useConnectionStore();

  // 更新连接线
  const updateConnectionLines = () => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // 清除现有路径
    canvas.innerHTML = "";

    // 获取插槽容器位置
    const slotContainer = document.querySelector("[data-slot-container]");
    if (!slotContainer) return;

    const slotRect = slotContainer.getBoundingClientRect();

    connectedNotes.forEach((note, index) => {
      // 查找便签的连接点
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
      const connectionPoint = noteElement?.querySelector(
        "[data-note-connection-point]"
      );

      if (!connectionPoint) return;

      const pointRect = connectionPoint.getBoundingClientRect();

      // 计算插槽容器中对应插槽的位置
      const slotElements = slotContainer.querySelectorAll("[data-index]");
      const targetSlot = Array.from(slotElements).find(
        (slot) => slot.getAttribute("data-index") === String(index + 1)
      );

      let slotX, slotY;
      if (targetSlot) {
        const targetRect = targetSlot.getBoundingClientRect();
        slotX = targetRect.left + targetRect.width / 2 - containerRect.left;
        slotY = targetRect.top + targetRect.height / 2 - containerRect.top;
      } else {
        // 回退到容器中心
        slotX = slotRect.left + slotRect.width / 2 - containerRect.left;
        slotY = slotRect.top + slotRect.height / 2 - containerRect.top;
      }

      const startX = pointRect.left + pointRect.width / 2 - containerRect.left;
      const startY = pointRect.top + pointRect.height / 2 - containerRect.top;

      // 创建连接线路径
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

      // 创建更自然的三次贝塞尔曲线路径，适配新的插槽位置
      const controlY1 = startY - Math.abs(startY - slotY) * 0.4;
      const controlY2 = slotY + Math.abs(startY - slotY) * 0.2;

      const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${slotX} ${controlY2}, ${slotX} ${slotY}`;

      path.setAttribute("d", pathData);
      path.setAttribute("stroke", "#1890ff"); // 蓝色连接线匹配插槽颜色
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("opacity", "0.8");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");

      // 添加阴影效果
      const filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
      );
      filter.setAttribute("id", `shadow-${index}`);
      filter.innerHTML = `
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/>
      `;
      canvas.appendChild(filter);
      path.setAttribute("filter", `url(#shadow-${index})`);

      // 添加动画效果
      path.classList.add(styles.connectionLine);

      canvas.appendChild(path);
    });
  };

  // 监听连接状态变化
  useEffect(() => {
    updateConnectionLines();
  }, [connectedNotes]);

  // 监听窗口大小变化和滚动
  useEffect(() => {
    const handleResize = () => updateConnectionLines();
    const handleScroll = () => updateConnectionLines();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  if (connectedNotes.length === 0) {
    return null;
  }

  return (
    <svg
      ref={canvasRef}
      className={styles.connectionCanvas}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
};
