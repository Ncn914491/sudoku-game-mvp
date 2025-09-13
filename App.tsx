import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';

import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameManager } from './src/game/GameManager';
import { Storage } from './src/utils/Storage';
import { Difficulty, GameData } from './src/types/game';

type AppState = 'menu' | 'game' | 'stats' | 'settings';

function App(): JSX.Element {
  const [appState, setAppState] = useState<AppState>('menu');
  const [gameManager] = useState(() => new GameManager());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup when app unmounts
      gameManager.dispose();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize storage and load user preferences
      const preferences = await Storage.getUserPreferences();
      console.log('Loaded user preferences:', preferences);
      
      // Check for saved game
      const savedGame = await Storage.loadCurrentGame();
      if (savedGame) {
        Alert.alert(
          'Continue Game',
          'You have a saved game in progress. Would you like to continue?',
          [
            { 
              text: 'New Game', 
              onPress: () => Storage.clearCurrentGame(),
              style: 'destructive'
            },
            { 
              text: 'Continue', 
              onPress: () => {
                // TODO: Implement resume game functionality
                console.log('Resume game:', savedGame);
              }
            },
          ]
        );
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  const handleStartGame = async (difficulty: Difficulty) => {
    try {
      await gameManager.startNewGame(difficulty);
      setAppState('game');
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert(
        'Error',
        'Failed to start new game. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToMenu = () => {
    setAppState('menu');
  };

  const handleGameComplete = async (gameData: GameData) => {
    try {
      // Update statistics
      await Storage.updateGameStats(gameData);
      
      // Add to high scores if completed
      if (gameData.isCompleted) {
        await Storage.addHighScore(gameData);
      }
      
      // Clear current game since it's completed
      await Storage.clearCurrentGame();
    } catch (error) {
      console.error('Error handling game completion:', error);
    }
  };

  const handleShowStats = () => {
    Alert.alert(
      'Statistics',
      'Statistics screen will be implemented in future updates.',
      [{ text: 'OK' }]
    );
  };

  const handleShowSettings = () => {
    Alert.alert(
      'Settings',
      'Settings screen will be implemented in future updates.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    // TODO: Add proper loading screen
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      </SafeAreaView>
    );
  }

  switch (appState) {
    case 'game':
      return (
        <GameScreen
          gameManager={gameManager}
          onBackToMenu={handleBackToMenu}
          onGameComplete={handleGameComplete}
        />
      );
    
    case 'menu':
    default:
      return (
        <MenuScreen
          onStartGame={handleStartGame}
          onShowStats={handleShowStats}
          onShowSettings={handleShowSettings}
        />
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
