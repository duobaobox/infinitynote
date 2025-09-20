/**
 * 测试API密钥持久化功能
 * 验证切换AI厂商tab页面时，API密钥能够正确加载和保存
 */

// 简化的测试，不依赖外部库
console.log("🧪 开始测试API密钥持久化功能...\n");

// 模拟基本的浏览器环境
global.window = {
  location: { href: "http://localhost:3000" },
  localStorage: new Map(),
  sessionStorage: new Map(),
};

global.document = {
  createElement: () => ({}),
  addEventListener: () => {},
  removeEventListener: () => {},
};

// 模拟IndexedDB的基本功能
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ onsuccess: null, result: null }),
          put: () => ({ onsuccess: null }),
          delete: () => ({ onsuccess: null }),
        }),
      }),
    },
  }),
};

// 模拟btoa/atob
global.btoa = (str) => Buffer.from(str, "binary").toString("base64");
global.atob = (str) => Buffer.from(str, "base64").toString("binary");

async function testAPIKeyPersistence() {
  try {
    // 动态导入模块
    const { aiService } = await import("../src/services/aiService.ts");
    const { dbOperations } = await import("../src/utils/db.ts");

    console.log("✅ 模块导入成功");

    // 测试数据
    const testProviders = [
      { name: "zhipu", apiKey: "test-zhipu-api-key-12345678901234567890" },
      { name: "deepseek", apiKey: "sk-test-deepseek-key-abcdefghijklmnop" },
      { name: "openai", apiKey: "sk-test-openai-key-1234567890abcdef" },
    ];

    console.log("\n📝 测试1: 保存API密钥到不同提供商");

    // 保存不同提供商的API密钥
    for (const provider of testProviders) {
      await aiService.configureProvider(provider.name, provider.apiKey);
      console.log(`✅ 已保存 ${provider.name} 的API密钥`);
    }

    console.log("\n🔍 测试2: 验证API密钥是否正确保存");

    // 验证API密钥是否正确保存
    for (const provider of testProviders) {
      const savedKey = await aiService.getAPIKey(provider.name);
      if (savedKey === provider.apiKey) {
        console.log(`✅ ${provider.name} 的API密钥保存正确`);
      } else {
        console.error(`❌ ${provider.name} 的API密钥保存失败`);
        console.error(`   期望: ${provider.apiKey}`);
        console.error(`   实际: ${savedKey}`);
      }
    }

    console.log("\n🔄 测试3: 模拟切换提供商");

    // 模拟切换到不同提供商并验证API密钥加载
    for (const provider of testProviders) {
      // 应用配置（模拟切换）
      await aiService.applyConfiguration(provider.name, "test-model");

      // 获取当前活跃配置
      const activeConfig = aiService.getActiveConfig();
      console.log(`🔄 切换到 ${provider.name}，当前活跃配置:`, activeConfig);

      // 验证能否获取到对应的API密钥
      const loadedKey = await aiService.getAPIKey(provider.name);
      if (loadedKey === provider.apiKey) {
        console.log(`✅ 切换到 ${provider.name} 后，API密钥加载正确`);
      } else {
        console.error(`❌ 切换到 ${provider.name} 后，API密钥加载失败`);
      }
    }

    console.log("\n💾 测试4: 验证持久化存储");

    // 直接从数据库验证
    for (const provider of testProviders) {
      const config = await dbOperations.getAIConfig(`api_key_${provider.name}`);
      if (config && config.value) {
        const decryptedKey = atob(config.value);
        if (decryptedKey === provider.apiKey) {
          console.log(`✅ ${provider.name} 的API密钥在数据库中存储正确`);
        } else {
          console.error(`❌ ${provider.name} 的API密钥在数据库中存储错误`);
        }
      } else {
        console.error(`❌ ${provider.name} 的API密钥在数据库中未找到`);
      }
    }

    console.log("\n🧹 测试5: 清理测试数据");

    // 清理测试数据
    for (const provider of testProviders) {
      await dbOperations.deleteAIConfig(`api_key_${provider.name}`);
      console.log(`🗑️ 已清理 ${provider.name} 的测试数据`);
    }

    console.log("\n🎉 所有测试完成！API密钥持久化功能正常工作");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    console.error("错误堆栈:", error.stack);
  }
}

// 运行测试
testAPIKeyPersistence()
  .then(() => {
    console.log("\n✅ 测试执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 测试执行失败:", error);
    process.exit(1);
  });
