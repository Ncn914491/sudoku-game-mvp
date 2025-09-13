import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { CellValue, SudokuGrid, Position, ValidationResult } from '../types/game';

interface SudokuBoardProps {
  grid: SudokuGrid;
  originalGrid: SudokuGrid;
  conflicts: Position[];
  onCellPress: (row: number, col: number) => void;
  selectedCell: Position | null;
  isGameCompleted?: boolean;
  showErrors?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const BOARD_PADDING = 20;
const BOARD_WIDTH = screenWidth - BOARD_PADDING * 2;
const CELL_SIZE = BOARD_WIDTH / 9;

export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  grid,
  originalGrid,
  conflicts,
  onCellPress,
  selectedCell,
  isGameCompleted = false,
  showErrors = true,
}) => {
  const [highlightedCells, setHighlightedCells] = useState<Position[]>([]);

  useEffect(() => {
    if (selectedCell) {
      const highlights = getHighlightedCells(selectedCell.row, selectedCell.col);
      setHighlightedCells(highlights);
    } else {
      setHighlightedCells([]);
    }
  }, [selectedCell]);

  const getHighlightedCells = (selectedRow: number, selectedCol: number): Position[] => {
    const highlights: Position[] = [];
    
    // Highlight row and column
    for (let i = 0; i < 9; i++) {
      highlights.push({ row: selectedRow, col: i });
      highlights.push({ row: i, col: selectedCol });
    }
    
    // Highlight 3x3 box
    const boxStartRow = Math.floor(selectedRow / 3) * 3;
    const boxStartCol = Math.floor(selectedCol / 3) * 3;
    
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        highlights.push({ row: r, col: c });
      }
    }
    
    return highlights;
  };

  const getCellStyle = (row: number, col: number) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isHighlighted = highlightedCells.some(pos => pos.row === row && pos.col === col);
    const isOriginal = originalGrid[row][col] !== null;
    const hasConflict = conflicts.some(pos => pos.row === row && pos.col === col);
    const isRightBorder = col === 2 || col === 5;
    const isBottomBorder = row === 2 || row === 5;

    return [
      styles.cell,
      isSelected && styles.selectedCell,
      isHighlighted && !isSelected && styles.highlightedCell,
      isOriginal && styles.originalCell,
      hasConflict && showErrors && styles.conflictCell,
      isRightBorder && styles.rightBorder,
      isBottomBorder && styles.bottomBorder,
      isGameCompleted && styles.completedCell,
    ];
  };

  const getCellTextStyle = (row: number, col: number) => {
    const isOriginal = originalGrid[row][col] !== null;
    const hasConflict = conflicts.some(pos => pos.row === row && pos.col === col);

    return [
      styles.cellText,
      isOriginal && styles.originalCellText,
      hasConflict && showErrors && styles.conflictCellText,
      isGameCompleted && styles.completedCellText,
    ];
  };

  const renderCell = (row: number, col: number) => {
    const value = grid[row][col];
    const displayValue = value ? value.toString() : '';

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={getCellStyle(row, col)}
        onPress={() => onCellPress(row, col)}
        disabled={isGameCompleted}
        activeOpacity={0.7}
      >
        <Text style={getCellTextStyle(row, col)}>
          {displayValue}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRow = (row: number) => {
    return (
      <View key={row} style={styles.row}>
        {Array.from({ length: 9 }, (_, col) => renderCell(row, col))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {Array.from({ length: 9 }, (_, row) => renderRow(row))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    width: BOARD_WIDTH,
    height: BOARD_WIDTH,
    backgroundColor: '#2C3E50',
    borderWidth: 2,
    borderColor: '#34495E',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#ECF0F1',
    borderWidth: 0.5,
    borderColor: '#BDC3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: '#3498DB',
  },
  highlightedCell: {
    backgroundColor: '#AED6F1',
  },
  originalCell: {
    backgroundColor: '#D5DBDB',
  },
  conflictCell: {
    backgroundColor: '#F1948A',
  },
  completedCell: {
    backgroundColor: '#A9DFBF',
  },
  rightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#2C3E50',
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#2C3E50',
  },
  cellText: {
    fontSize: CELL_SIZE * 0.6,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  originalCellText: {
    color: '#1B4F72',
    fontWeight: '800',
  },
  conflictCellText: {
    color: '#A93226',
  },
  completedCellText: {
    color: '#1E8449',
  },
});