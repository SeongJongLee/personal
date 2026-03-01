export type PersonalColorType = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | null;

export interface AnalysisResult {
  type: PersonalColorType;
  confidence: number;
  reasoning: string;
  palette: string[];
  bestColors: string[];
  worstColors: string[];
  lightingCondition: string;
  imagePrompt: string;
}

export const COLOR_PALETTES = {
  Spring: ['#FFDF69', '#FF9F43', '#FF6B6B', '#48DBFB', '#1DD1A1'],
  Summer: ['#A29BFE', '#74B9FF', '#81ECEC', '#FAB1A0', '#DFE6E9'],
  Autumn: ['#D35400', '#E67E22', '#F39C12', '#27AE60', '#2C3E50'],
  Winter: ['#2C3E50', '#8E44AD', '#2980B9', '#C0392B', '#ECF0F1'],
};
