/**
 * Commitlint 配置文件
 * 规范Git提交信息格式
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构（既不是新功能也不是修复）
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建系统或外部依赖
        'ci',       // CI配置
        'chore',    // 其他不修改src或test的提交
        'revert',   // 回滚提交
      ],
    ],
    
    // 类型必须小写
    'type-case': [2, 'always', 'lower-case'],
    
    // 类型不能为空
    'type-empty': [2, 'never'],
    
    // 主题不能为空
    'subject-empty': [2, 'never'],
    
    // 主题大小写（允许任意）
    'subject-case': [0],
    
    // 主题长度限制
    'subject-max-length': [2, 'always', 100],
    
    // 头部最大长度
    'header-max-length': [2, 'always', 120],
    
    // 正文前需要空行
    'body-leading-blank': [2, 'always'],
    
    // 页脚前需要空行
    'footer-leading-blank': [2, 'always'],
  },
  
  // 提示信息
  prompt: {
    messages: {
      type: '选择提交类型:',
      subject: '简短描述此次更改:',
      body: '详细描述（可选）:',
      breaking: '列出破坏性更改（可选）:',
      footer: '关联的Issue（可选）:',
    },
    types: {
      feat: { description: '✨ 新功能', title: 'Features' },
      fix: { description: '🐛 修复Bug', title: 'Bug Fixes' },
      docs: { description: '📚 文档更新', title: 'Documentation' },
      style: { description: '💎 代码格式', title: 'Styles' },
      refactor: { description: '♻️ 代码重构', title: 'Refactors' },
      perf: { description: '⚡️ 性能优化', title: 'Performance' },
      test: { description: '✅ 测试相关', title: 'Tests' },
      build: { description: '📦 构建系统', title: 'Build' },
      ci: { description: '🎡 CI配置', title: 'CI' },
      chore: { description: '🔧 其他更改', title: 'Chores' },
      revert: { description: '⏪ 回滚提交', title: 'Reverts' },
    },
  },
};
