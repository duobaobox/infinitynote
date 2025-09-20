/**
 * AI提示词模板配置
 * 提供常用的AI生成模板，帮助用户快速开始
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  icon: string;
  tags: string[];
  example?: string; // 示例输出
}

export interface PromptCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 提示词分类
export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: "writing",
    name: "写作助手",
    description: "各种写作场景的AI助手",
    icon: "EditOutlined",
  },
  {
    id: "analysis",
    name: "分析总结",
    description: "分析、总结、提炼内容",
    icon: "BarChartOutlined",
  },
  {
    id: "creative",
    name: "创意灵感",
    description: "创意写作和头脑风暴",
    icon: "BulbOutlined",
  },
  {
    id: "learning",
    name: "学习辅助",
    description: "学习、解释、教学相关",
    icon: "BookOutlined",
  },
  {
    id: "business",
    name: "商务办公",
    description: "商务文档和办公场景",
    icon: "BankOutlined",
  },
  {
    id: "daily",
    name: "日常生活",
    description: "生活记录和日常助手",
    icon: "HomeOutlined",
  },
];

// 提示词模板
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // 写作助手类
  {
    id: "article_outline",
    name: "文章大纲",
    description: "生成文章的详细大纲结构",
    category: "writing",
    prompt: `请为主题"{{topic}}"生成一个详细的文章大纲，包括：
1. 引言部分
2. 主要论点（3-5个）
3. 每个论点的支撑内容
4. 结论部分

请确保逻辑清晰，结构完整。`,
    icon: "FileTextOutlined",
    tags: ["写作", "大纲", "结构"],
    example: "为'人工智能的发展趋势'生成文章大纲",
  },
  {
    id: "email_draft",
    name: "邮件草稿",
    description: "撰写专业的商务邮件",
    category: "business",
    prompt: `请帮我撰写一封关于"{{topic}}"的专业邮件，包括：
1. 合适的称呼
2. 清晰的主题说明
3. 具体的内容要点
4. 礼貌的结尾

语气要专业且友好。`,
    icon: "MailOutlined",
    tags: ["邮件", "商务", "沟通"],
    example: "撰写项目进度汇报邮件",
  },
  {
    id: "meeting_summary",
    name: "会议纪要",
    description: "整理会议内容和要点",
    category: "business",
    prompt: `请根据以下会议内容生成专业的会议纪要：

{{content}}

请包括：
1. 会议主题和时间
2. 参会人员
3. 讨论要点
4. 决议事项
5. 后续行动计划`,
    icon: "TeamOutlined",
    tags: ["会议", "纪要", "总结"],
    example: "整理产品评审会议内容",
  },

  // 分析总结类
  {
    id: "text_summary",
    name: "内容总结",
    description: "提炼文本的核心要点",
    category: "analysis",
    prompt: `请对以下内容进行总结，提炼出核心要点：

{{content}}

要求：
1. 保留关键信息
2. 逻辑清晰
3. 简洁明了
4. 不超过原文的1/3长度`,
    icon: "CompressOutlined",
    tags: ["总结", "提炼", "要点"],
    example: "总结长篇文章的核心内容",
  },
  {
    id: "pros_cons",
    name: "利弊分析",
    description: "分析事物的优缺点",
    category: "analysis",
    prompt: `请对"{{topic}}"进行全面的利弊分析：

优点：
- 列出3-5个主要优势
- 每个优势提供具体说明

缺点：
- 列出3-5个主要劣势
- 每个劣势提供具体说明

综合评价：
- 给出平衡的结论和建议`,
    icon: "BarChartOutlined",
    tags: ["分析", "利弊", "评估"],
    example: "分析远程办公的利弊",
  },

  // 创意灵感类
  {
    id: "brainstorm",
    name: "头脑风暴",
    description: "生成创意想法和解决方案",
    category: "creative",
    prompt: `请为"{{topic}}"进行头脑风暴，生成10个创新的想法或解决方案：

要求：
1. 想法要有创意和可行性
2. 从不同角度思考
3. 包括传统和非传统方法
4. 每个想法简要说明实施要点`,
    icon: "ThunderboltOutlined",
    tags: ["创意", "头脑风暴", "解决方案"],
    example: "为提高团队协作效率进行头脑风暴",
  },

  // 学习辅助类
  {
    id: "concept_explain",
    name: "概念解释",
    description: "深入浅出地解释复杂概念",
    category: "learning",
    prompt: `请用通俗易懂的方式解释"{{concept}}"这个概念：

1. 基本定义（用简单的话说明是什么）
2. 核心特点（主要特征和属性）
3. 实际应用（在生活中的具体例子）
4. 相关概念（与其他概念的关系）
5. 记忆技巧（帮助理解和记忆的方法）`,
    icon: "QuestionCircleOutlined",
    tags: ["解释", "学习", "概念"],
    example: "解释区块链技术的基本概念",
  },

  // 快速模板
  {
    id: "quick_note",
    name: "快速笔记",
    description: "快速记录想法和灵感",
    category: "daily",
    prompt: `请帮我整理和扩展这个想法：{{idea}}

包括：
1. 核心观点梳理
2. 相关联想和延伸
3. 可能的应用场景
4. 需要进一步思考的问题`,
    icon: "EditOutlined",
    tags: ["笔记", "想法", "整理"],
    example: "整理关于时间管理的想法",
  },
];

// 获取分类下的模板
export const getTemplatesByCategory = (
  categoryId: string
): PromptTemplate[] => {
  return PROMPT_TEMPLATES.filter(
    (template) => template.category === categoryId
  );
};

// 搜索模板
export const searchTemplates = (query: string): PromptTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return PROMPT_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

// 获取热门模板（使用频率高的）
export const getPopularTemplates = (): PromptTemplate[] => {
  return PROMPT_TEMPLATES.filter((template) =>
    [
      "article_outline",
      "text_summary",
      "brainstorm",
      "concept_explain",
      "quick_note",
    ].includes(template.id)
  );
};
