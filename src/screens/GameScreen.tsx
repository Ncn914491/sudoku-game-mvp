import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SudokuBoard } from '../components/SudokuBoard';
import { NumberPad } from '../components/NumberPad';
import { AdManager, showInterstitialWithFrequencyControl, adFrequencyManager } from '../components/AdManager';
import { GameManager } from '../game/GameManager';
import { 
  Position, 
  CellValue, 
  GameState, 
  ValidationResult, 
  GameData,
  Difficulty 
} from '../types/game';

interface GameScreenProps {
  gameManager: GameManager;
  onBackToMenu: () => void;
  onGameComplete: (gameData: GameData) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameManager,
  onBackToMenu,
  onGameComplete,
}) => {
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<CellValue>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [grid, setGrid] = useState(gameManager.getCurrentGrid() || []);
  const [originalGrid, setOriginalGrid] = useState(gameManager.getOriginalGrid() || []);
  const [conflicts, setConflicts] = useState<Position[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    // Set up game manager callbacks
    gameManager.setOnGameStateChange(handleGameStateChange);
    gameManager.setOnGridUpdate(handleGridUpdate);
    gameManager.setOnTimeUpdate(handleTimeUpdate);
    gameManager.setOnGameComplete(handleGameComplete);
    gameManager.setOnValidationUpdate(handleValidationUpdate);

    // Initialize state
    setGameState(gameManager.getGameState());
    setGrid(gameManager.getCurrentGrid() || []);
    setOriginalGrid(gameManager.getOriginalGrid() || []);
    setDifficulty(gameManager.getDifficulty());
    setTimeElapsed(gameManager.getTimeElapsed());
    setCanUndo(gameManager.canUndo());

    return () => {
      // Cleanup
      gameManager.dispose();
    };
  }, []);

  const handleGameStateChange = (state: GameState) => {
    setGameState(state);
  };

  const handleGridUpdate = (newGrid: GameData['grid']) => {
    setGrid([...newGrid]);
    setCanUndo(gameManager.canUndo());
  };

  const handleTimeUpdate = (time: number) => {
    setTimeElapsed(time);
  };

  const handleGameComplete = async (gameData: GameData) => {
    // Track game completion for ad frequency
    adFrequencyManager.onGameCompleted();
    
    // Show interstitial ad if appropriate
    await showInterstitialWithFrequencyControl();
    
    Alert.alert(
      'Congratulations!',
      `You completed the ${gameData.difficulty} puzzle in ${formatTime(gameData.timeElapsed)}!`,
      [
        { text: 'Play Again', onPress: () => gameManager.startNewGame(gameData.difficulty) },
        { text: 'Main Menu', onPress: onBackToMenu },
      ]
    );
    onGameComplete(gameData);
  };

  const handleValidationUpdate = (result: ValidationResult) => {
    setConflicts(result.conflicts);
  };

  const handleCellPress = (row: number, col: number) => {
    if (gameState !== 'playing') return;
    
    const newSelectedCell = { row, col };
    
    // If clicking the same cell, deselect it
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setSelectedCell(null);
      setSelectedNumber(null);
    } else {
      setSelectedCell(newSelectedCell);
      // Auto-select the current number in the cell
      const currentValue = grid[row][col];
      setSelectedNumber(currentValue);
    }
  };

  const handleNumberPress = (number: CellValue) => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const { row, col } = selectedCell;
    gameManager.makeMove(row, col, number);
    setSelectedNumber(number);
  };

  const handleErasePress = () => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const { row, col } = selectedCell;
    gameManager.makeMove(row, col, null);
    setSelectedNumber(null);
  };

  const handleUndo = () => {
    gameManager.undoMove();
  };

  const handlePause = () => {
    if (gameState === 'playing') {
      gameManager.pauseGame();
    } else if (gameState === 'paused') {
      gameManager.resumeGame();
    }
  };

  const handleHint = () => {
    const hintPosition = gameManager.getHint();
    if (hintPosition) {
      setSelectedCell(hintPosition);
      const solution = gameManager.getSolution();
      if (solution) {
        const hintValue = solution[hintPosition.row][hintPosition.col];
        Alert.alert(
          'Hint',
          `Try placing ${hintValue} in the selected cell!`,
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert('No hints available', 'The puzzle is already complete!');
    }
  };

  const handleBackPress = () => {
    if (gameState === 'playing') {
      Alert.alert(
        'Exit Game',
        'Are you sure you want to exit? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: onBackToMenu, style: 'destructive' },
        ]
      );
    } else {
      onBackToMenu();
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (diff: Difficulty | null): string => {
    switch (diff) {
      case 'easy': return '#27AE60';
      case 'medium': return '#F39C12';
      case 'hard': return '#E74C3C';
      default: return '#BDC3C7';
    }
  };

  if (gameState === 'paused') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
        <View style={styles.pausedContainer}>
          <Text style={styles.pausedTitle}>Game Paused</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={handlePause}>
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={handleBackPress}>
            <Text style={styles.menuButtonText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.gameInfo}>
          <Text style={[styles.difficulty, { color: getDifficultyColor(difficulty) }]}>
            {difficulty?.toUpperCase() || 'SUDOKU'}
          </Text>
          <Text style={styles.timer}>{formatTime(timeElapsed)}</Text>
        </View>
        
        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <Text style={styles.pauseButtonText}>⏸</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Game Board */}
        <View style={styles.boardContainer}>
          <SudokuBoard
            grid={grid}
            originalGrid={originalGrid}
            conflicts={conflicts}
            onCellPress={handleCellPress}
            selectedCell={selectedCell}
            isGameCompleted={gameState === 'completed'}
            showErrors={true}
          />
        </View>

        {/* Game Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.topControls}>
            <TouchableOpacity
              style={[styles.controlButton, !canUndo && styles.disabledButton]}
              onPress={handleUndo}
              disabled={!canUndo}
            >
              <Text style={[styles.controlButtonText, !canUndo && styles.disabledButtonText]}>
                Undo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleHint}>
              <Text style={styles.controlButtonText}>Hint</Text>
            </TouchableOpacity>
          </View>

          {/* Number Pad */}
          <NumberPad
            onNumberPress={handleNumberPress}
            onErasePress={handleErasePress}
            selectedNumber={selectedNumber}
            disabled={gameState !== 'playing'}
          />
          
          {/* Banner Ad */}
          <AdManager 
            showBanner={true}
            onAdError={(error) => console.log('Ad error:', error)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#34495E',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#ECF0F1',
    fontSize: 16,
    fontWeight: '600',
  },
  gameInfo: {
    alignItems: 'center',
  },
  difficulty: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    color: '#ECF0F1',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pauseButton: {
    padding: 10,
  },
  pauseButtonText: {
    color: '#ECF0F1',
    fontSize: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  boardContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#ECF0F1',
  },
  controlButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  disabledButtonText: {
    color: '#7F8C8D',
  },
  pausedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pausedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ECF0F1',
    marginBottom: 40,
  },
  resumeButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});