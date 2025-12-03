/**
 * ESLint 配置文件
 * 增强版配置，包含更严格的代码质量规则
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  // 全局忽略
  globalIgnores(['dist', 'release', 'coverage', 'node_modules', '*.cjs']),
  
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // ============================================
      // TypeScript 规则
      // ============================================
      
      // 禁止使用any（警告级别，逐步修复）
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 禁止未使用的变量（忽略下划线开头的）
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      
      // 禁止空函数（允许箭头函数）
      '@typescript-eslint/no-empty-function': ['warn', {
        allow: ['arrowFunctions'],
      }],
      
      // ============================================
      // React 规则
      // ============================================
      
      // React Refresh 规则
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],
      
      // ============================================
      // 代码质量规则
      // ============================================
      
      // 限制console使用（允许warn和error）
      'no-console': ['warn', {
        allow: ['warn', 'error'],
      }],
      
      // 禁止debugger
      'no-debugger': 'warn',
      
      // 禁止alert
      'no-alert': 'warn',
      
      // 要求使用const/let，禁止var
      'no-var': 'error',
      
      // 优先使用const
      'prefer-const': 'warn',
      
      // 禁止重复导入
      'no-duplicate-imports': 'error',
      
      // ============================================
      // 代码风格规则
      // ============================================
      
      // 强制使用模板字符串
      'prefer-template': 'warn',
      
      // 对象简写
      'object-shorthand': ['warn', 'always'],
      
      // ============================================
      // 复杂度控制（警告级别）
      // ============================================
      
      // 限制函数行数
      'max-lines-per-function': ['warn', {
        max: 200,
        skipBlankLines: true,
        skipComments: true,
      }],
      
      // 限制嵌套深度
      'max-depth': ['warn', 4],
      
      // 限制函数参数个数
      'max-params': ['warn', 5],
    },
  },
  
  // 测试文件特殊规则
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off',
    },
  },
  
  // 配置文件特殊规则
  {
    files: ['*.config.{js,ts}', 'vite.config.ts', 'vitest.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);

