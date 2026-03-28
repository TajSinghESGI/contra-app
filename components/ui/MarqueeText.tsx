import React, { useCallback, useState } from 'react';
import { View, type TextStyle, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface MarqueeTextProps {
  text: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  /** Speed in px/s — default 30 */
  speed?: number;
  /** Pause in ms at start/end — default 2000 */
  pauseDuration?: number;
}

/**
 * A text that auto-scrolls horizontally if it overflows its container.
 * Pauses at the start, scrolls left to reveal the end, pauses, then scrolls back.
 */
export function MarqueeText({
  text,
  style,
  containerStyle,
  speed = 30,
  pauseDuration = 2000,
}: MarqueeTextProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);
  const overflow = textWidth - containerWidth;
  const needsScroll = overflow > 0;

  const startAnimation = useCallback(() => {
    if (overflow <= 0) return;
    const scrollDuration = (overflow / speed) * 1000;
    translateX.value = 0;
    translateX.value = withRepeat(
      withSequence(
        withDelay(pauseDuration, withTiming(-overflow, { duration: scrollDuration, easing: Easing.linear })),
        withDelay(pauseDuration, withTiming(0, { duration: scrollDuration, easing: Easing.linear })),
      ),
      -1, // infinite
      false,
    );
  }, [overflow, speed, pauseDuration, translateX]);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onTextLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTextWidth(w);
  }, []);

  // Start animation once both widths are measured
  React.useEffect(() => {
    if (containerWidth > 0 && textWidth > 0 && needsScroll) {
      startAnimation();
    }
  }, [containerWidth, textWidth, needsScroll, startAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[{ overflow: 'hidden' }, containerStyle]} onLayout={onContainerLayout}>
      <Animated.View style={[{ flexDirection: 'row' }, needsScroll ? animatedStyle : undefined]}>
        <Animated.Text
          style={style}
          numberOfLines={1}
          onLayout={onTextLayout}
        >
          {text}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
