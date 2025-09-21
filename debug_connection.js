// 连接状态测试脚本
console.log("=== 连接状态调试开始 ===");

// 1. 检查连接store是否可用
function testConnectionStore() {
  try {
    // 尝试获取store状态
    console.log(
      "当前连接状态:",
      window.zustandConnectionStore || "store 未找到"
    );
  } catch (e) {
    console.error("无法访问连接store:", e);
  }
}

// 2. 检查DOM元素
function checkDOMElements() {
  const connectionPoints = document.querySelectorAll(
    "[data-note-connection-point]"
  );
  const slotContainer = document.querySelector("[data-slot-container]");
  const svgCanvas = document.querySelector("svg");
  const noteCards = document.querySelectorAll("[data-note-card]");

  console.log("DOM检查结果:");
  console.log("- 连接点数量:", connectionPoints.length);
  console.log("- 插槽容器存在:", !!slotContainer);
  console.log("- SVG画布存在:", !!svgCanvas);
  console.log("- 便签卡片数量:", noteCards.length);

  if (connectionPoints.length > 0) {
    console.log("连接点详情:");
    connectionPoints.forEach((point, index) => {
      const noteId = point.getAttribute("data-note-connection-point");
      const rect = point.getBoundingClientRect();
      console.log(`  ${index + 1}. 便签ID: ${noteId}, 位置:`, rect);
    });
  }
}

// 3. 手动触发连接点点击
function clickFirstConnectionPoint() {
  const firstPoint = document.querySelector("[data-note-connection-point]");
  if (firstPoint) {
    console.log("点击第一个连接点...");
    firstPoint.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  } else {
    console.log("未找到连接点");
  }
}

// 运行测试
testConnectionStore();
checkDOMElements();

// 暴露测试函数到全局
window.debugConnection = {
  testConnectionStore,
  checkDOMElements,
  clickFirstConnectionPoint,
};

console.log("=== 连接调试函数已准备完毕 ===");
console.log("可用函数:");
console.log("- debugConnection.checkDOMElements() - 检查DOM元素");
console.log("- debugConnection.clickFirstConnectionPoint() - 点击第一个连接点");
