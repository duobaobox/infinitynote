/**
 * AI自动滚动调试工具
 * 用于诊断滚动问题的详细信息
 */

interface ScrollContainerInfo {
  selector: string;
  found: boolean;
  element?: HTMLElement;
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
  overflowY?: string;
  hasScrollbar?: boolean;
  canScroll?: boolean;
}

export class AIScrollDebugger {
  private static instance: AIScrollDebugger;
  private debugEnabled = import.meta.env?.DEV ?? false;

  static getInstance() {
    if (!AIScrollDebugger.instance) {
      AIScrollDebugger.instance = new AIScrollDebugger();
    }
    return AIScrollDebugger.instance;
  }

  /**
   * 检查便签的DOM结构和滚动容器
   */
  analyzeNoteScrollStructure(noteId: string) {
    if (!this.debugEnabled) return;

    console.group(`🔍 [AI滚动调试] 便签 ${noteId.slice(-8)} 的滚动结构分析`);
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) {
      console.error('❌ 找不到便签元素');
      console.groupEnd();
      return null;
    }

    console.log('✅ 便签元素找到:', noteElement);

    // 分析所有可能的滚动容器
    const scrollContainers = [
      '.tiptap-editor-content',
      '.tiptap-editor-container', 
      '.ProseMirror',
      '.noteContent',
      '.tiptap-editor',
    ];

    const results: ScrollContainerInfo[] = scrollContainers.map(selector => {
      const element = noteElement.querySelector(selector) as HTMLElement;
      if (!element) {
        return { selector, found: false };
      }

      const computedStyle = window.getComputedStyle(element);
      const scrollInfo: ScrollContainerInfo = {
        selector,
        found: true,
        element,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        scrollTop: element.scrollTop,
        overflowY: computedStyle.overflowY,
        hasScrollbar: element.scrollHeight > element.clientHeight,
        canScroll: computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll',
      };

      console.log(`${scrollInfo.hasScrollbar && scrollInfo.canScroll ? '✅' : '❌'} ${selector}:`, scrollInfo);
      return scrollInfo;
    });

    const activeScrollContainer = results.find(r => r.found && r.hasScrollbar && r.canScroll);
    if (activeScrollContainer) {
      console.log('🎯 检测到活跃的滚动容器:', activeScrollContainer.selector);
    } else {
      console.warn('⚠️ 未找到有效的滚动容器');
    }

    console.groupEnd();
    return activeScrollContainer;
  }

  /**
   * 监控AI流式数据变化
   */
  monitorAIStreamingData(noteId: string, content: string) {
    if (!this.debugEnabled) return;

    console.log(`📡 [AI滚动调试] 便签 ${noteId.slice(-8)} 收到流式数据:`, {
      contentLength: content.length,
      contentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 测试滚动功能
   */
  testScroll(noteId: string, scrollContainer: HTMLElement) {
    if (!this.debugEnabled) return;

    console.group(`🧪 [AI滚动调试] 测试便签 ${noteId.slice(-8)} 的滚动功能`);
    
    const beforeScroll = {
      scrollTop: scrollContainer.scrollTop,
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
    };

    console.log('滚动前状态:', beforeScroll);

    // 执行滚动
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    });

    // 等待一段时间后检查结果
    setTimeout(() => {
      const afterScroll = {
        scrollTop: scrollContainer.scrollTop,
        scrollHeight: scrollContainer.scrollHeight,
        clientHeight: scrollContainer.clientHeight,
      };

      console.log('滚动后状态:', afterScroll);
      
      const scrolled = Math.abs(afterScroll.scrollTop - beforeScroll.scrollTop) > 1;
      console.log(scrolled ? '✅ 滚动成功' : '❌ 滚动失败');
      
      console.groupEnd();
    }, 500);
  }

  /**
   * 启动实时监控
   */
  startMonitoring(noteId: string) {
    if (!this.debugEnabled) return;

    console.log(`🚀 [AI滚动调试] 开始监控便签 ${noteId.slice(-8)}`);
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) {
      console.error('❌ 无法开始监控：找不到便签元素');
      return;
    }

    // 监控DOM变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('📝 [AI滚动调试] DOM内容发生变化', {
            noteId: noteId.slice(-8),
            addedNodes: mutation.addedNodes.length,
            target: mutation.target,
          });
          
          // 分析并测试滚动
          const scrollContainer = this.analyzeNoteScrollStructure(noteId);
          if (scrollContainer?.element) {
            this.testScroll(noteId, scrollContainer.element);
          }
        }
      });
    });

    observer.observe(noteElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 返回清理函数
    return () => {
      observer.disconnect();
      console.log(`🛑 [AI滚动调试] 停止监控便签 ${noteId.slice(-8)}`);
    };
  }
}

// 全局暴露调试器
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as any).aiScrollDebugger = AIScrollDebugger.getInstance();
}