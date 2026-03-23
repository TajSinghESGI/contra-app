import React, { memo, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { radius, shadows, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
}

export const Card = memo(function Card({
  children,
  style,
  onPress,
  elevated = false,
}: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 350 });
  };

  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        style={styles.pressable}
      >
        <Animated.View style={[animatedStyle, cardStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={cardStyle}>
      {children}
    </Animated.View>
  );
});

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
  },
  elevated: {
    shadowColor: shadows.ambient.shadowColor,
    shadowOffset: shadows.ambient.shadowOffset,
    shadowOpacity: shadows.ambient.shadowOpacity,
    shadowRadius: shadows.ambient.shadowRadius,
    elevation: shadows.ambient.elevation,
  },
});

export default Card;
