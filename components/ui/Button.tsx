import React, { memo, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Platform,
  View,
  type ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, radius } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IButton {
  children: React.ReactNode & React.ReactElement;
  readonly isLoading?: boolean;
  readonly onPress?: () => void;
  readonly width?: number | '100%';
  readonly height?: number;
  readonly backgroundColor?: string;
  readonly loadingTextBackgroundColor?: string;
  readonly loadingText?: string;
  readonly loadingTextColor?: string;
  readonly loadingTextSize?: number;
  readonly showLoadingIndicator?: boolean;
  readonly renderLoadingIndicator?: () => React.ReactNode | React.JSX.Element;
  readonly borderRadius?: number;
  readonly gradientColors?: string[];
  readonly style?: import('react-native').StyleProp<ViewStyle>;
  readonly loadingTextStyle?: import('react-native').StyleProp<import('react-native').TextStyle>;
  readonly withPressAnimation?: boolean;
  readonly animationDuration?: number;
  readonly disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const Button: React.FC<IButton> & React.FunctionComponent<IButton> =
  memo<IButton>(
    ({
      children,
      isLoading = false,
      onPress,
      width = 200,
      height = 52,
      backgroundColor: backgroundColorProp,
      loadingText = 'Chargement...',
      loadingTextColor: loadingTextColorProp,
      loadingTextSize = 14,
      borderRadius: borderRadiusProp,
      gradientColors,
      style,
      loadingTextStyle,
      withPressAnimation = true,
      animationDuration = 250,
      disabled = false,
      showLoadingIndicator = true,
      renderLoadingIndicator,
      loadingTextBackgroundColor: loadingTextBackgroundColorProp,
    }: IButton): React.ReactNode & React.JSX.Element & React.ReactElement => {
      const { colors } = useTheme();
      const backgroundColor = backgroundColorProp ?? colors['surface-container-high'];
      const loadingTextColor = loadingTextColorProp ?? colors['on-primary'];
      const loadingTextBackgroundColor = loadingTextBackgroundColorProp ?? colors['primary-dim'];
      const animationProgress = useSharedValue<number>(isLoading ? 1 : 0);
      const scaleValue = useSharedValue<number>(1);

      useEffect(() => {
        animationProgress.value = withTiming<number>(isLoading ? 1 : 0, {
          duration: animationDuration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
      }, [isLoading, animationDuration]);

      const calculatedBorderRadius = borderRadiusProp ?? radius.full;

      const contentAnimatedStyle = useAnimatedStyle<
        Pick<ViewStyle, 'transform' | 'opacity'>
      >(() => {
        const translateY = interpolate(
          animationProgress.value,
          [0, 1],
          [0, -20],
        );
        const opacity = interpolate(animationProgress.value, [0, 0.5], [1, 0]);

        return {
          transform: [{ translateY }],
          opacity,
        };
      });

      const loadingAnimatedStyle = useAnimatedStyle<
        Pick<ViewStyle, 'transform' | 'opacity'>
      >(() => {
        const translateY = interpolate(
          animationProgress.value,
          [0, 1],
          [20, 0],
        );
        const opacity = interpolate(animationProgress.value, [0.5, 1], [0, 1]);

        return {
          transform: [{ translateY }],
          opacity,
        };
      });

      const pressAnimatedStyle = useAnimatedStyle<
        Pick<ViewStyle, 'transform' | 'backgroundColor'>
      >(() => {
        const bgColor = interpolateColor(
          animationProgress.value,
          [0, 1],
          [backgroundColor, loadingTextBackgroundColor!],
        );
        return {
          transform: [{ scale: scaleValue.value }],
          backgroundColor: bgColor,
        };
      });

      const handlePressIn = () => {
        if (withPressAnimation && !disabled && !isLoading) {
          scaleValue.value = withTiming(0.97, { duration: 100 });
        }
      };

      const handlePressOut = () => {
        if (withPressAnimation && !disabled && !isLoading) {
          scaleValue.value = withTiming(1, { duration: 200 });
        }
      };

      const renderInnerContent = () => (
        <View style={styles.contentWrapper}>
          <Animated.View
            style={[styles.contentContainer, contentAnimatedStyle]}
          >
            {children}
          </Animated.View>

          <Animated.View
            style={[styles.loadingContainer, loadingAnimatedStyle]}
          >
            {showLoadingIndicator &&
              (renderLoadingIndicator ? (
                renderLoadingIndicator()
              ) : (
                <Animated.View style={{ marginRight: loadingText ? 8 : 0 }}>
                  <ActivityIndicator color={loadingTextColor} size="small" />
                </Animated.View>
              ))}
            <Animated.Text
              style={[
                styles.loadingText,
                {
                  color: loadingTextColor,
                  fontSize: loadingTextSize,
                },
                loadingTextStyle,
              ]}
            >
              {loadingText}
            </Animated.Text>
          </Animated.View>
        </View>
      );

      const buttonContent = gradientColors ? (
        <Animated.View style={[pressAnimatedStyle]}>
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.button,
              {
                width,
                height,
                borderRadius: calculatedBorderRadius,
              },
              style,
            ]}
          >
            {renderInnerContent()}
          </LinearGradient>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.button,
            {
              width,
              height,
              backgroundColor,
              borderRadius: calculatedBorderRadius,
            },
            pressAnimatedStyle,
            style,
          ]}
        >
          {renderInnerContent()}
        </Animated.View>
      );

      return (
        <Pressable
          onPress={onPress}
          disabled={isLoading || disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.pressable,
            disabled && styles.disabled,
            Platform.OS === 'ios' && pressed && styles.pressed,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading || disabled }}
        >
          {buttonContent}
        </Pressable>
      );
    },
  );

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.medium,
    letterSpacing: 0.5,
  },
});

export default memo<React.FC<IButton> & React.FunctionComponent<IButton>>(
  Button,
);
