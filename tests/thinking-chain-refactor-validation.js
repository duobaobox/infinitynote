/**
 * 思维链重构验证脚本
 * 验证重构后的代码结构和功能完整性
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 思维链重构验证开始...\n');

// 验证文件存在性
const filesToCheck = [
  'src/components/NoteCard/index.tsx',
  'src/components/TiptapEditor/TiptapEditor.tsx',
  'src/components/TiptapEditor/ThinkingChainDisplay.tsx',
  'src/components/TiptapEditor/types/index.ts',
  'src/components/NoteCard/index.module.css',
];

console.log('📁 检查文件存在性...');
let allFilesExist = true;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ 部分文件缺失，验证失败');
  process.exit(1);
}

// 验证NoteCard组件结构
console.log('\n🔍 验证NoteCard组件结构...');
const noteCardContent = fs.readFileSync('src/components/NoteCard/index.tsx', 'utf8');

const noteCardChecks = [
  {
    name: '导入ThinkingChainDisplay',
    pattern: /import.*ThinkingChainDisplay.*from.*TiptapEditor\/ThinkingChainDisplay/,
    required: true,
  },
  {
    name: '思维链显示区域',
    pattern: /思维链显示区域.*独立层级/,
    required: true,
  },
  {
    name: 'ThinkingChainDisplay组件使用',
    pattern: /<ThinkingChainDisplay/,
    required: true,
  },
  {
    name: '思维链状态管理',
    pattern: /thinkingChainExpanded.*useState/,
    required: true,
  },
  {
    name: '思维链toggle处理',
    pattern: /handleThinkingChainToggle/,
    required: true,
  },
  {
    name: '移除TiptapEditor的AI属性',
    pattern: /aiData.*thinkingChainExpanded.*onThinkingChainToggle/,
    required: false, // 应该不存在
  },
];

let noteCardPassed = true;
for (const check of noteCardChecks) {
  const found = check.pattern.test(noteCardContent);
  if (check.required && !found) {
    console.log(`❌ ${check.name} - 未找到`);
    noteCardPassed = false;
  } else if (!check.required && found) {
    console.log(`❌ ${check.name} - 不应该存在但找到了`);
    noteCardPassed = false;
  } else {
    console.log(`✅ ${check.name}`);
  }
}

// 验证TiptapEditor组件结构
console.log('\n🔍 验证TiptapEditor组件结构...');
const tiptapContent = fs.readFileSync('src/components/TiptapEditor/TiptapEditor.tsx', 'utf8');

const tiptapChecks = [
  {
    name: '移除ThinkingChainDisplay导入',
    pattern: /import.*ThinkingChainDisplay/,
    required: false, // 应该不存在
  },
  {
    name: '移除AI相关参数',
    pattern: /aiData.*thinkingChainExpanded.*onThinkingChainToggle/,
    required: false, // 应该不存在
  },
  {
    name: '移除思维链状态管理',
    pattern: /isThinkingExpanded.*useState/,
    required: false, // 应该不存在
  },
  {
    name: '移除AI检测逻辑',
    pattern: /isAIGenerated.*useMemo/,
    required: false, // 应该不存在
  },
  {
    name: '移除思维链JSX',
    pattern: /<ThinkingChainDisplay/,
    required: false, // 应该不存在
  },
  {
    name: '保留编辑器核心功能',
    pattern: /<EditorContent/,
    required: true,
  },
];

let tiptapPassed = true;
for (const check of tiptapChecks) {
  const found = check.pattern.test(tiptapContent);
  if (check.required && !found) {
    console.log(`❌ ${check.name} - 未找到`);
    tiptapPassed = false;
  } else if (!check.required && found) {
    console.log(`❌ ${check.name} - 不应该存在但找到了`);
    tiptapPassed = false;
  } else {
    console.log(`✅ ${check.name}`);
  }
}

// 验证类型定义
console.log('\n🔍 验证类型定义...');
const typesContent = fs.readFileSync('src/components/TiptapEditor/types/index.ts', 'utf8');

const typesChecks = [
  {
    name: '移除AI相关类型导入',
    pattern: /import.*AICustomProperties/,
    required: false, // 应该不存在
  },
  {
    name: '移除AI相关属性定义',
    pattern: /aiData.*thinkingChainExpanded.*onThinkingChainToggle/,
    required: false, // 应该不存在
  },
];

let typesPassed = true;
for (const check of typesChecks) {
  const found = check.pattern.test(typesContent);
  if (check.required && !found) {
    console.log(`❌ ${check.name} - 未找到`);
    typesPassed = false;
  } else if (!check.required && found) {
    console.log(`❌ ${check.name} - 不应该存在但找到了`);
    typesPassed = false;
  } else {
    console.log(`✅ ${check.name}`);
  }
}

// 验证CSS样式
console.log('\n🔍 验证CSS样式...');
const cssContent = fs.readFileSync('src/components/NoteCard/index.module.css', 'utf8');

const cssChecks = [
  {
    name: '思维链区域样式',
    pattern: /\.thinkingChainSection/,
    required: true,
  },
];

let cssPassed = true;
for (const check of cssChecks) {
  const found = check.pattern.test(cssContent);
  if (check.required && !found) {
    console.log(`❌ ${check.name} - 未找到`);
    cssPassed = false;
  } else {
    console.log(`✅ ${check.name}`);
  }
}

// 总结
console.log('\n📊 验证结果总结:');
console.log(`📁 文件存在性: ${allFilesExist ? '✅ 通过' : '❌ 失败'}`);
console.log(`🎯 NoteCard组件: ${noteCardPassed ? '✅ 通过' : '❌ 失败'}`);
console.log(`⚙️ TiptapEditor组件: ${tiptapPassed ? '✅ 通过' : '❌ 失败'}`);
console.log(`📝 类型定义: ${typesPassed ? '✅ 通过' : '❌ 失败'}`);
console.log(`🎨 CSS样式: ${cssPassed ? '✅ 通过' : '❌ 失败'}`);

const allPassed = allFilesExist && noteCardPassed && tiptapPassed && typesPassed && cssPassed;

if (allPassed) {
  console.log('\n🎉 思维链重构验证完全通过！');
  console.log('\n✨ 重构成功要点:');
  console.log('1. ✅ 思维链组件从TiptapEditor移出到NoteCard层级');
  console.log('2. ✅ 组件职责分离：TiptapEditor专注编辑，NoteCard管理思维链');
  console.log('3. ✅ 状态管理优化：思维链状态在NoteCard层级统一管理');
  console.log('4. ✅ 类型定义清理：移除TiptapEditor中的AI相关类型');
  console.log('5. ✅ CSS布局调整：思维链独立显示区域');
  
  console.log('\n🏗️ 新的组件架构:');
  console.log('NoteCard (便签卡片)');
  console.log('├── noteHeader (便签标题容器)');
  console.log('├── ThinkingChainDisplay (思维链容器) - 独立层级');
  console.log('└── noteContent (便签内容容器)');
  console.log('    └── TiptapEditor (编辑器容器) - 专注文本编辑');
  console.log('        └── EditorContent (实际编辑内容)');
  
  process.exit(0);
} else {
  console.log('\n❌ 思维链重构验证失败，请检查上述问题');
  process.exit(1);
}
