import { CellValue, SudokuGrid, Position, Difficulty, ValidationResult } from '../types/game';

export class SudokuEngine {
  private static readonly GRID_SIZE = 9;
  private static readonly BOX_SIZE = 3;

  /**
   * Creates an empty 9x9 Sudoku grid
   */
  static createEmptyGrid(): SudokuGrid {
    return Array(this.GRID_SIZE)
      .fill(null)
      .map(() => Array(this.GRID_SIZE).fill(null));
  }

  /**
   * Creates a deep copy of a Sudoku grid
   */
  static cloneGrid(grid: SudokuGrid): SudokuGrid {
    return grid.map(row => [...row]);
  }

  /**
   * Checks if a number can be placed at a specific position
   */
  static isValidMove(grid: SudokuGrid, row: number, col: number, num: CellValue): boolean {
    if (num === null) return true;

    // Check row
    for (let c = 0; c < this.GRID_SIZE; c++) {
      if (c !== col && grid[row][c] === num) {
        return false;
      }
    }

    // Check column
    for (let r = 0; r < this.GRID_SIZE; r++) {
      if (r !== row && grid[r][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const boxStartRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
    const boxStartCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

    for (let r = boxStartRow; r < boxStartRow + this.BOX_SIZE; r++) {
      for (let c = boxStartCol; c < boxStartCol + this.BOX_SIZE; c++) {
        if ((r !== row || c !== col) && grid[r][c] === num) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Finds all conflicts for the current grid state
   */
  static validateGrid(grid: SudokuGrid): ValidationResult {
    const conflicts: Position[] = [];
    let filledCells = 0;

    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const value = grid[row][col];
        if (value !== null) {
          filledCells++;
          if (!this.isValidMove(grid, row, col, value)) {
            conflicts.push({ row, col });
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
      isCompleted: conflicts.length === 0 && filledCells === this.GRID_SIZE * this.GRID_SIZE
    };
  }

  /**
   * Solves a Sudoku puzzle using backtracking algorithm
   */
  static solvePuzzle(grid: SudokuGrid): boolean {
    const workingGrid = this.cloneGrid(grid);
    return this.solveRecursive(workingGrid, grid);
  }

  private static solveRecursive(workingGrid: SudokuGrid, resultGrid: SudokuGrid): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (workingGrid[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            const cellValue = num as CellValue;
            if (this.isValidMove(workingGrid, row, col, cellValue)) {
              workingGrid[row][col] = cellValue;
              
              if (this.solveRecursive(workingGrid, resultGrid)) {
                resultGrid[row][col] = cellValue;
                return true;
              }
              
              workingGrid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    
    // Copy solved grid to result
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        resultGrid[row][col] = workingGrid[row][col];
      }
    }
    
    return true;
  }

  /**
   * Generates a complete valid Sudoku solution
   */
  static generateCompleteSolution(): SudokuGrid {
    const grid = this.createEmptyGrid();
    
    // Fill diagonal 3x3 boxes first (they don't depend on each other)
    this.fillDiagonalBoxes(grid);
    
    // Fill remaining cells
    this.fillRemaining(grid, 0, this.BOX_SIZE);
    
    return grid;
  }

  private static fillDiagonalBoxes(grid: SudokuGrid): void {
    for (let box = 0; box < this.GRID_SIZE; box += this.BOX_SIZE) {
      this.fillBox(grid, box, box);
    }
  }

  private static fillBox(grid: SudokuGrid, row: number, col: number): void {
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let index = 0;
    
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        grid[row + i][col + j] = numbers[index] as CellValue;
        index++;
      }
    }
  }

  private static fillRemaining(grid: SudokuGrid, row: number, col: number): boolean {
    if (col >= this.GRID_SIZE && row < this.GRID_SIZE - 1) {
      row++;
      col = 0;
    }
    if (row >= this.GRID_SIZE && col >= this.GRID_SIZE) {
      return true;
    }

    if (row < this.BOX_SIZE) {
      if (col < this.BOX_SIZE) col = this.BOX_SIZE;
    } else if (row < this.GRID_SIZE - this.BOX_SIZE) {
      if (col === Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE) col += this.BOX_SIZE;
    } else {
      if (col === this.GRID_SIZE - this.BOX_SIZE) {
        row++;
        col = 0;
        if (row >= this.GRID_SIZE) return true;
      }
    }

    for (let num = 1; num <= this.GRID_SIZE; num++) {
      if (this.isValidMove(grid, row, col, num as CellValue)) {
        grid[row][col] = num as CellValue;
        if (this.fillRemaining(grid, row, col + 1)) return true;
        grid[row][col] = null;
      }
    }
    return false;
  }

  /**
   * Creates a puzzle by removing numbers from a complete solution
   */
  static generatePuzzle(difficulty: Difficulty): { puzzle: SudokuGrid; solution: SudokuGrid } {
    const solution = this.generateCompleteSolution();
    const puzzle = this.cloneGrid(solution);
    
    const cellsToRemove = this.getCellsToRemove(difficulty);
    const positions = this.getAllPositions();
    const shuffledPositions = this.shuffleArray(positions);
    
    let removed = 0;
    for (const pos of shuffledPositions) {
      if (removed >= cellsToRemove) break;
      
      const backup = puzzle[pos.row][pos.col];
      puzzle[pos.row][pos.col] = null;
      
      // Check if puzzle still has unique solution
      if (this.hasUniqueSolution(puzzle)) {
        removed++;
      } else {
        // Restore the number if it makes the puzzle unsolvable or non-unique
        puzzle[pos.row][pos.col] = backup;
      }
    }
    
    return { puzzle, solution };
  }

  private static getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return 40; // Remove 40 cells (easy)
      case 'medium': return 50; // Remove 50 cells (medium)
      case 'hard': return 60; // Remove 60 cells (hard)
      default: return 40;
    }
  }

  private static getAllPositions(): Position[] {
    const positions: Position[] = [];
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        positions.push({ row, col });
      }
    }
    return positions;
  }

  private static hasUniqueSolution(grid: SudokuGrid): boolean {
    const solutions: SudokuGrid[] = [];
    this.findAllSolutions(this.cloneGrid(grid), solutions, 2); // Stop after finding 2 solutions
    return solutions.length === 1;
  }

  private static findAllSolutions(grid: SudokuGrid, solutions: SudokuGrid[], maxSolutions: number): void {
    if (solutions.length >= maxSolutions) return;
    
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (grid[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(grid, row, col, num as CellValue)) {
              grid[row][col] = num as CellValue;
              this.findAllSolutions(grid, solutions, maxSolutions);
              grid[row][col] = null;
            }
          }
          return;
        }
      }
    }
    
    // Found a complete solution
    solutions.push(this.cloneGrid(grid));
  }

  /**
   * Utility function to shuffle an array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Gets a hint for the player (finds next logical move)
   */
  static getHint(grid: SudokuGrid, solution: SudokuGrid): Position | null {
    const emptyCells: Position[] = [];
    
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (grid[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) return null;
    
    // Return a random empty cell that needs to be filled
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }
}