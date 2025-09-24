import React, { useEffect, useState } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { AIScrollDebugger } from '../../utils/aiScrollDebugger';

/**
 * AI滚动调试面板
 * 用于实时监控滚动状态和问题诊断
 */
export const AIScrollDebugPanel: React.FC = () => {
  const { aiGenerating, aiStreamingData } = useNoteStore();
  const [monitoringNotes, setMonitoringNotes] = useState<Set<string>>(new Set());
  const [cleanupFunctions, setCleanupFunctions] = useState<Map<string, () => void>>(new Map());

  // 监控所有正在生成AI内容的便签
  useEffect(() => {
    const generatingNotes = Object.keys(aiGenerating).filter(id => aiGenerating[id]);
    
    // 开始监控新的便签
    generatingNotes.forEach(noteId => {
      if (!monitoringNotes.has(noteId)) {
        console.log(`🚀 开始监控便签滚动: ${noteId.slice(-8)}`);
        const scrollDebugger = AIScrollDebugger.getInstance();
        const cleanup = scrollDebugger.startMonitoring(noteId);
        
        if (cleanup) {
          setCleanupFunctions(prev => new Map(prev.set(noteId, cleanup)));
        }
        setMonitoringNotes(prev => new Set(prev.add(noteId)));
      }
    });

    // 停止监控已完成的便签
    monitoringNotes.forEach(noteId => {
      if (!generatingNotes.includes(noteId)) {
        console.log(`🛑 停止监控便签滚动: ${noteId.slice(-8)}`);
        const cleanup = cleanupFunctions.get(noteId);
        if (cleanup) {
          cleanup();
          setCleanupFunctions(prev => {
            const newMap = new Map(prev);
            newMap.delete(noteId);
            return newMap;
          });
        }
        setMonitoringNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
      }
    });
  }, [aiGenerating, monitoringNotes, cleanupFunctions]);

  // 清理所有监控
  useEffect(() => {
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [cleanupFunctions]);

  // 开发模式下才显示
  if (import.meta.env.PROD) {
    return null;
  }

  const generatingNotes = Object.keys(aiGenerating).filter(id => aiGenerating[id]);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 10000,
      maxWidth: '300px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🔍 AI滚动调试面板
      </div>
      
      {generatingNotes.length === 0 ? (
        <div>无AI生成活动</div>
      ) : (
        <div>
          <div style={{ marginBottom: '8px' }}>
            正在生成: {generatingNotes.length} 个便签
          </div>
          {generatingNotes.map(noteId => (
            <div key={noteId} style={{ 
              marginBottom: '4px',
              padding: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
            }}>
              <div>便签: {noteId.slice(-8)}</div>
              <div>内容长度: {aiStreamingData[noteId]?.length || 0}</div>
              <div>
                监控状态: {monitoringNotes.has(noteId) ? '✅' : '❌'}
              </div>
              <button
                onClick={() => {
                  const scrollDebugger = AIScrollDebugger.getInstance();
                  scrollDebugger.analyzeNoteScrollStructure(noteId);
                }}
                style={{
                  background: '#1677ff',
                  border: 'none',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              >
                分析结构
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};