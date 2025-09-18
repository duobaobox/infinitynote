// 在浏览器控制台运行这个脚本来测试数据库升级
console.log("🔧 检查数据库升级状态...");

// 检查数据库版本
const checkDB = () => {
  const request = indexedDB.open("InfinityNoteDatabase");

  request.onsuccess = (event) => {
    const db = event.target.result;
    console.log("📊 当前数据库版本:", db.version);
    console.log("📋 表名列表:", [...db.objectStoreNames]);

    // 检查notes表的结构
    if (db.objectStoreNames.contains("notes")) {
      console.log("✅ Notes表存在");

      // 检查一个便签的结构
      const tx = db.transaction(["notes"], "readonly");
      const store = tx.objectStore("notes");

      store.getAll().onsuccess = (e) => {
        const notes = e.target.result;
        console.log(`📝 便签数量: ${notes.length}`);

        if (notes.length > 0) {
          const firstNote = notes[0];
          console.log("📋 第一个便签的字段:", Object.keys(firstNote));
          console.log(
            "🎯 是否包含customProperties:",
            "customProperties" in firstNote
          );

          if (firstNote.customProperties) {
            console.log("🤖 customProperties内容:", firstNote.customProperties);
          }
        }
      };
    }

    db.close();
  };

  request.onerror = () => {
    console.error("❌ 无法打开数据库");
  };
};

// 立即检查
checkDB();

// 导出给window使用
window.checkDB = checkDB;
