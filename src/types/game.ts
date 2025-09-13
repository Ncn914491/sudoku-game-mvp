export type CellValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;

export type SudokuGrid = CellValue[][];

export type Position = {
  row: number;
  col: number;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState = 'playing' | 'paused' | 'completed' | 'menu';

export type GameData = {
  id: string;
  grid: SudokuGrid;
  solution: SudokuGrid;
  originalGrid: SudokuGrid;
  difficulty: Difficulty;
  timeElapsed: number;
  moveHistory: Move[];
  isCompleted: boolean;
  createdAt: number;
};

export type Move = {
  position: Position;
  previousValue: CellValue;
  newValue: CellValue;
  timestamp: number;
};

export type GameStats = {
  gamesPlayed: number;
  gamesCompleted: number;
  winRate: number;
  averageTime: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
  totalPlayTime: number;
};

export type UserPreferences = {
  soundEnabled: boolean;
  highlightErrors: boolean;
  showTimer: boolean;
  theme: 'light' | 'dark';
};

export type ValidationResult = {
  isValid: boolean;
  conflicts: Position[];
  isCompleted: boolean;
};