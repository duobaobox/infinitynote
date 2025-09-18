/**
 * 思维链持久化快速验证脚本
 * 在浏览器控制台直接运行
 */

console.log("🔍 快速验证思维链持久化修复");

// 检查数据库中的AI数据
async function quickCheck() {
  try {
    // 检查IndexedDB
    const dbRequest = indexedDB.open("InfinityNoteDatabase");

    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      console.log(`✅ 数据库连接成功`);

      const transaction = db.transaction(["notes"], "readonly");
      const store = transaction.objectStore("notes");

      store.getAll().onsuccess = (e) => {
        const notes = e.target.result;
        console.log(`📝 总便签数: ${notes.length}`);

        // 分析AI数据
        const analysisResult = {
          totalNotes: notes.length,
          aiNotes: 0,
          thinkingChainNotes: 0,
          customPropertiesCount: 0,
          sampleAIData: null,
        };

        notes.forEach((note) => {
          if (note.customProperties) {
            analysisResult.customPropertiesCount++;

            if (note.customProperties.ai) {
              analysisResult.aiNotes++;

              if (note.customProperties.ai.thinkingChain) {
                analysisResult.thinkingChainNotes++;

                if (!analysisResult.sampleAIData) {
                  analysisResult.sampleAIData = {
                    noteId: note.id.slice(-8),
                    hasThinkingChain: !!note.customProperties.ai.thinkingChain,
                    stepsCount:
                      note.customProperties.ai.thinkingChain.steps?.length || 0,
                    showThinking: note.customProperties.ai.showThinking,
                    summary:
                      note.customProperties.ai.thinkingChain.summary?.substring(
                        0,
                        100
                      ),
                  };
                }
              }
            }
          }
        });

        console.log("📊 数据分析结果:", analysisResult);

        if (analysisResult.thinkingChainNotes > 0) {
          console.log("✅ 发现思维链数据，customProperties字段已正确加载");
          checkUIRendering();
        } else {
          console.log("⚠️ 未发现思维链数据，请先生成AI便签");
        }
      };

      db.close();
    };

    dbRequest.onerror = () => {
      console.error("❌ 数据库连接失败");
    };
  } catch (error) {
    console.error("🚨 检查过程出错:", error);
  }
}

// 检查UI渲染
function checkUIRendering() {
  console.log("\n🎨 检查UI渲染状态");

  setTimeout(() => {
    const containers = document.querySelectorAll(
      '[class*="thinkingChainContainer"]'
    );
    const visibleContainers = Array.from(containers).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    console.log(
      `思维链容器: ${containers.length} 个，可见: ${visibleContainers.length} 个`
    );

    if (visibleContainers.length > 0) {
      console.log("✅ 思维链UI正常渲染");

      visibleContainers.forEach((container, index) => {
        const steps = container.querySelectorAll('[class*="stepContent"]');
        console.log(`  容器${index + 1}: ${steps.length} 个步骤`);
      });

      console.log("\n🎯 测试完成 - 修复生效！");
      console.log("💡 现在可以刷新页面验证持久化效果");
    } else {
      console.log("❌ 思维链UI未渲染，可能需要进一步调试");

      // 提供调试信息
      const noteCards = document.querySelectorAll('[class*="noteCard"]');
      console.log(`发现 ${noteCards.length} 个便签卡片`);

      if (noteCards.length === 0) {
        console.log("💡 建议：确保页面已完全加载且有便签数据");
      }
    }
  }, 1500);
}

// 直接运行检查
quickCheck();

// 将函数绑定到window对象方便手动调用
window.quickCheck = quickCheck;
