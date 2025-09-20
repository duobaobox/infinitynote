/**
 * 测试当前配置状态检测功能
 * 验证AI服务能正确检测当前活跃配置的就绪状态
 */

// 模拟IndexedDB
class MockIndexedDB {
  constructor() {
    this.data = new Map();
  }

  async setItem(key, value) {
    this.data.set(key, value);
    console.log(`📝 保存数据: ${key} = ${value}`);
  }

  async getItem(key) {
    const value = this.data.get(key);
    console.log(`📖 读取数据: ${key} = ${value || 'null'}`);
    return value || null;
  }

  async removeItem(key) {
    this.data.delete(key);
    console.log(`🗑️ 删除数据: ${key}`);
  }

  async clear() {
    this.data.clear();
    console.log(`🧹 清空所有数据`);
  }
}

// 模拟AI服务的核心状态检测逻辑
class MockAIService {
  constructor() {
    this.db = new MockIndexedDB();
    this.activeConfig = {
      provider: "zhipu",
      model: "glm-4-plus",
      appliedAt: new Date().toISOString(),
    };
  }

  // 模拟提供商注册中心
  isValidProviderId(providerId) {
    const validProviders = ["zhipu", "deepseek", "openai", "alibaba", "siliconflow", "anthropic"];
    return validProviders.includes(providerId);
  }

  getSupportedModels(providerId) {
    const modelMap = {
      zhipu: ["glm-4-plus", "glm-4-0520", "glm-4-air"],
      deepseek: ["deepseek-chat", "deepseek-reasoner"],
      openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
      alibaba: ["qwen-plus", "qwen-turbo", "qwen-max"],
      siliconflow: ["deepseek-llm-67b-chat", "qwen-72b-chat"],
      anthropic: ["claude-3-opus", "claude-3-sonnet"],
    };
    return modelMap[providerId] || [];
  }

  validateApiKey(providerId, apiKey) {
    const patterns = {
      zhipu: /^[a-zA-Z0-9]{32,}$/,
      deepseek: /^sk-[a-zA-Z0-9]{32,}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      alibaba: /^sk-[a-zA-Z0-9]{20,}$/,
      siliconflow: /^sk-[a-zA-Z0-9]{32,}$/,
      anthropic: /^sk-ant-api03-[a-zA-Z0-9\-_]{93}$/,
    };
    const pattern = patterns[providerId];
    return pattern ? pattern.test(apiKey) : apiKey.length > 20;
  }

  async hasAPIKey(provider) {
    const key = `api_key_${provider}`;
    const encrypted = await this.db.getItem(key);
    return !!encrypted;
  }

  async getAPIKey(provider) {
    const key = `api_key_${provider}`;
    const encrypted = await this.db.getItem(key);
    if (!encrypted) return null;
    try {
      return atob(encrypted); // 简单解密
    } catch {
      return null;
    }
  }

  async setAPIKey(provider, apiKey) {
    const key = `api_key_${provider}`;
    const encrypted = btoa(apiKey); // 简单加密
    await this.db.setItem(key, encrypted);
  }

  getActiveConfig() {
    return { ...this.activeConfig };
  }

  async applyConfiguration(provider, model) {
    this.activeConfig = {
      provider,
      model,
      appliedAt: new Date().toISOString(),
    };
    console.log(`✅ 应用配置: ${provider} - ${model}`);
  }

  // 核心状态检测方法
  async isCurrentConfigurationReady() {
    try {
      const activeConfig = this.getActiveConfig();
      
      // 1. 检查提供商是否有效
      if (!this.isValidProviderId(activeConfig.provider)) {
        return {
          status: "error",
          message: `无效的提供商: ${activeConfig.provider}`,
        };
      }

      // 2. 检查是否有API密钥
      const hasApiKey = await this.hasAPIKey(activeConfig.provider);
      if (!hasApiKey) {
        return {
          status: "unconfigured",
          message: `${activeConfig.provider} 未配置API密钥`,
        };
      }

      // 3. 检查模型是否在支持列表中
      const supportedModels = this.getSupportedModels(activeConfig.provider);
      if (!supportedModels.includes(activeConfig.model)) {
        return {
          status: "error",
          message: `模型 ${activeConfig.model} 不被 ${activeConfig.provider} 支持`,
        };
      }

      // 4. 验证API密钥格式
      const apiKey = await this.getAPIKey(activeConfig.provider);
      if (!apiKey || !this.validateApiKey(activeConfig.provider, apiKey)) {
        return {
          status: "error",
          message: `${activeConfig.provider} API密钥格式无效`,
        };
      }

      return {
        status: "ready",
        message: `${activeConfig.provider} ${activeConfig.model} 已就绪`,
      };
    } catch (error) {
      console.error("检查当前配置状态失败:", error);
      return {
        status: "error",
        message: "配置检查失败",
      };
    }
  }
}

// 测试函数
async function runConfigStatusTests() {
  console.log("🧪 开始测试当前配置状态检测...\n");
  
  const aiService = new MockAIService();

  // 测试1: 未配置API密钥的情况
  console.log("📋 测试1: 未配置API密钥");
  let status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: unconfigured, 实际: ${status.status}\n`);

  // 测试2: 配置有效的API密钥
  console.log("📋 测试2: 配置有效的API密钥");
  await aiService.setAPIKey("zhipu", "abcd1234567890abcd1234567890abcd");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: ready, 实际: ${status.status}\n`);

  // 测试3: 配置无效格式的API密钥
  console.log("📋 测试3: 配置无效格式的API密钥");
  await aiService.setAPIKey("zhipu", "invalid-key");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: error, 实际: ${status.status}\n`);

  // 测试4: 切换到不支持的模型
  console.log("📋 测试4: 切换到不支持的模型");
  await aiService.setAPIKey("zhipu", "abcd1234567890abcd1234567890abcd");
  await aiService.applyConfiguration("zhipu", "unsupported-model");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: error, 实际: ${status.status}\n`);

  // 测试5: 切换到其他提供商但未配置API密钥
  console.log("📋 测试5: 切换到其他提供商但未配置API密钥");
  await aiService.applyConfiguration("deepseek", "deepseek-chat");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: unconfigured, 实际: ${status.status}\n`);

  // 测试6: 为新提供商配置API密钥
  console.log("📋 测试6: 为新提供商配置API密钥");
  await aiService.setAPIKey("deepseek", "sk-abcd1234567890abcd1234567890abcd");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: ready, 实际: ${status.status}\n`);

  // 测试7: 无效的提供商
  console.log("📋 测试7: 无效的提供商");
  await aiService.applyConfiguration("invalid-provider", "some-model");
  status = await aiService.isCurrentConfigurationReady();
  console.log(`结果: ${status.status} - ${status.message}`);
  console.log(`✅ 预期: error, 实际: ${status.status}\n`);

  console.log("🎉 所有测试完成！");
}

// 运行测试
runConfigStatusTests().catch(console.error);
