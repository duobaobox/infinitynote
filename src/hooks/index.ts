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
export {
  useScrollbarDetection,
  useVerticalScrollbarDetection,
  useHorizontalScrollbarDetection,
} from "./useScrollbarDetection";
export { useAutoScroll } from "./useAutoScroll";

export type { KeyboardShortcut } from "./useKeyboardShortcuts";
export type {
  ScrollbarState,
  UseScrollbarDetectionOptions,
} from "./useScrollbarDetection";
export type { AutoScrollOptions } from "./useAutoScroll";
