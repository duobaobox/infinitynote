/**
 * 安全存储服务
 * 
 * 使用 Electron 的 safeStorage API 安全存储敏感数据（如 API 密钥）
 * 在非 Electron 环境下回退到加密的 localStorage
 */

import { dbLogger } from './logger';

// 检测是否在 Electron 环境
const isElectron = typeof window !== 'undefined' && 
  (window as unknown as { isElectron?: boolean }).isElectron === true;

// 加密密钥（用于非 Electron 环境的简单加密）
const ENCRYPTION_KEY = 'infinitynote_secure_key_v1';

/**
 * 简单的 XOR 加密（用于非 Electron 环境）
 * 注意：这不是安全的加密方式，仅用于混淆
 */
function simpleEncrypt(text: string): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result.push(String.fromCharCode(charCode));
  }
  return btoa(result.join(''));
}

/**
 * 简单的 XOR 解密
 */
function simpleDecrypt(encoded: string): string {
  try {
    const text = atob(encoded);
    const result: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result.push(String.fromCharCode(charCode));
    }
    return result.join('');
  } catch {
    return '';
  }
}

/**
 * 安全存储类
 */
class SecureStorage {
  private static instance: SecureStorage;
  private cache: Map<string, string> = new Map();

  private constructor() {
    // 私有构造函数，单例模式
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * 安全存储数据
   */
  async set(key: string, value: string): Promise<void> {
    const storageKey = `secure_${key}`;
    
    try {
      if (isElectron && window.electronAPI?.secureStorage) {
        // 使用 Electron safeStorage
        await window.electronAPI.secureStorage.set(key, value);
        dbLogger.debug(`使用 safeStorage 存储: ${key}`);
      } else {
        // 回退到加密 localStorage
        const encrypted = simpleEncrypt(value);
        localStorage.setItem(storageKey, encrypted);
        dbLogger.debug(`使用加密 localStorage 存储: ${key}`);
      }
      
      // 更新缓存
      this.cache.set(key, value);
    } catch (error) {
      dbLogger.error(`安全存储失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 安全读取数据
   */
  async get(key: string): Promise<string | null> {
    // 先检查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    const storageKey = `secure_${key}`;
    
    try {
      let value: string | null = null;
      
      if (isElectron && window.electronAPI?.secureStorage) {
        // 使用 Electron safeStorage
        value = await window.electronAPI.secureStorage.get(key);
      } else {
        // 回退到加密 localStorage
        const encrypted = localStorage.getItem(storageKey);
        if (encrypted) {
          value = simpleDecrypt(encrypted);
        }
      }
      
      // 更新缓存
      if (value) {
        this.cache.set(key, value);
      }
      
      return value;
    } catch (error) {
      dbLogger.error(`安全读取失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除安全存储的数据
   */
  async remove(key: string): Promise<void> {
    const storageKey = `secure_${key}`;
    
    try {
      if (isElectron && window.electronAPI?.secureStorage) {
        await window.electronAPI.secureStorage.remove(key);
      } else {
        localStorage.removeItem(storageKey);
      }
      
      // 清除缓存
      this.cache.delete(key);
    } catch (error) {
      dbLogger.error(`安全删除失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 检查是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null && value !== '';
  }

  /**
   * 清除所有安全存储
   */
  async clear(): Promise<void> {
    try {
      if (isElectron && window.electronAPI?.secureStorage) {
        await window.electronAPI.secureStorage.clear();
      } else {
        // 清除所有 secure_ 开头的 localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('secure_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // 清除缓存
      this.cache.clear();
    } catch (error) {
      dbLogger.error('清除安全存储失败', error);
      throw error;
    }
  }
}

// 导出单例实例
export const secureStorage = SecureStorage.getInstance();

// API 密钥专用存储函数
export const apiKeyStorage = {
  /**
   * 存储 API 密钥
   */
  async setAPIKey(provider: string, key: string): Promise<void> {
    await secureStorage.set(`api_key_${provider}`, key);
  },

  /**
   * 获取 API 密钥
   */
  async getAPIKey(provider: string): Promise<string | null> {
    return secureStorage.get(`api_key_${provider}`);
  },

  /**
   * 删除 API 密钥
   */
  async removeAPIKey(provider: string): Promise<void> {
    await secureStorage.remove(`api_key_${provider}`);
  },

  /**
   * 检查是否存在 API 密钥
   */
  async hasAPIKey(provider: string): Promise<boolean> {
    return secureStorage.has(`api_key_${provider}`);
  },
};

export default secureStorage;
