// 导出所有自定义 hooks
export { useNoteDatabase } from "./useNoteDatabase";
export {
  useKeyboardShortcuts,
  KEYBOARD_SHORTCUTS,
} from "./useKeyboardShortcuts";
export {
  useLocalStorage,
  useSessionStorage,
  clearLocalStorage,
  getLocalStorageSize,
} from "./useLocalStorage";

export type { KeyboardShortcut } from "./useKeyboardShortcuts";
