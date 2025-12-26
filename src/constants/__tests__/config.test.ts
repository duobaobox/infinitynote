/**
 * 配置常量测试
 */

import { describe, it, expect } from 'vitest';
import {
  DEBOUNCE_SAVE_DELAY,
  DEBOUNCE_SEARCH_DELAY,
  NOTE_DEFAULT_WIDTH,
  NOTE_DEFAULT_HEIGHT,
  NOTE_MIN_WIDTH,
  NOTE_MIN_HEIGHT,
  CANVAS_MIN_ZOOM,
  CANVAS_MAX_ZOOM,
  CANVAS_DEFAULT_ZOOM,
  PERFORMANCE_THRESHOLD,
  MAX_CONTENT_LENGTH,
  AI_REQUEST_TIMEOUT,
  AI_MAX_RETRIES,
  AI_DEFAULT_TEMPERATURE,
  DB_NAME,
  DB_VERSION,
  NOTE_COLORS,
  AppConfig,
} from '../../constants/config';

describe('Config Constants', () => {
  describe('时间常量', () => {
    it('防抖延迟应该是合理的值', () => {
      expect(DEBOUNCE_SAVE_DELAY).toBeGreaterThan(0);
      expect(DEBOUNCE_SAVE_DELAY).toBeLessThanOrEqual(1000);
      
      expect(DEBOUNCE_SEARCH_DELAY).toBeGreaterThan(0);
      expect(DEBOUNCE_SEARCH_DELAY).toBeLessThanOrEqual(500);
    });
  });

  describe('尺寸常量', () => {
    it('便签尺寸应该是有效值', () => {
      expect(NOTE_DEFAULT_WIDTH).toBeGreaterThan(NOTE_MIN_WIDTH);
      expect(NOTE_DEFAULT_HEIGHT).toBeGreaterThan(NOTE_MIN_HEIGHT);
      expect(NOTE_MIN_WIDTH).toBeGreaterThan(0);
      expect(NOTE_MIN_HEIGHT).toBeGreaterThan(0);
    });
  });

  describe('画布常量', () => {
    it('缩放范围应该是有效的', () => {
      expect(CANVAS_MIN_ZOOM).toBeGreaterThan(0);
      expect(CANVAS_MIN_ZOOM).toBeLessThan(1);
      expect(CANVAS_MAX_ZOOM).toBeGreaterThan(1);
      expect(CANVAS_DEFAULT_ZOOM).toBe(1);
      expect(CANVAS_DEFAULT_ZOOM).toBeGreaterThanOrEqual(CANVAS_MIN_ZOOM);
      expect(CANVAS_DEFAULT_ZOOM).toBeLessThanOrEqual(CANVAS_MAX_ZOOM);
    });
  });

  describe('性能常量', () => {
    it('性能阈值应该是16ms（60fps）', () => {
      expect(PERFORMANCE_THRESHOLD).toBe(16);
    });

    it('最大内容长度应该是合理的', () => {
      expect(MAX_CONTENT_LENGTH).toBeGreaterThan(10000);
    });
  });

  describe('AI常量', () => {
    it('AI配置应该是有效值', () => {
      expect(AI_REQUEST_TIMEOUT).toBeGreaterThan(10000);
      expect(AI_MAX_RETRIES).toBeGreaterThanOrEqual(1);
      expect(AI_MAX_RETRIES).toBeLessThanOrEqual(5);
      expect(AI_DEFAULT_TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(AI_DEFAULT_TEMPERATURE).toBeLessThanOrEqual(2);
    });
  });

  describe('存储常量', () => {
    it('数据库配置应该有效', () => {
      expect(DB_NAME).toBe('InfinityNoteDB');
      expect(DB_VERSION).toBeGreaterThanOrEqual(1);
    });
  });

  describe('颜色常量', () => {
    it('应该有预定义的便签颜色', () => {
      expect(NOTE_COLORS).toBeInstanceOf(Array);
      expect(NOTE_COLORS.length).toBeGreaterThan(0);
      
      // 检查颜色格式
      NOTE_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('AppConfig', () => {
    it('应该包含应用配置', () => {
      expect(AppConfig).toBeDefined();
      expect(typeof AppConfig.isDev).toBe('boolean');
      expect(typeof AppConfig.isProd).toBe('boolean');
      expect(AppConfig.version).toBeDefined();
      expect(AppConfig.appName).toBeDefined();
    });
  });
});
