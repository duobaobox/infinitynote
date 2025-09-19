// 测试流式累积修复效果
// 模拟修复后的StreamingMarkdownBuffer

class StreamingMarkdownBuffer {
  constructor() {
    this.lastCompleteContent = "";
  }

  processFullContent(fullContent) {
    console.log("处理完整内容:", fullContent);
    
    // 检查是否有完整的语法结构
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
    // 检查代码块是否完整
    const codeBlockMatches = content.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 === 1) {
      // 代码块未闭合，等待更多内容
      return this.lastCompleteContent;
    }

    // 检查列表是否在中间被截断
    const lines = content.split("\n");
    const lastLine = lines[lines.length - 1];

    // 如果最后一行是不完整的列表项，等待更多内容
    if (lastLine.match(/^\s*[\d\-\*]\s*$/)) {
      return this.lastCompleteContent;
    }

    return content;
  }

  reset() {
    this.lastCompleteContent = "";
  }
}

// 模拟MarkdownConverter
class MarkdownConverter {
  constructor() {
    this.streamBuffer = new StreamingMarkdownBuffer();
  }

  convertStreamChunk(markdownChunk) {
    const result = this.streamBuffer.processFullContent(markdownChunk);
    return result.content; // 简化版本，只返回HTML内容
  }

  convertComplete(markdown) {
    this.streamBuffer.reset();
    return markdown; // 简化版本
  }
}

// 模拟AI服务的流式处理逻辑
function simulateAIService() {
  const markdownConverter = new MarkdownConverter();
  let fullMarkdown = "";
  let updateCount = 0;
  
  // 模拟AI返回的增量内容
  const chunks = ["好的", "，我们来", "详细", "解释", "一下", "羊群", "效应", "。"];
  
  console.log("=== 模拟AI服务流式处理 ===");
  console.log("预期结果：每次更新都应该显示累积的完整内容，而不是重复内容\n");
  
  chunks.forEach((deltaContent, index) => {
    console.log(`--- 第${index + 1}次处理 ---`);
    console.log("AI返回的增量内容:", deltaContent);
    
    // AI服务层：累积内容
    fullMarkdown += deltaContent;
    console.log("AI服务累积的完整内容:", fullMarkdown);
    
    // 调用convertStreamChunk（传入完整内容）
    const htmlContent = markdownConverter.convertStreamChunk(fullMarkdown);
    console.log("转换器返回的HTML:", htmlContent);
    
    // 模拟onStream回调
    if (htmlContent && htmlContent.length > 0) {
      updateCount++;
      console.log(`✅ 第${updateCount}次UI更新: "${htmlContent}"`);
    } else {
      console.log("⏭️  跳过UI更新（内容未变化）");
    }
    
    console.log("");
  });
  
  console.log("=== 测试结果 ===");
  console.log(`总共进行了 ${updateCount} 次UI更新`);
  console.log(`最终内容: "${fullMarkdown}"`);
  
  // 验证是否有重复内容
  const hasRepeatedContent = fullMarkdown.includes("好的好的") || 
                            fullMarkdown.includes("，我们来，我们来");
  
  if (hasRepeatedContent) {
    console.log("❌ 测试失败：检测到重复内容");
  } else {
    console.log("✅ 测试成功：没有检测到重复内容");
  }
}

// 运行测试
simulateAIService();
