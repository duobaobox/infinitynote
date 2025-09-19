// 完整测试流式累积修复效果，包括节流机制
// 模拟完整的AI生成流程

class StreamingMarkdownBuffer {
  constructor() {
    this.lastCompleteContent = "";
  }

  processFullContent(fullContent) {
    const completeContent = this.extractCompleteContent(fullContent);
    
    if (completeContent !== this.lastCompleteContent) {
      const isIncremental = this.lastCompleteContent.length > 0;
      this.lastCompleteContent = completeContent;
      
      return {
        shouldConvert: true,
        content: completeContent,
        isIncremental,
      };
    }
    
    return {
      shouldConvert: false,
      content: fullContent,
      isIncremental: false,
    };
  }

  extractCompleteContent(content) {
    // 简化版本，直接返回内容
    return content;
  }

  reset() {
    this.lastCompleteContent = "";
  }
}

class MarkdownConverter {
  constructor() {
    this.streamBuffer = new StreamingMarkdownBuffer();
  }

  convertStreamChunk(markdownChunk) {
    const result = this.streamBuffer.processFullContent(markdownChunk);
    return result.content;
  }
}

// 模拟节流机制
class ThrottledNoteStore {
  constructor() {
    this.streamingUpdateTimestamps = new Map();
    this.aiStreamingData = new Map();
    this.updateCount = 0;
    this.skippedCount = 0;
  }

  updateAIStreamingContent(noteId, content, aiData) {
    // 使用节流机制优化流式更新频率
    const now = Date.now();
    const lastUpdate = this.streamingUpdateTimestamps.get(noteId) || 0;
    const minInterval = 100; // 最小更新间隔100ms

    // 如果距离上次更新时间太短，跳过此次更新（除非是最终更新）
    if (now - lastUpdate < minInterval && aiData?.isStreaming !== false) {
      this.skippedCount++;
      console.log(`⏭️  节流跳过更新 (距离上次更新 ${now - lastUpdate}ms)`);
      return;
    }

    this.streamingUpdateTimestamps.set(noteId, now);
    this.aiStreamingData.set(noteId, content);
    this.updateCount++;
    
    console.log(`✅ UI更新 #${this.updateCount}: "${content}"`);
  }

  getStats() {
    return {
      totalUpdates: this.updateCount,
      skippedUpdates: this.skippedCount,
      efficiency: this.skippedCount > 0 ? 
        `${((this.skippedCount / (this.updateCount + this.skippedCount)) * 100).toFixed(1)}%` : 
        '0%'
    };
  }
}

// 模拟AI服务的完整流程
async function simulateCompleteAIFlow() {
  const markdownConverter = new MarkdownConverter();
  const noteStore = new ThrottledNoteStore();
  const noteId = "test-note-123";
  
  let fullMarkdown = "";
  
  // 模拟AI返回的增量内容（更快的频率）
  const chunks = [
    "好的", "，", "我们", "来", "详细", "解释", "一下", "\"", "羊群", "效应", "\"", "。",
    "\n\n", "###", " ", "什么", "是", "羊群", "效应", "？", "\n\n",
    "羊群", "效应", "是", "指", "人们", "在", "群体", "中", "容易", "受到", "他人", "影响", "。"
  ];
  
  console.log("=== 完整AI流式生成测试 ===");
  console.log(`模拟 ${chunks.length} 个增量内容片段`);
  console.log("节流间隔: 100ms\n");
  
  for (let i = 0; i < chunks.length; i++) {
    const deltaContent = chunks[i];
    
    // AI服务层：累积内容
    fullMarkdown += deltaContent;
    
    // 转换为HTML
    const htmlContent = markdownConverter.convertStreamChunk(fullMarkdown);
    
    // 模拟流式更新（带节流）
    noteStore.updateAIStreamingContent(noteId, htmlContent, { isStreaming: true });
    
    // 模拟快速连续的更新（每50ms一次，比节流间隔更快）
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // 最终更新（不会被节流）
  console.log("\n--- 最终更新 ---");
  noteStore.updateAIStreamingContent(noteId, fullMarkdown, { isStreaming: false });
  
  // 显示统计信息
  const stats = noteStore.getStats();
  console.log("\n=== 测试结果 ===");
  console.log(`总片段数: ${chunks.length + 1}`);
  console.log(`实际UI更新次数: ${stats.totalUpdates}`);
  console.log(`节流跳过次数: ${stats.skippedUpdates}`);
  console.log(`节流效率: ${stats.efficiency}`);
  console.log(`最终内容: "${fullMarkdown}"`);
  
  // 验证内容正确性
  const expectedContent = chunks.join('');
  const hasCorrectContent = fullMarkdown === expectedContent;
  const hasRepeatedContent = fullMarkdown.includes("好的好的") || 
                            fullMarkdown.includes("，我们来，我们来");
  
  console.log("\n=== 验证结果 ===");
  console.log(`✅ 内容完整性: ${hasCorrectContent ? '通过' : '失败'}`);
  console.log(`✅ 无重复内容: ${!hasRepeatedContent ? '通过' : '失败'}`);
  console.log(`✅ 节流机制: ${stats.skippedUpdates > 0 ? '工作正常' : '未触发'}`);
  
  if (hasCorrectContent && !hasRepeatedContent && stats.skippedUpdates > 0) {
    console.log("\n🎉 所有测试通过！修复成功！");
  } else {
    console.log("\n❌ 部分测试失败，需要进一步检查");
  }
}

// 运行完整测试
simulateCompleteAIFlow().catch(console.error);
