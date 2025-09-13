# 画布自动切换功能测试

## 功能描述
当用户点击"添加画布"按钮时，应用会：
1. 创建新画布（命名为"画布 N"，N为序号）
2. 自动切换到新创建的画布
3. 用户可以立即在新画布上添加便签

## 测试步骤

### 1. 基本功能测试
1. 打开应用：http://localhost:5174/
2. 确认当前在默认画布上
3. 点击左侧边栏的"添加画布"按钮
4. 观察是否：
   - 创建了新画布（在画布列表中可见）
   - 自动切换到新画布（新画布在列表中被高亮选中）
   - 右侧画布区域显示空白的新画布
   - 控制台显示切换日志

### 2. 连续创建测试
1. 连续点击"添加画布"按钮多次
2. 观察是否：
   - 每次都创建新画布
   - 每次都自动切换到最新创建的画布
   - 画布命名正确递增（画布 1, 画布 2, 画布 3...）

### 3. 便签添加测试
1. 创建新画布并自动切换后
2. 双击画布空白区域或使用工具栏添加便签
3. 确认便签正确添加到新画布上

### 4. 画布切换测试
1. 创建多个画布
2. 手动切换到其他画布
3. 再次点击"添加画布"
4. 确认新画布创建后自动切换到新画布

## 预期结果

✅ **成功标准：**
- 新画布创建成功
- 自动切换到新画布
- 可以在新画布上正常添加便签
- 控制台显示正确的日志信息
- 如果创建失败，显示错误提示

❌ **失败情况：**
- 创建画布后没有自动切换
- 切换到错误的画布
- 无法在新画布上添加便签
- 出现错误但没有提示

## 技术实现

### 修改的文件
- `src/pages/Main/index.tsx` - 添加自动切换逻辑

### 关键代码
```typescript
// 处理添加画布
const handleAddCanvas = useCallback(async () => {
  try {
    const canvasName = `画布 ${canvases.length + 1}`;
    const newCanvasId = await createCanvas(canvasName, false);

    // 创建成功后自动切换到新画布
    setActiveCanvas(newCanvasId);

    logWithDedup(
      `🎨 创建新画布: ${newCanvasId.slice(-8)} (${canvasName})，已自动切换`
    );
  } catch (error) {
    console.error("❌ 创建画布失败:", error);
    
    // 显示错误提示
    modal.error({
      title: "创建画布失败",
      content: error instanceof Error ? error.message : "未知错误",
    });
  }
}, [canvases.length, createCanvas, setActiveCanvas, modal]);
```

## 注意事项
- 确保应用已经正确初始化
- 检查浏览器控制台是否有错误信息
- 如果出现问题，检查数据库连接状态
