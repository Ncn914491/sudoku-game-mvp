import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CellValue } from '../types/game';

interface NumberPadProps {
  onNumberPress: (number: CellValue) => void;
  onErasePress: () => void;
  selectedNumber?: CellValue;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const PAD_PADDING = 20;
const PAD_WIDTH = screenWidth - PAD_PADDING * 2;
const BUTTON_SIZE = (PAD_WIDTH - 30) / 5; // 5 buttons per row with spacing

export const NumberPad: React.FC<NumberPadProps> = ({
  onNumberPress,
  onErasePress,
  selectedNumber,
  disabled = false,
}) => {
  const renderNumberButton = (number: CellValue) => {
    const isSelected = selectedNumber === number;
    const displayText = number ? number.toString() : 'E';
    const isEraseButton = number === null;

    return (
      <TouchableOpacity
        key={number ?? 'erase'}
        style={[
          styles.button,
          isSelected && styles.selectedButton,
          isEraseButton && styles.eraseButton,
          disabled && styles.disabledButton,
        ]}
        onPress={() => {
          if (isEraseButton) {
            onErasePress();
          } else {
            onNumberPress(number);
          }
        }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            isSelected && styles.selectedButtonText,
            isEraseButton && styles.eraseButtonText,
            disabled && styles.disabledButtonText,
          ]}
        >
          {displayText}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* First row: 1, 2, 3, 4, 5 */}
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map(number => renderNumberButton(number as CellValue))}
      </View>
      
      {/* Second row: 6, 7, 8, 9, Erase */}
      <View style={styles.row}>
        {[6, 7, 8, 9].map(number => renderNumberButton(number as CellValue))}
        {renderNumberButton(null)} {/* Erase button */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: PAD_WIDTH,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BDC3C7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedButton: {
    backgroundColor: '#3498DB',
    borderColor: '#2980B9',
  },
  eraseButton: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
  },
  disabledButton: {
    backgroundColor: '#F8F9FA',
    borderColor: '#DEE2E6',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: BUTTON_SIZE * 0.4,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  eraseButtonText: {
    color: '#FFFFFF',
    fontSize: BUTTON_SIZE * 0.3,
  },
  disabledButtonText: {
    color: '#ADB5BD',
  },
});