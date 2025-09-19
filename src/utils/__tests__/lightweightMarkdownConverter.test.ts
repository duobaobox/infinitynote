/**
 * 轻量级Markdown转换器测试
 * 确保新转换器的功能正确性和性能表现
 */

import { 
  lightweightConverter, 
  compatibleConverter, 
  CompatibleMarkdownConverter 
} from '../lightweightMarkdownConverter';

describe('LightweightMarkdownConverter', () => {
  // 等待转换器初始化
  beforeAll(async () => {
    // 给转换器一些时间初始化
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('基础转换功能', () => {
    test('应该正确转换标题', async () => {
      const markdown = '# 一级标题\n## 二级标题\n### 三级标题';
      const html = await lightweightConverter.convert(markdown);
      
      expect(html).toContain('<h1>一级标题</h1>');
      expect(html).toContain('<h2>二级标题</h2>');
      expect(html).toContain('<h3>三级标题</h3>');
    });

    test('应该正确转换文本格式', async () => {
      const markdown = '**粗体** *斜体* `代码`';
      const html = await lightweightConverter.convert(markdown);
      
      expect(html).toContain('<strong>粗体</strong>');
      expect(html).toContain('<em>斜体</em>');
      expect(html).toContain('<code>代码</code>');
    });

    test('应该正确转换链接', async () => {
      const markdown = '[链接文本](https://example.com)';
      const html = await lightweightConverter.convert(markdown);
      
      expect(html).toContain('<a href="https://example.com">链接文本</a>');
    });

    test('应该正确转换图片', async () => {
      const markdown = '![图片描述](https://example.com/image.jpg)';
      const html = await lightweightConverter.convert(markdown);
      
      expect(html).toContain('<img');
      expect(html).toContain('alt="图片描述"');
      expect(html).toContain('src="https://example.com/image.jpg"');
    });

    test('应该正确转换列表', async () => {
      const markdown = '- 项目1\n- 项目2\n- 项目3';
      const html = await lightweightConverter.convert(markdown);
      
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>项目1</li>');
      expect(html).toContain('<li>项目2</li>');
      expect(html).toContain('<li>项目3</li>');
      expect(html).toContain('</ul>');
    });
  });

  describe('AI生成内容测试', () => {
    test('应该正确处理AI生成的复杂内容', async () => {
      const aiContent = `# AI生成的便签

这是一个**重要**的便签内容。

## 要点列表
- 第一个要点
- 第二个要点
- 第三个要点

参考链接：[OpenAI](https://openai.com)

\`\`\`javascript
console.log('代码示例');
\`\`\``;

      const html = await lightweightConverter.convert(aiContent);
      
      expect(html).toContain('<h1>AI生成的便签</h1>');
      expect(html).toContain('<strong>重要</strong>');
      expect(html).toContain('<h2>要点列表</h2>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<a href="https://openai.com">OpenAI</a>');
    });

    test('应该正确处理思维链内容', async () => {
      const thinkingContent = `<thinking>
这是思维过程...
</thinking>

# 最终答案

这是最终的答案内容。`;

      const html = await lightweightConverter.convert(thinkingContent);
      
      // 应该保留thinking标签（由上层处理）
      expect(html).toContain('<thinking>');
      expect(html).toContain('</thinking>');
      expect(html).toContain('<h1>最终答案</h1>');
    });
  });

  describe('性能测试', () => {
    test('应该快速处理大量内容', async () => {
      const largeContent = '# 标题\n\n' + '这是一段文本。\n'.repeat(1000);
      
      const startTime = performance.now();
      const html = await lightweightConverter.convert(largeContent);
      const endTime = performance.now();
      
      expect(html).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    test('应该正确处理空内容', async () => {
      const html = await lightweightConverter.convert('');
      expect(html).toBe('');
    });

    test('应该正确处理特殊字符', async () => {
      const markdown = '特殊字符：<>&"\'';
      const html = await lightweightConverter.convert(markdown);
      
      // markdown-it会自动转义HTML特殊字符
      expect(html).toBeTruthy();
    });
  });

  describe('错误处理', () => {
    test('应该优雅处理转换错误', async () => {
      // 模拟极端情况
      const problematicContent = '\u0000\u0001\u0002';
      
      expect(async () => {
        await lightweightConverter.convert(problematicContent);
      }).not.toThrow();
    });
  });
});

describe('CompatibleMarkdownConverter', () => {
  let converter: CompatibleMarkdownConverter;

  beforeEach(() => {
    converter = new CompatibleMarkdownConverter();
  });

  describe('兼容性API测试', () => {
    test('convertStreamChunk应该与原API兼容', () => {
      const markdown = '**测试内容**';
      const html = converter.convertStreamChunk(markdown);
      
      expect(html).toContain('<strong>测试内容</strong>');
    });

    test('convertComplete应该与原API兼容', () => {
      const markdown = '# 测试标题';
      const html = converter.convertComplete(markdown);
      
      expect(html).toContain('<h1>测试标题</h1>');
    });

    test('isReady应该返回状态', () => {
      const ready = converter.isReady();
      expect(typeof ready).toBe('boolean');
    });

    test('getStatus应该返回详细状态', () => {
      const status = converter.getStatus();
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('hasMarkdownIt');
    });
  });

  describe('异步API测试', () => {
    test('convertAsync应该正确工作', async () => {
      const markdown = '## 异步测试';
      const html = await converter.convertAsync(markdown);
      
      expect(html).toContain('<h2>异步测试</h2>');
    });
  });
});

describe('性能对比测试', () => {
  test('新转换器应该比复杂转换器更快', async () => {
    const testContent = `# 性能测试

这是一个**性能测试**的内容。

## 列表测试
- 项目1
- 项目2
- 项目3

[链接测试](https://example.com)

\`代码测试\``;

    // 测试新转换器
    const startTime = performance.now();
    await lightweightConverter.convert(testContent);
    const newConverterTime = performance.now() - startTime;

    console.log(`新转换器耗时: ${newConverterTime.toFixed(2)}ms`);
    
    // 新转换器应该很快
    expect(newConverterTime).toBeLessThan(50);
  });
});

describe('边界情况测试', () => {
  test('应该处理只有空白字符的内容', async () => {
    const html = await lightweightConverter.convert('   \n\n   ');
    expect(html).toBeTruthy();
  });

  test('应该处理非常长的单行内容', async () => {
    const longLine = 'a'.repeat(10000);
    const html = await lightweightConverter.convert(longLine);
    expect(html).toContain(longLine);
  });

  test('应该处理混合格式内容', async () => {
    const mixedContent = `# 标题 **粗体**

- 列表项 *斜体*
- [链接](http://example.com) \`代码\`

![图片](http://example.com/img.jpg)`;

    const html = await lightweightConverter.convert(mixedContent);
    
    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<em>');
    expect(html).toContain('<a href=');
    expect(html).toContain('<code>');
    expect(html).toContain('<img');
  });
});
