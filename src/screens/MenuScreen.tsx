import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { Difficulty } from '../types/game';

interface MenuScreenProps {
  onStartGame: (difficulty: Difficulty) => void;
  onShowStats: () => void;
  onShowSettings: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onShowStats,
  onShowSettings,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');

  const handleStartGame = () => {
    Alert.alert(
      'Start New Game',
      `Start a new ${selectedDifficulty} puzzle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStartGame(selectedDifficulty) },
      ]
    );
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'easy': return '#27AE60';
      case 'medium': return '#F39C12';
      case 'hard': return '#E74C3C';
    }
  };

  const getDifficultyDescription = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'easy': return 'Perfect for beginners\n40+ given numbers';
      case 'medium': return 'Moderate challenge\n30-40 given numbers';
      case 'hard': return 'Expert level\n20-30 given numbers';
    }
  };

  const renderDifficultyButton = (difficulty: Difficulty) => {
    const isSelected = selectedDifficulty === difficulty;
    return (
      <TouchableOpacity
        key={difficulty}
        style={[
          styles.difficultyButton,
          { backgroundColor: getDifficultyColor(difficulty) },
          isSelected && styles.selectedDifficultyButton,
        ]}
        onPress={() => setSelectedDifficulty(difficulty)}
        activeOpacity={0.8}
      >
        <Text style={styles.difficultyButtonTitle}>
          {difficulty.toUpperCase()}
        </Text>
        <Text style={styles.difficultyButtonDescription}>
          {getDifficultyDescription(difficulty)}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SUDOKU</Text>
        <Text style={styles.subtitle}>Master the Numbers</Text>
      </View>

      {/* Difficulty Selection */}
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyTitle}>Choose Difficulty</Text>
        <View style={styles.difficultyButtons}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(renderDifficultyButton)}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.startButton]}
          onPress={handleStartGame}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>START GAME</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onShowStats}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Statistics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onShowSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ECF0F1',
    letterSpacing: 4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#BDC3C7',
    fontStyle: 'italic',
  },
  difficultyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  difficultyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECF0F1',
    textAlign: 'center',
    marginBottom: 30,
  },
  difficultyButtons: {
    flex: 1,
    justifyContent: 'space-around',
  },
  difficultyButton: {
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: 'relative',
  },
  selectedDifficultyButton: {
    transform: [{ scale: 1.02 }],
    elevation: 8,
    shadowOpacity: 0.4,
  },
  difficultyButtonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  difficultyButtonDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#E74C3C',
    marginBottom: 20,
    paddingVertical: 20,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#34495E',
    flex: 0.48,
  },
  secondaryButtonText: {
    color: '#ECF0F1',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#7F8C8D',
    fontSize: 12,
  },
});