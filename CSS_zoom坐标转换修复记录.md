# CSS zoom 坐标转换修复记录

## 📅 修复时间

2025 年 10 月 3 日

## 🐛 问题描述

在实施 CSS zoom 方案后，发现两个坐标转换问题：

1. **画布拖动位移过长** - 放大画布后，拖动画布时，实际位移距离大于鼠标位移距离
2. **便签大小调整位移过长** - 放大画布后，拖动便签右下角调整大小时，大小变化过大

## 🔍 根本原因

### CSS zoom 对坐标系统的影响

CSS `zoom` 属性不仅会放大元素的视觉效果，还会**改变元素的整个坐标系统**。

**示例：**

```css
.element {
  zoom: 2;
  transform: translate3d(100px, 100px, 0);
}
```

在这个例子中：

- 元素及其内容会放大 2 倍
- `translate3d(100px, 100px, 0)` 在 `zoom: 2` 的坐标系统中，实际会在**屏幕上移动 200px**
- 这是因为 CSS zoom 将元素的 1px 变成了屏幕上的 2px

### 与 transform: scale() 的区别

```css
/* 旧方案：transform scale */
.element {
  transform: translate3d(100px, 100px, 0) scale(2);
}
/* translate 在 scale 之前应用，所以 100px 就是 100px */

/* 新方案：CSS zoom */
.element {
  zoom: 2;
  transform: translate3d(100px, 100px, 0);
}
/* translate 在 zoom 坐标系中，100px 在屏幕上是 200px */
```

## 🎯 问题分析

### 问题 1：画布拖动

**代码位置：** `src/pages/Canvas/index.tsx`

**原代码：**

```tsx
const deltaX = e.clientX - panStartRef.current.x; // 鼠标屏幕坐标差值
const deltaY = e.clientY - panStartRef.current.y;
updatePan({ x: deltaX, y: deltaY }); // 直接应用到 translate
```

**问题：**

- 鼠标移动 `deltaX` 像素（屏幕坐标）
- 但 `translate` 在 `zoom: scale` 坐标系中
- 实际画布移动了 `deltaX * scale` 像素（屏幕坐标）
- 导致**位移放大了 scale 倍**

**举例：**

- scale = 2.0 时
- 鼠标向右移动 100px
- 画布实际向右移动 200px
- 移动距离 = 鼠标距离 × 2

### 问题 2：便签大小调整

**代码位置：** `src/components/NoteCard/index.tsx`

**原代码：**

```tsx
const deltaX = e.clientX - resizeData.startX; // 鼠标屏幕坐标差值
const deltaY = e.clientY - resizeData.startY;
newWidth = resizeData.startWidth + deltaX; // 直接加到宽度
newHeight = resizeData.startHeight + deltaY;
```

**问题：**

- 鼠标移动 `deltaX` 像素（屏幕坐标）
- 但便签尺寸是在 `zoom: scale` 坐标系中
- 便签宽度增加了 `deltaX` 像素（zoom 坐标）
- 屏幕上实际增加了 `deltaX * scale` 像素
- 导致**尺寸变化放大了 scale 倍**

**举例：**

- scale = 2.0 时
- 鼠标向右拖动 50px
- 便签宽度增加 50px（zoom 坐标）
- 屏幕上看起来增加了 100px
- 变化 = 鼠标距离 × 2

## ✅ 解决方案

### 核心原理

**将屏幕坐标的鼠标位移除以 scale，转换为 zoom 坐标系中的位移。**

公式：

```
zoom坐标位移 = 屏幕坐标位移 / scale
```

### 修复 1：画布拖动

**文件：** `src/pages/Canvas/index.tsx`

**修改位置 1：** `handleMouseMove` 函数（约第 383 行）

```tsx
// 修复前
const deltaX = e.clientX - panStartRef.current.x;
const deltaY = e.clientY - panStartRef.current.y;

// 修复后
// CSS zoom 会影响坐标系统，需要将鼠标位移除以 scale
const deltaX = (e.clientX - panStartRef.current.x) / viewport.scale;
const deltaY = (e.clientY - panStartRef.current.y) / viewport.scale;
```

**修改位置 2：** `handleGlobalMouseMove` 函数（约第 428 行）

```tsx
// 修复前
const deltaX = e.clientX - panStartRef.current.x;
const deltaY = e.clientY - panStartRef.current.y;

// 修复后
// CSS zoom 会影响坐标系统，需要将鼠标位移除以 scale
const deltaX = (e.clientX - panStartRef.current.x) / viewport.scale;
const deltaY = (e.clientY - panStartRef.current.y) / viewport.scale;
```

**依赖更新：**

```tsx
// handleMouseMove 的依赖数组需要添加 viewport.scale
[updatePan, viewport.scale];
```

### 修复 2：便签大小调整

**文件：** `src/components/NoteCard/index.tsx`

**修改位置：** `handleResizeMove` 函数（约第 710 行）

```tsx
// 修复前
const deltaX = e.clientX - resizeData.startX;
const deltaY = e.clientY - resizeData.startY;

// 修复后
// CSS zoom 会影响坐标系统，需要将鼠标位移除以 scale
const deltaX = (e.clientX - resizeData.startX) / scale;
const deltaY = (e.clientY - resizeData.startY) / scale;
```

**依赖更新：**

```tsx
// handleResizeMove 的依赖数组需要添加 scale
}, [scale]);
```

## 📊 修复效果对比

### 画布拖动

| 缩放级别 | 修复前行为                              | 修复后行为                         |
| -------- | --------------------------------------- | ---------------------------------- |
| 0.5x     | 鼠标移动 100px → 画布移动 50px（太慢）  | 鼠标移动 100px → 画布移动 100px ✅ |
| 1.0x     | 鼠标移动 100px → 画布移动 100px ✅      | 鼠标移动 100px → 画布移动 100px ✅ |
| 2.0x     | 鼠标移动 100px → 画布移动 200px（太快） | 鼠标移动 100px → 画布移动 100px ✅ |

### 便签大小调整

| 缩放级别 | 修复前行为                             | 修复后行为                       |
| -------- | -------------------------------------- | -------------------------------- |
| 0.5x     | 鼠标拖动 50px → 宽度增加 25px（太慢）  | 鼠标拖动 50px → 宽度增加 50px ✅ |
| 1.0x     | 鼠标拖动 50px → 宽度增加 50px ✅       | 鼠标拖动 50px → 宽度增加 50px ✅ |
| 2.0x     | 鼠标拖动 50px → 宽度增加 100px（太快） | 鼠标拖动 50px → 宽度增加 50px ✅ |

## 🧪 测试验证

### 测试步骤

1. **画布拖动测试**

   - [ ] 缩放到 0.5x，中键拖动画布，检查是否 1:1 跟手
   - [ ] 缩放到 1.0x，中键拖动画布，检查是否 1:1 跟手
   - [ ] 缩放到 2.0x，中键拖动画布，检查是否 1:1 跟手

2. **便签大小调整测试**

   - [ ] 缩放到 0.5x，拖动便签右下角，检查尺寸变化是否跟手
   - [ ] 缩放到 1.0x，拖动便签右下角，检查尺寸变化是否跟手
   - [ ] 缩放到 2.0x，拖动便签右下角，检查尺寸变化是否跟手

3. **综合测试**
   - [ ] 创建多个便签
   - [ ] 在不同缩放级别下拖动画布、移动便签、调整便签大小
   - [ ] 确认所有操作都 1:1 跟手

### 预期结果

✅ 在任何缩放级别下：

- 画布拖动距离 = 鼠标移动距离
- 便签尺寸变化 = 鼠标拖动距离
- 所有操作都应该感觉"跟手"，没有加速或减速

## 💡 技术要点总结

### CSS zoom 坐标转换规则

1. **屏幕坐标 → zoom 坐标**

   ```typescript
   zoomCoord = screenCoord / scale;
   ```

2. **zoom 坐标 → 屏幕坐标**

   ```typescript
   screenCoord = zoomCoord * scale;
   ```

3. **应用场景**
   - 鼠标事件（clientX, clientY）：屏幕坐标
   - 元素 translate：zoom 坐标
   - 元素 width/height：zoom 坐标
   - 便签 position：zoom 坐标

### 需要转换的场景

| 场景     | 输入         | 转换    | 输出           |
| -------- | ------------ | ------- | -------------- |
| 画布拖动 | 鼠标屏幕位移 | ÷ scale | translate 偏移 |
| 便签移动 | 鼠标屏幕位移 | ÷ scale | position 变化  |
| 便签缩放 | 鼠标屏幕位移 | ÷ scale | size 变化      |
| 双击创建 | 鼠标屏幕坐标 | ÷ scale | 便签 position  |

### 不需要转换的场景

- dnd-kit 的 `handleDragEnd` 已经处理了（代码中已有 `/ viewport.scale`）
- `getBoundingClientRect()` 返回的是屏幕坐标，需要手动转换
- CSS 样式中的固定值（如最小宽高）已经是 zoom 坐标

## 🔗 相关文档

- [CSS_zoom 方案分析.md](./CSS_zoom方案分析.md) - CSS zoom 的技术原理
- [CSS_zoom 实施记录.md](./CSS_zoom实施记录.md) - CSS zoom 的实施过程

## ✅ 修复确认

- [x] 画布拖动位移已修复
- [x] 便签大小调整已修复
- [ ] 等待用户测试确认
