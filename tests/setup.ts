/**
 * Vitest 测试环境设置文件
 * 在每个测试文件运行前自动执行
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

// 全局Mock设置
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock getComputedStyle
  window.getComputedStyle = vi.fn().mockReturnValue({
    getPropertyValue: vi.fn().mockReturnValue(''),
  });

  // Mock IndexedDB for Dexie
  const indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  };
  Object.defineProperty(window, 'indexedDB', {
    value: indexedDB,
    writable: true,
  });

  // Mock Electron API
  Object.defineProperty(window, 'electronAPI', {
    value: {
      onMenuAction: vi.fn(),
      removeMenuActionListener: vi.fn(),
      getFloatingNoteData: vi.fn(),
      sendFloatingNoteUpdate: vi.fn(),
    },
    writable: true,
  });
});

// Mock console methods in production-like tests
// Uncomment if needed:
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
