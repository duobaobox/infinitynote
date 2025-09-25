/**
 * 便签颜色配置中心
 */

export interface NoteColorPreset {
  name: string;
  label: string;
  value: string;
  isDefault?: boolean;
  lightThemeColor?: string;
  darkThemeColor?: string;
}

export const NOTE_COLOR_PRESETS: NoteColorPreset[] = [
  {
    name: "yellow",
    label: "黄色", // 调色盘显示的名称
    value: "#FFF2CC",// 调色盘圆点的颜色
    isDefault: true,
    lightThemeColor: "#fffdee",// 便签实际颜色(更浅)
    darkThemeColor: "#3D3B00" // 暗黑主题实际颜色(更深)
  },
  {
    name: "pink",
    label: "粉色", 
    value: "#FFE6E6",
    lightThemeColor: "#fff9f8",
    darkThemeColor: "#3D1A1A"
  },
  {
    name: "blue",
    label: "蓝色",
    value: "#E6F3FF", 
    lightThemeColor: "#f2fbff",
    darkThemeColor: "#1A2A3D"
  },
  {
    name: "green",
    label: "绿色",
    value: "#E6FFE6",
    lightThemeColor: "#f5fffa",
    darkThemeColor: "#1A3D1A"
  },
  {
    name: "purple",
    label: "紫色",
    value: "#F0E6FF",
    lightThemeColor: "#fdf9ff", 
    darkThemeColor: "#2A1A3D"
  },
  {
    name: "orange",
    label: "橙色",
    value: "#FFE7D4",
    lightThemeColor: "#fff5e6",
    darkThemeColor: "#3D2A1A"
  },
  {
    name: "red", 
    label: "红色",
    value: "#FFECEC",
    lightThemeColor: "#fff2f2",
    darkThemeColor: "#3D1A1A"
  },
  {
    name: "gray",
    label: "浅灰灰",
    value: "#E8E8E8", 
    lightThemeColor: "#fdfdfdff",
    darkThemeColor: "#2A2A2A"
  }
];
export const getDefaultNoteColor = (): NoteColorPreset => {
  return NOTE_COLOR_PRESETS.find(preset => preset.isDefault) || NOTE_COLOR_PRESETS[0];
};

export const getNoteColorPreset = (colorValue: string): NoteColorPreset | undefined => {
  return NOTE_COLOR_PRESETS.find(preset => preset.value === colorValue);
};

export const getNoteColorPresetByName = (colorName: string): NoteColorPreset | undefined => {
  return NOTE_COLOR_PRESETS.find(preset => preset.name === colorName);
};

export const getAllNoteColorValues = (): string[] => {
  return NOTE_COLOR_PRESETS.map(preset => preset.value);
};

export const getNoteDisplayColor = (colorValue: string, theme: 'light' | 'dark'): string => {
  const preset = getNoteColorPreset(colorValue);
  if (!preset) return colorValue;
  
  if (theme === 'dark') {
    return preset.darkThemeColor || preset.value;
  } else {
    return preset.lightThemeColor || preset.value;
  }
};

export const generateNoteColorThemes = () => {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  
  NOTE_COLOR_PRESETS.forEach(preset => {
    light[preset.name] = preset.lightThemeColor || preset.value;
    dark[preset.name] = preset.darkThemeColor || preset.value;
  });
  
  return { light, dark };
};

export const generateNoteColorEnum = () => {
  const enumObject: Record<string, string> = {};
  
  NOTE_COLOR_PRESETS.forEach(preset => {
    enumObject[preset.name.toUpperCase()] = preset.value;
  });
  
  return enumObject;
};

export class NoteColorConfig {
  static getToolbarColorOptions(): Array<{ name: string; value: string; label: string }> {
    return NOTE_COLOR_PRESETS.map(preset => ({
      name: preset.name,
      value: preset.value,
      label: preset.label
    }));
  }
  
  static getTemplateColors(): Record<string, string> {
    return NOTE_COLOR_PRESETS.reduce((acc, preset) => {
      acc[preset.name.toUpperCase()] = preset.value;
      return acc;
    }, {} as Record<string, string>);
  }
  
  static isValidColor(colorValue: string): boolean {
    return NOTE_COLOR_PRESETS.some(preset => preset.value === colorValue);
  }
  
  static getRandomColor(): NoteColorPreset {
    const randomIndex = Math.floor(Math.random() * NOTE_COLOR_PRESETS.length);
    return NOTE_COLOR_PRESETS[randomIndex];
  }
}