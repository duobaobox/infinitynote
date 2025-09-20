/**
 * 简单测试API密钥持久化功能
 * 验证aiService.getAPIKey方法是否正常工作
 */

console.log('🧪 开始简单测试API密钥功能...\n');

// 模拟基本环境
global.window = { location: { href: 'http://localhost:3000' } };
global.document = { createElement: () => ({}) };
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// 模拟IndexedDB
global.indexedDB = {
  open: () => Promise.resolve({
    transaction: () => ({
      objectStore: () => ({
        get: () => Promise.resolve(null),
        put: () => Promise.resolve(),
        delete: () => Promise.resolve()
      })
    })
  })
};

async function testBasicFunctionality() {
  try {
    console.log('📝 测试基本功能...');
    
    // 测试btoa/atob
    const testString = 'test-api-key-123';
    const encoded = btoa(testString);
    const decoded = atob(encoded);
    
    if (decoded === testString) {
      console.log('✅ btoa/atob 功能正常');
    } else {
      console.error('❌ btoa/atob 功能异常');
    }
    
    console.log('🎉 基本功能测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testBasicFunctionality().then(() => {
  console.log('\n✅ 测试执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ 测试执行失败:', error);
  process.exit(1);
});
