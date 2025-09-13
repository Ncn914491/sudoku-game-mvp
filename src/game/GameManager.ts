import { GameData, Move, Position, CellValue, Difficulty, GameState, ValidationResult } from '../types/game';
import { SudokuEngine } from './SudokuEngine';

export class GameManager {
  private gameData: GameData | null = null;
  private gameState: GameState = 'menu';
  private startTime: number = 0;
  private pausedTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;

  // Event callbacks
  private onGameStateChange?: (state: GameState) => void;
  private onGridUpdate?: (grid: GameData['grid']) => void;
  private onTimeUpdate?: (timeElapsed: number) => void;
  private onGameComplete?: (gameData: GameData) => void;
  private onValidationUpdate?: (result: ValidationResult) => void;

  constructor() {
    this.bindMethods();
  }

  private bindMethods() {
    this.startNewGame = this.startNewGame.bind(this);
    this.makeMove = this.makeMove.bind(this);
    this.undoMove = this.undoMove.bind(this);
    this.pauseGame = this.pauseGame.bind(this);
    this.resumeGame = this.resumeGame.bind(this);
    this.validateGame = this.validateGame.bind(this);
    this.getHint = this.getHint.bind(this);
  }

  /**
   * Event handler setters
   */
  setOnGameStateChange(callback: (state: GameState) => void) {
    this.onGameStateChange = callback;
  }

  setOnGridUpdate(callback: (grid: GameData['grid']) => void) {
    this.onGridUpdate = callback;
  }

  setOnTimeUpdate(callback: (timeElapsed: number) => void) {
    this.onTimeUpdate = callback;
  }

  setOnGameComplete(callback: (gameData: GameData) => void) {
    this.onGameComplete = callback;
  }

  setOnValidationUpdate(callback: (result: ValidationResult) => void) {
    this.onValidationUpdate = callback;
  }

  /**
   * Starts a new game with specified difficulty
   */
  async startNewGame(difficulty: Difficulty): Promise<void> {
    try {
      // Generate new puzzle
      const { puzzle, solution } = SudokuEngine.generatePuzzle(difficulty);
      
      // Create new game data
      this.gameData = {
        id: this.generateGameId(),
        grid: SudokuEngine.cloneGrid(puzzle),
        solution: solution,
        originalGrid: SudokuEngine.cloneGrid(puzzle),
        difficulty: difficulty,
        timeElapsed: 0,
        moveHistory: [],
        isCompleted: false,
        createdAt: Date.now()
      };

      // Reset timer
      this.startTime = Date.now();
      this.pausedTime = 0;
      
      // Update state
      this.setGameState('playing');
      this.startTimer();
      
      // Notify listeners
      this.onGridUpdate?.(this.gameData.grid);
      this.validateGame();
      
    } catch (error) {
      console.error('Failed to start new game:', error);
      throw error;
    }
  }

  /**
   * Makes a move at the specified position
   */
  makeMove(row: number, col: number, value: CellValue): boolean {
    if (!this.gameData || this.gameState !== 'playing') {
      return false;
    }

    // Don't allow moves on original puzzle cells
    if (this.gameData.originalGrid[row][col] !== null) {
      return false;
    }

    const previousValue = this.gameData.grid[row][col];
    
    // Create move record
    const move: Move = {
      position: { row, col },
      previousValue,
      newValue: value,
      timestamp: Date.now()
    };

    // Make the move
    this.gameData.grid[row][col] = value;
    this.gameData.moveHistory.push(move);

    // Notify listeners
    this.onGridUpdate?.(this.gameData.grid);
    
    // Validate game
    const validationResult = this.validateGame();
    
    // Check if game is completed
    if (validationResult.isCompleted) {
      this.completeGame();
    }

    return true;
  }

  /**
   * Undoes the last move
   */
  undoMove(): boolean {
    if (!this.gameData || this.gameData.moveHistory.length === 0) {
      return false;
    }

    const lastMove = this.gameData.moveHistory.pop()!;
    const { row, col } = lastMove.position;
    
    // Restore previous value
    this.gameData.grid[row][col] = lastMove.previousValue;

    // Notify listeners
    this.onGridUpdate?.(this.gameData.grid);
    this.validateGame();

    return true;
  }

  /**
   * Pauses the current game
   */
  pauseGame(): void {
    if (this.gameState === 'playing') {
      this.setGameState('paused');
      this.pausedTime = Date.now();
      this.stopTimer();
    }
  }

  /**
   * Resumes the paused game
   */
  resumeGame(): void {
    if (this.gameState === 'paused') {
      this.setGameState('playing');
      
      // Adjust start time to account for pause duration
      if (this.pausedTime > 0) {
        const pauseDuration = Date.now() - this.pausedTime;
        this.startTime += pauseDuration;
        this.pausedTime = 0;
      }
      
      this.startTimer();
    }
  }

  /**
   * Gets a hint for the current game
   */
  getHint(): Position | null {
    if (!this.gameData) return null;
    
    return SudokuEngine.getHint(this.gameData.grid, this.gameData.solution);
  }

  /**
   * Validates the current game state
   */
  validateGame(): ValidationResult {
    if (!this.gameData) {
      return { isValid: false, conflicts: [], isCompleted: false };
    }

    const result = SudokuEngine.validateGrid(this.gameData.grid);
    this.onValidationUpdate?.(result);
    
    return result;
  }

  /**
   * Completes the current game
   */
  private completeGame(): void {
    if (!this.gameData) return;

    this.gameData.isCompleted = true;
    this.gameData.timeElapsed = this.getCurrentTimeElapsed();
    
    this.setGameState('completed');
    this.stopTimer();
    
    this.onGameComplete?.(this.gameData);
  }

  /**
   * Sets the game state and notifies listeners
   */
  private setGameState(state: GameState): void {
    this.gameState = state;
    this.onGameStateChange?.(state);
  }

  /**
   * Starts the game timer
   */
  private startTimer(): void {
    this.stopTimer(); // Clear any existing timer
    
    this.timerInterval = setInterval(() => {
      if (this.gameData && this.gameState === 'playing') {
        const timeElapsed = this.getCurrentTimeElapsed();
        this.gameData.timeElapsed = timeElapsed;
        this.onTimeUpdate?.(timeElapsed);
      }
    }, 1000);
  }

  /**
   * Stops the game timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Gets the current elapsed time
   */
  private getCurrentTimeElapsed(): number {
    if (this.startTime === 0) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Generates a unique game ID
   */
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public getters
   */
  getGameData(): GameData | null {
    return this.gameData;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getCurrentGrid(): GameData['grid'] | null {
    return this.gameData?.grid || null;
  }

  getOriginalGrid(): GameData['originalGrid'] | null {
    return this.gameData?.originalGrid || null;
  }

  getSolution(): GameData['solution'] | null {
    return this.gameData?.solution || null;
  }

  getDifficulty(): Difficulty | null {
    return this.gameData?.difficulty || null;
  }

  getTimeElapsed(): number {
    return this.gameData?.timeElapsed || 0;
  }

  isCompleted(): boolean {
    return this.gameData?.isCompleted || false;
  }

  canUndo(): boolean {
    return this.gameData ? this.gameData.moveHistory.length > 0 : false;
  }

  /**
   * Cleanup method
   */
  dispose(): void {
    this.stopTimer();
    this.gameData = null;
    this.gameState = 'menu';
  }
}