import { useCallback, useRef } from 'react';
import { AIScrollDebugger } from '../utils/aiScrollDebugger';

/**
 * 简化的AI自动滚动Hook
 * 专门解决AI生成时的滚动问题，带调试功能
 */
export const useSimpleAIAutoScroll = () => {
  const scrollingRef = useRef(false);
  
  /**
   * 执行自动滚动
   */
  const performAutoScroll = useCallback((noteId: string) => {
    if (scrollingRef.current) return;
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`) as HTMLElement;
    if (!noteElement) {
      console.warn(`[AI滚动] 找不到便签元素: ${noteId}`);
      return;
    }

    scrollingRef.current = true;
    
    // 调试分析
    const scrollDebugger = AIScrollDebugger.getInstance();
    scrollDebugger.analyzeNoteScrollStructure(noteId);
    
    // 按优先级尝试不同的滚动容器
    const selectors = [
      '.ProseMirror',              // ProseMirror编辑器内容（最重要的滚动容器）
      '.tiptap-editor-content .ProseMirror',  // 完整路径的ProseMirror
      '.tiptap-editor-content', 
      '.tiptap-editor',
      '.noteContent'
    ];
    
    let scrolled = false;
    
    for (const selector of selectors) {
      const container = noteElement.querySelector(selector) as HTMLElement;
      if (!container) continue;
      
      const style = window.getComputedStyle(container);
      const hasOverflow = ['auto', 'scroll'].includes(style.overflowY) || ['auto', 'scroll'].includes(style.overflow);
      const canScroll = container.scrollHeight > container.clientHeight;
      
      console.log(`[AI滚动] 检查容器 ${selector}:`, {
        element: container,
        hasOverflow,
        canScroll,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
      
      if (hasOverflow && canScroll) {
        console.log(`[AI滚动] 开始滚动容器: ${selector}`);
        
        // 立即滚动
        container.scrollTop = container.scrollHeight;
        
        // 平滑滚动作为补充
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
        
        scrolled = true;
        break;
      }
    }
    
    // 如果都没找到，尝试便签元素本身
    if (!scrolled && noteElement.scrollHeight > noteElement.clientHeight) {
      console.log('[AI滚动] 使用便签元素本身');
      noteElement.scrollTop = noteElement.scrollHeight;
      noteElement.scrollTo({
        top: noteElement.scrollHeight,
        behavior: 'smooth'
      });
      scrolled = true;
    }
    
    if (!scrolled) {
      console.warn(`[AI滚动] 无法找到可滚动的容器: ${noteId}`);
    }
    
    // 延迟重置，允许下次滚动
    setTimeout(() => {
      scrollingRef.current = false;
    }, 100);
  }, []);

  return { performAutoScroll };
};