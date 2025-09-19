/**
 * 增强版思维链显示测试
 * 测试新的步骤类型检测、视觉指示器和统计功能
 */

// 模拟各种类型的思维步骤数据
const mockThinkingChainData = {
  totalSteps: 8,
  summary:
    "通过分析用户需求，推理技术方案，得出最佳实施方案，并提出进一步优化建议。",
  steps: [
    {
      id: "step_1",
      content:
        "首先我需要分析用户的具体需求和当前系统的架构。通过观察用户界面，我发现思维链显示需要更直观的分类。",
      timestamp: Date.now() - 7000,
    },
    {
      id: "step_2",
      content:
        "接下来分析现有的数据结构，检查是否支持步骤类型分类。研究 Ant Design Steps 组件的扩展能力。",
      timestamp: Date.now() - 6000,
    },
    {
      id: "step_3",
      content:
        "基于前面的分析，我认为可以通过关键词匹配来智能检测步骤类型。因为这样可以保持向后兼容性。",
      timestamp: Date.now() - 5000,
    },
    {
      id: "step_4",
      content:
        "如何实现步骤类型的自动分类？是否需要复杂的 NLP 算法？还是简单的关键词匹配就足够了？",
      timestamp: Date.now() - 4000,
    },
    {
      id: "step_5",
      content:
        "我有一个想法：可以定义不同类型的关键词规则，然后用不同的图标和颜色来区分。建议使用蓝色表示分析，绿色表示推理。",
      timestamp: Date.now() - 3000,
    },
    {
      id: "step_6",
      content:
        "通过实验和测试，推导出最适合的视觉设计方案。基于用户体验的角度考虑，应该保持简洁而富有表现力。",
      timestamp: Date.now() - 2000,
    },
    {
      id: "step_7",
      content:
        "综上所述，增强版思维链应该包含：智能类型检测、视觉指示器、统计信息显示。因此这个方案是可行的。",
      timestamp: Date.now() - 1000,
    },
    {
      id: "step_8",
      content:
        "最终结论是采用关键词匹配 + 视觉指示器的方案。这样既保持了简单性，又提供了更好的用户体验。",
      timestamp: Date.now(),
    },
  ],
};

// 在浏览器控制台中测试
console.log("🧠 增强版思维链测试数据:", mockThinkingChainData);

// 测试步骤类型检测函数
function detectStepType(content) {
  const stepTypeRules = [
    {
      keywords: ["分析", "观察", "数据", "检查", "研究", "调查"],
      type: "analysis",
    },
    {
      keywords: ["结论", "总结", "因此", "所以", "综上", "最终"],
      type: "conclusion",
    },
    {
      keywords: ["?", "？", "如何", "为什么", "是否", "怎么", "疑问"],
      type: "question",
    },
    {
      keywords: ["想法", "建议", "可以", "应该", "或许", "不妨", "建议"],
      type: "idea",
    },
  ];

  for (const rule of stepTypeRules) {
    if (rule.keywords.some((keyword) => content.includes(keyword))) {
      return rule.type;
    }
  }

  return "reasoning";
}

// 测试每个步骤的类型检测
console.log("📊 步骤类型检测结果:");
mockThinkingChainData.steps.forEach((step, index) => {
  const stepType = detectStepType(step.content);
  console.log(
    `步骤 ${index + 1}: ${stepType} - "${step.content.substring(0, 30)}..."`
  );
});

// 统计不同类型步骤数量
const stepStats = mockThinkingChainData.steps.reduce((acc, step) => {
  const stepType = detectStepType(step.content);
  acc[stepType] = (acc[stepType] || 0) + 1;
  return acc;
}, {});

console.log("📈 步骤类型统计:", stepStats);

// 提供测试说明
console.log(`
🎯 测试说明:
1. 打开浏览器开发者工具的控制台
2. 运行这个脚本查看测试数据
3. 在应用中触发 AI 生成功能
4. 观察思维链显示是否包含：
   - 不同颜色和图标的步骤类型
   - 头部区域的类型统计
   - 时间戳显示
   - 总结区域的灯泡图标

🔧 预期改进效果:
- 分析步骤: 蓝色搜索图标
- 推理步骤: 绿色实验图标  
- 结论步骤: 橙色奖杯图标
- 疑问步骤: 粉色问号图标
- 想法步骤: 紫色灯泡图标
- 头部统计: 显示各类型步骤数量
`);
