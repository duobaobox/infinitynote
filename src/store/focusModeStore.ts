/**
 * 专注模式状态管理
 * 管理专注模式的开关、当前编辑便签等状态
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface FocusModeState {
  /** 专注模式是否显示 */
  isVisible: boolean;
  /** 当前在专注模式中编辑的便签ID */
  activeNoteId?: string;
  /** 搜索关键字 */
  searchKeyword: string;
  /** 侧边栏是否折叠（移动端可能用到） */
  isSidebarCollapsed: boolean;
}

export interface FocusModeActions {
  /** 打开专注模式 */
  openFocusMode: (noteId?: string) => void;
  /** 关闭专注模式 */
  closeFocusMode: () => void;
  /** 设置当前编辑的便签 */
  setActiveNote: (noteId: string) => void;
  /** 清除当前编辑的便签 */
  clearActiveNote: () => void;
  /** 设置搜索关键字 */
  setSearchKeyword: (keyword: string) => void;
  /** 切换侧边栏折叠状态 */
  toggleSidebar: () => void;
  /** 重置所有状态 */
  reset: () => void;
}

export type FocusModeStore = FocusModeState & FocusModeActions;

// 初始状态
const initialState: FocusModeState = {
  isVisible: false,
  activeNoteId: undefined,
  searchKeyword: "",
  isSidebarCollapsed: false,
};

export const useFocusModeStore = create<FocusModeStore>()(
  devtools(
    (set, get) => ({
      // 状态
      ...initialState,

      // 操作方法
      openFocusMode: (noteId?: string) => {
        set(
          {
            isVisible: true,
            activeNoteId: noteId,
            searchKeyword: "", // 打开时清空搜索
          },
          false,
          "focusMode/open"
        );
      },

      closeFocusMode: () => {
        set(
          {
            isVisible: false,
            // 关闭时不清除activeNoteId，以便下次打开时记住最后编辑的便签
          },
          false,
          "focusMode/close"
        );
      },

      setActiveNote: (noteId: string) => {
        const { activeNoteId } = get();
        if (activeNoteId !== noteId) {
          set(
            {
              activeNoteId: noteId,
            },
            false,
            "focusMode/setActiveNote"
          );
        }
      },

      clearActiveNote: () => {
        set(
          {
            activeNoteId: undefined,
          },
          false,
          "focusMode/clearActiveNote"
        );
      },

      setSearchKeyword: (keyword: string) => {
        const { searchKeyword } = get();
        if (searchKeyword !== keyword) {
          set(
            {
              searchKeyword: keyword,
            },
            false,
            "focusMode/setSearchKeyword"
          );
        }
      },

      toggleSidebar: () => {
        set(
          (state) => ({
            isSidebarCollapsed: !state.isSidebarCollapsed,
          }),
          false,
          "focusMode/toggleSidebar"
        );
      },

      reset: () => {
        set(initialState, false, "focusMode/reset");
      },
    }),
    {
      name: "focus-mode-store",
      // 仅在开发环境启用devtools
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// 便利的hooks，可以只订阅特定的状态片段
export const useFocusModeVisible = () =>
  useFocusModeStore((state) => state.isVisible);

export const useFocusModeActiveNote = () =>
  useFocusModeStore((state) => state.activeNoteId);

export const useFocusModeSearch = () =>
  useFocusModeStore((state) => ({
    searchKeyword: state.searchKeyword,
    setSearchKeyword: state.setSearchKeyword,
  }));

// 操作相关的hooks
export const useFocusModeActions = () =>
  useFocusModeStore((state) => ({
    openFocusMode: state.openFocusMode,
    closeFocusMode: state.closeFocusMode,
    setActiveNote: state.setActiveNote,
    clearActiveNote: state.clearActiveNote,
    toggleSidebar: state.toggleSidebar,
    reset: state.reset,
  }));
