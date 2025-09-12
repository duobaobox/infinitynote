import React from 'react';
// 引入主页面组件
import Main from './pages/Main';
// 引入全局样式
import './App.css';

/**
 * 应用根组件
 * 这是整个应用的入口组件
 * 
 * 当前功能：
 * - 渲染主页面组件
 * - 设置根容器样式确保占满整个视口
 */
function App() {
  return (
    // 根容器 - 确保应用占满整个浏览器视口
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0
    }}>
      {/* 渲染主页面组件 */}
      <Main />
    </div>
  );
}

export default App;