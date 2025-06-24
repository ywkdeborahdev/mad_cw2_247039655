// utils/responsive.ts
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11/12/13 standard)
const baseWidth = 375;
const baseHeight = 812;

// Width percentage
export const wp = (percentage: number) => {
    return (percentage * screenWidth) / 100;
};

// Height percentage
export const hp = (percentage: number) => {
    return (percentage * screenHeight) / 100;
};

// Responsive font size
export const responsiveFontSize = (size: number) => {
    const scale = screenWidth / baseWidth;
    const newSize = size * scale;
    return Math.max(newSize, size * 0.8); // Minimum size constraint
};

// Responsive spacing
export const responsiveSpacing = (size: number) => {
    const scale = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);
    return size * scale;
};
