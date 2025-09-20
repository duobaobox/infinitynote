/**
 * 思维链重构后的集成测试
 * 验证思维链从TiptapEditor移出到NoteCard层级后的功能
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteCard } from '../index';
import type { Note } from '../../../types';
import type { AICustomProperties } from '../../../types/ai';

// Mock dependencies
jest.mock('../../../store/noteStore', () => ({
  useNoteStore: () => ({
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    moveNote: jest.fn(),
    resizeNote: jest.fn(),
    startAIGeneration: jest.fn(),
    aiGenerating: {},
    aiStreamingData: {},
  }),
}));

jest.mock('../../../theme', () => ({
  useTheme: () => ({ isDark: false }),
  noteColorThemes: {
    yellow: { background: '#fff', border: '#ccc' },
  },
}));

jest.mock('../../../utils/dragOptimization', () => ({
  useOptimizedNoteDrag: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}));

// 创建测试用的便签数据
const createTestNote = (aiData?: AICustomProperties['ai']): Note => ({
  id: 'test-note-1',
  title: 'Test Note',
  content: '<p>Test content</p>',
  position: { x: 100, y: 100 },
  size: { width: 300, height: 200 },
  color: 'yellow',
  zIndex: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customProperties: aiData ? { ai: aiData } : undefined,
});

describe('NoteCard - 思维链重构集成测试', () => {
  const mockOnSelect = jest.fn();
  const mockOnResize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('普通便签不显示思维链', () => {
    const note = createTestNote();
    
    render(
      <NoteCard
        note={note}
        isSelected={false}
        onSelect={mockOnSelect}
        onResize={mockOnResize}
      />
    );

    // 不应该显示思维链相关元素
    expect(screen.queryByText('思考过程')).not.toBeInTheDocument();
    expect(screen.queryByText('正在思考')).not.toBeInTheDocument();
  });

  test('AI便签显示思维链区域', () => {
    const aiData: AICustomProperties['ai'] = {
      generated: true,
      model: 'test-model',
      provider: 'test-provider',
      generatedAt: new Date().toISOString(),
      prompt: 'test prompt',
      requestId: 'test-request',
      showThinking: true,
      thinkingCollapsed: false,
      thinkingChain: {
        steps: [
          {
            id: 'step-1',
            content: '这是第一步思考',
            timestamp: Date.now(),
          },
        ],
        summary: '通过1步推理完成',
        totalSteps: 1,
      },
    };

    const note = createTestNote(aiData);
    
    render(
      <NoteCard
        note={note}
        isSelected={false}
        onSelect={mockOnSelect}
        onResize={mockOnResize}
      />
    );

    // 应该显示思维链
    expect(screen.getByText('思考过程')).toBeInTheDocument();
    expect(screen.getByText('这是第一步思考')).toBeInTheDocument();
  });

  test('思维链折叠/展开功能', () => {
    const aiData: AICustomProperties['ai'] = {
      generated: true,
      model: 'test-model',
      provider: 'test-provider',
      generatedAt: new Date().toISOString(),
      prompt: 'test prompt',
      requestId: 'test-request',
      showThinking: true,
      thinkingCollapsed: true, // 初始折叠
      thinkingChain: {
        steps: [
          {
            id: 'step-1',
            content: '这是第一步思考',
            timestamp: Date.now(),
          },
        ],
        summary: '通过1步推理完成',
        totalSteps: 1,
      },
    };

    const note = createTestNote(aiData);
    
    render(
      <NoteCard
        note={note}
        isSelected={false}
        onSelect={mockOnSelect}
        onResize={mockOnResize}
      />
    );

    // 初始状态应该是折叠的
    expect(screen.getByText('思考过程')).toBeInTheDocument();
    expect(screen.queryByText('这是第一步思考')).not.toBeInTheDocument();

    // 点击展开
    fireEvent.click(screen.getByText('思考过程'));
    
    // 应该显示思考内容
    expect(screen.getByText('这是第一步思考')).toBeInTheDocument();
  });

  test('showThinking为false时不显示思维链', () => {
    const aiData: AICustomProperties['ai'] = {
      generated: true,
      model: 'test-model',
      provider: 'test-provider',
      generatedAt: new Date().toISOString(),
      prompt: 'test prompt',
      requestId: 'test-request',
      showThinking: false, // 不显示思维链
      thinkingChain: {
        steps: [
          {
            id: 'step-1',
            content: '这是第一步思考',
            timestamp: Date.now(),
          },
        ],
        summary: '通过1步推理完成',
        totalSteps: 1,
      },
    };

    const note = createTestNote(aiData);
    
    render(
      <NoteCard
        note={note}
        isSelected={false}
        onSelect={mockOnSelect}
        onResize={mockOnResize}
      />
    );

    // 不应该显示思维链
    expect(screen.queryByText('思考过程')).not.toBeInTheDocument();
    expect(screen.queryByText('这是第一步思考')).not.toBeInTheDocument();
  });

  test('流式生成状态显示', () => {
    const aiData: AICustomProperties['ai'] = {
      generated: false,
      model: 'test-model',
      provider: 'test-provider',
      generatedAt: new Date().toISOString(),
      prompt: 'test prompt',
      requestId: 'test-request',
      showThinking: true,
      isStreaming: true, // 正在流式生成
    };

    const note = createTestNote(aiData);
    
    render(
      <NoteCard
        note={note}
        isSelected={false}
        onSelect={mockOnSelect}
        onResize={mockOnResize}
      />
    );

    // 应该显示流式生成状态
    expect(screen.getByText('正在思考')).toBeInTheDocument();
  });
});
