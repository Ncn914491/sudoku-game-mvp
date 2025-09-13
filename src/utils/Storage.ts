import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameData, GameStats, UserPreferences } from '../types/game';

export class Storage {
  // Storage keys
  private static readonly KEYS = {
    GAME_STATS: 'sudoku_game_stats',
    USER_PREFERENCES: 'sudoku_user_preferences',
    CURRENT_GAME: 'sudoku_current_game',
    HIGH_SCORES: 'sudoku_high_scores',
  };

  // Default values
  private static readonly DEFAULT_STATS: GameStats = {
    gamesPlayed: 0,
    gamesCompleted: 0,
    winRate: 0,
    averageTime: 0,
    bestTimes: {
      easy: null,
      medium: null,
      hard: null,
    },
    totalPlayTime: 0,
  };

  private static readonly DEFAULT_PREFERENCES: UserPreferences = {
    soundEnabled: true,
    highlightErrors: true,
    showTimer: true,
    theme: 'light',
  };

  /**
   * Game Statistics Methods
   */
  static async getGameStats(): Promise<GameStats> {
    try {
      const statsJson = await AsyncStorage.getItem(this.KEYS.GAME_STATS);
      if (statsJson) {
        return JSON.parse(statsJson);
      }
      return this.DEFAULT_STATS;
    } catch (error) {
      console.error('Error loading game stats:', error);
      return this.DEFAULT_STATS;
    }
  }

  static async updateGameStats(gameData: GameData): Promise<void> {
    try {
      const currentStats = await this.getGameStats();
      
      const updatedStats: GameStats = {
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesCompleted: gameData.isCompleted 
          ? currentStats.gamesCompleted + 1 
          : currentStats.gamesCompleted,
        winRate: 0, // Will be calculated below
        averageTime: 0, // Will be calculated below
        bestTimes: {
          ...currentStats.bestTimes
        },
        totalPlayTime: currentStats.totalPlayTime + gameData.timeElapsed,
      };

      // Calculate win rate
      updatedStats.winRate = updatedStats.gamesPlayed > 0 
        ? (updatedStats.gamesCompleted / updatedStats.gamesPlayed) * 100 
        : 0;

      // Calculate average time for completed games
      updatedStats.averageTime = updatedStats.gamesCompleted > 0 
        ? Math.floor(updatedStats.totalPlayTime / updatedStats.gamesCompleted)
        : 0;

      // Update best times if the game was completed
      if (gameData.isCompleted) {
        const currentBestTime = updatedStats.bestTimes[gameData.difficulty];
        if (currentBestTime === null || gameData.timeElapsed < currentBestTime) {
          updatedStats.bestTimes[gameData.difficulty] = gameData.timeElapsed;
        }
      }

      await AsyncStorage.setItem(this.KEYS.GAME_STATS, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error updating game stats:', error);
    }
  }

  static async resetGameStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.GAME_STATS, JSON.stringify(this.DEFAULT_STATS));
    } catch (error) {
      console.error('Error resetting game stats:', error);
    }
  }

  /**
   * User Preferences Methods
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    try {
      const prefsJson = await AsyncStorage.getItem(this.KEYS.USER_PREFERENCES);
      if (prefsJson) {
        return { ...this.DEFAULT_PREFERENCES, ...JSON.parse(prefsJson) };
      }
      return this.DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return this.DEFAULT_PREFERENCES;
    }
  }

  static async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };
      await AsyncStorage.setItem(this.KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  static async resetUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_PREFERENCES, JSON.stringify(this.DEFAULT_PREFERENCES));
    } catch (error) {
      console.error('Error resetting user preferences:', error);
    }
  }

  /**
   * Current Game Methods
   */
  static async saveCurrentGame(gameData: GameData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CURRENT_GAME, JSON.stringify(gameData));
    } catch (error) {
      console.error('Error saving current game:', error);
    }
  }

  static async loadCurrentGame(): Promise<GameData | null> {
    try {
      const gameJson = await AsyncStorage.getItem(this.KEYS.CURRENT_GAME);
      if (gameJson) {
        return JSON.parse(gameJson);
      }
      return null;
    } catch (error) {
      console.error('Error loading current game:', error);
      return null;
    }
  }

  static async clearCurrentGame(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.CURRENT_GAME);
    } catch (error) {
      console.error('Error clearing current game:', error);
    }
  }

  /**
   * High Scores Methods
   */
  static async getHighScores(): Promise<GameData[]> {
    try {
      const scoresJson = await AsyncStorage.getItem(this.KEYS.HIGH_SCORES);
      if (scoresJson) {
        return JSON.parse(scoresJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading high scores:', error);
      return [];
    }
  }

  static async addHighScore(gameData: GameData): Promise<void> {
    try {
      if (!gameData.isCompleted) return;

      const currentScores = await this.getHighScores();
      const newScores = [...currentScores, gameData];

      // Sort by time (ascending) and keep top 10 for each difficulty
      const sortedScores = newScores
        .filter(game => game.isCompleted && game.difficulty === gameData.difficulty)
        .sort((a, b) => a.timeElapsed - b.timeElapsed)
        .slice(0, 10);

      // Merge with scores from other difficulties
      const otherScores = newScores.filter(game => game.difficulty !== gameData.difficulty);
      const allScores = [...otherScores, ...sortedScores];

      await AsyncStorage.setItem(this.KEYS.HIGH_SCORES, JSON.stringify(allScores));
    } catch (error) {
      console.error('Error adding high score:', error);
    }
  }

  static async clearHighScores(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.HIGH_SCORES);
    } catch (error) {
      console.error('Error clearing high scores:', error);
    }
  }

  /**
   * Utility Methods
   */
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.KEYS.GAME_STATS),
        AsyncStorage.removeItem(this.KEYS.USER_PREFERENCES),
        AsyncStorage.removeItem(this.KEYS.CURRENT_GAME),
        AsyncStorage.removeItem(this.KEYS.HIGH_SCORES),
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  static async getStorageInfo(): Promise<{
    totalSize: number;
    availableKeys: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sudokuKeys = keys.filter(key => key.startsWith('sudoku_'));
      
      let totalSize = 0;
      for (const key of sudokuKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        totalSize,
        availableKeys: sudokuKeys,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalSize: 0,
        availableKeys: [],
      };
    }
  }

  /**
   * Backup and Restore Methods
   */
  static async exportData(): Promise<string | null> {
    try {
      const [stats, preferences, highScores] = await Promise.all([
        this.getGameStats(),
        this.getUserPreferences(),
        this.getHighScores(),
      ]);

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        stats,
        preferences,
        highScores,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  static async importData(dataString: string): Promise<boolean> {
    try {
      const importData = JSON.parse(dataString);
      
      // Validate the import data structure
      if (!importData.stats || !importData.preferences) {
        throw new Error('Invalid import data format');
      }

      // Import the data
      await Promise.all([
        AsyncStorage.setItem(this.KEYS.GAME_STATS, JSON.stringify(importData.stats)),
        AsyncStorage.setItem(this.KEYS.USER_PREFERENCES, JSON.stringify(importData.preferences)),
        importData.highScores 
          ? AsyncStorage.setItem(this.KEYS.HIGH_SCORES, JSON.stringify(importData.highScores))
          : Promise.resolve(),
      ]);

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}