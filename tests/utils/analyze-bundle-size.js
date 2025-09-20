/**
 * 包大小分析脚本
 * 分析重构后的包大小优化效果
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 开始包大小分析...\n');

// 分析dist目录
const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.log('❌ dist目录不存在，请先运行 npm run build');
  process.exit(1);
}

// 获取文件大小（字节）
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 分析JS文件
console.log('📊 JavaScript文件分析:');
const jsPath = path.join(distPath, 'js');
const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));

let totalJSSize = 0;
const jsAnalysis = [];

jsFiles.forEach(file => {
  const filePath = path.join(jsPath, file);
  const size = getFileSize(filePath);
  totalJSSize += size;
  
  // 分析文件类型
  let category = '其他';
  if (file.includes('vendor')) {
    if (file.includes('react')) category = 'React核心';
    else if (file.includes('ui')) category = 'UI组件库';
    else if (file.includes('editor')) category = '编辑器';
    else if (file.includes('utils')) category = '工具库';
    else if (file.includes('dnd')) category = '拖拽库';
    else if (file.includes('router')) category = '路由';
    else category = '第三方库';
  } else if (file.includes('Provider')) {
    category = 'AI提供商';
  } else if (file.includes('BaseAI')) {
    category = 'AI基础类';
  } else if (file.includes('index')) {
    category = '主应用';
  } else if (file.includes('notePositioning')) {
    category = '工具模块';
  }
  
  jsAnalysis.push({
    file,
    size,
    category,
    formatted: formatSize(size)
  });
});

// 按大小排序
jsAnalysis.sort((a, b) => b.size - a.size);

// 按类别分组统计
const categoryStats = {};
jsAnalysis.forEach(item => {
  if (!categoryStats[item.category]) {
    categoryStats[item.category] = { size: 0, count: 0, files: [] };
  }
  categoryStats[item.category].size += item.size;
  categoryStats[item.category].count++;
  categoryStats[item.category].files.push(item.file);
});

console.log('\n📋 按文件大小排序:');
jsAnalysis.forEach((item, index) => {
  const icon = index < 3 ? '🔴' : index < 6 ? '🟡' : '🟢';
  console.log(`${icon} ${item.file.padEnd(35)} ${item.formatted.padStart(10)} (${item.category})`);
});

console.log('\n📊 按类别统计:');
Object.entries(categoryStats)
  .sort(([,a], [,b]) => b.size - a.size)
  .forEach(([category, stats]) => {
    const percentage = ((stats.size / totalJSSize) * 100).toFixed(1);
    console.log(`📁 ${category.padEnd(15)} ${formatSize(stats.size).padStart(10)} (${percentage}%) - ${stats.count}个文件`);
  });

// 分析CSS文件
console.log('\n🎨 CSS文件分析:');
const cssPath = path.join(distPath, 'css');
let totalCSSSize = 0;

if (fs.existsSync(cssPath)) {
  const cssFiles = fs.readdirSync(cssPath).filter(file => file.endsWith('.css'));
  cssFiles.forEach(file => {
    const filePath = path.join(cssPath, file);
    const size = getFileSize(filePath);
    totalCSSSize += size;
    console.log(`📄 ${file.padEnd(35)} ${formatSize(size).padStart(10)}`);
  });
}

// 总体统计
console.log('\n📈 总体统计:');
console.log(`📦 JavaScript总大小: ${formatSize(totalJSSize)}`);
console.log(`🎨 CSS总大小: ${formatSize(totalCSSSize)}`);
console.log(`📊 总包大小: ${formatSize(totalJSSize + totalCSSSize)}`);
console.log(`📁 JavaScript文件数: ${jsFiles.length}`);

// 优化效果分析
console.log('\n🚀 优化效果分析:');

// AI提供商懒加载效果
const aiProviderFiles = jsAnalysis.filter(item => item.category === 'AI提供商');
const aiProviderTotalSize = aiProviderFiles.reduce((sum, item) => sum + item.size, 0);
console.log(`🤖 AI提供商文件: ${aiProviderFiles.length}个，总大小: ${formatSize(aiProviderTotalSize)}`);
console.log(`   平均大小: ${formatSize(aiProviderTotalSize / aiProviderFiles.length)}`);

// 代码分割效果
const vendorFiles = jsAnalysis.filter(item => item.category.includes('库') || item.category.includes('React') || item.category.includes('UI') || item.category.includes('编辑器'));
const vendorTotalSize = vendorFiles.reduce((sum, item) => sum + item.size, 0);
const vendorPercentage = ((vendorTotalSize / totalJSSize) * 100).toFixed(1);
console.log(`📚 第三方库文件: ${vendorFiles.length}个，总大小: ${formatSize(vendorTotalSize)} (${vendorPercentage}%)`);

// 主应用大小
const mainAppFiles = jsAnalysis.filter(item => item.category === '主应用');
const mainAppSize = mainAppFiles.reduce((sum, item) => sum + item.size, 0);
const mainAppPercentage = ((mainAppSize / totalJSSize) * 100).toFixed(1);
console.log(`🏠 主应用文件: ${mainAppFiles.length}个，总大小: ${formatSize(mainAppSize)} (${mainAppPercentage}%)`);

// 性能建议
console.log('\n💡 性能建议:');

if (totalJSSize > 3 * 1024 * 1024) { // 3MB
  console.log('⚠️  总包大小较大，建议进一步优化');
} else {
  console.log('✅ 总包大小在合理范围内');
}

const largeFiles = jsAnalysis.filter(item => item.size > 500 * 1024); // 500KB
if (largeFiles.length > 0) {
  console.log(`⚠️  发现${largeFiles.length}个大文件(>500KB)，建议进一步分割:`);
  largeFiles.forEach(file => {
    console.log(`   - ${file.file} (${file.formatted})`);
  });
} else {
  console.log('✅ 没有发现过大的单个文件');
}

// AI提供商懒加载验证
if (aiProviderFiles.every(file => file.size < 10 * 1024)) { // 10KB
  console.log('✅ AI提供商懒加载效果良好，所有提供商文件都很小');
} else {
  console.log('⚠️  部分AI提供商文件较大，可能需要进一步优化');
}

// 估算加载性能
const estimatedLoadTime = {
  '3G': Math.ceil(totalJSSize / (1.5 * 1024 * 1024 / 8)), // 1.5Mbps
  '4G': Math.ceil(totalJSSize / (10 * 1024 * 1024 / 8)),  // 10Mbps
  'WiFi': Math.ceil(totalJSSize / (50 * 1024 * 1024 / 8)) // 50Mbps
};

console.log('\n⏱️  估算加载时间:');
console.log(`📱 3G网络: ~${estimatedLoadTime['3G']}秒`);
console.log(`📱 4G网络: ~${estimatedLoadTime['4G']}秒`);
console.log(`🏠 WiFi: ~${estimatedLoadTime['WiFi']}秒`);

console.log('\n🎉 包大小分析完成！');
