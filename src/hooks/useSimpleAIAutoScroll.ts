import { useCallback, useRef } from 'react';

/**
 * 简化的AI自动滚动Hook
 * 专门解决AI生成时的滚动问题
 */
export const useSimpleAIAutoScroll = () => {
  const scrollingRef = useRef(false);
  
  /**
   * 执行自动滚动到便签编辑器的末尾
   */
  const performAutoScroll = useCallback((noteId: string) => {
    if (scrollingRef.current) return;
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`) as HTMLElement;
    if (!noteElement) {
      console.warn(`[AI滚动] 找不到便签元素: ${noteId}`);
      return;
    }

    scrollingRef.current = true;
    
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
      
      if (hasOverflow && canScroll) {
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