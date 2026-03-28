import React, { FC, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fonts, spacing } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const DURATION = 280;
const TIMING_CONFIG = { duration: DURATION, easing: Easing.out(Easing.quad) };

interface AnimatedAvatarPickerProps {
  size: number;
  initial: string;
  avatarBg?: string;
  avatarUrl?: string;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  onClose: () => void;
}

export const AnimatedAvatarPicker: FC<AnimatedAvatarPickerProps> = ({
  size,
  initial,
  avatarBg,
  avatarUrl,
  onPickCamera,
  onPickLibrary,
  onClose,
}) => {
  const { colors, fs } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const expandedSize = screenWidth * 0.5;
  const centerX = (screenWidth - expandedSize) / 2;
  const centerY = (screenHeight - expandedSize) / 2 - 40;

  const progress = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Open animation on mount
  useEffect(() => {
    progress.value = withTiming(1, TIMING_CONFIG);
  }, []);

  const close = () => {
    progress.value = withTiming(0, TIMING_CONFIG);
    setTimeout(onClose, DURATION);
  };

  // Styles
  const rBackdropProps = useAnimatedProps(() => ({
    intensity: progress.value * 80,
  }));

  const rImageStyle = useAnimatedStyle(() => ({
    width: size + (expandedSize - size) * progress.value,
    height: size + (expandedSize - size) * progress.value,
    borderRadius: (size + (expandedSize - size) * progress.value) / 2,
    left: centerX + offsetX.value,
    top: centerY + offsetY.value,
    transform: [{ scale: imageScale.value }],
    opacity: progress.value,
  }));

  const rButtonsStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [20, 0]) }],
  }));

  const rCloseStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  // Pan to dismiss
  const pan = Gesture.Pan()
    .onStart(() => {
      panStartX.value = offsetX.value;
      panStartY.value = offsetY.value;
    })
    .onChange((event) => {
      offsetX.value += event.changeX / 2;
      offsetY.value += event.changeY / 2;

      const deltaX = offsetX.value - panStartX.value;
      const deltaY = offsetY.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = interpolate(distance, [0, screenWidth / 2], [1, 0.8], {
        extrapolateRight: 'clamp',
      });
      progress.value = interpolate(distance, [0, screenWidth / 2], [1, 0.2], {
        extrapolateRight: 'clamp',
      });
    })
    .onFinalize(() => {
      const deltaX = offsetX.value;
      const deltaY = offsetY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = withTiming(1, TIMING_CONFIG);

      if (distance > expandedSize / 3) {
        progress.value = withTiming(0, TIMING_CONFIG);
        runOnJS(onClose)();
      } else {
        offsetX.value = withTiming(0, TIMING_CONFIG);
        offsetY.value = withTiming(0, TIMING_CONFIG);
        progress.value = withTiming(1, TIMING_CONFIG);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
        onPress={close}
      >
        <AnimatedBlurView
          tint="dark"
          style={StyleSheet.absoluteFill}
          animatedProps={rBackdropProps}
        />

        {/* Close button */}
        <Animated.View
          style={[
            rCloseStyle,
            {
              position: 'absolute',
              right: spacing[5],
              top: insets.top + spacing[4],
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Ionicons name="close" size={20} color="white" />
        </Animated.View>

        {/* Avatar image */}
        <Animated.View
          style={[
            rImageStyle,
            {
              position: 'absolute',
              overflow: 'hidden',
            },
          ]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: avatarBg || colors['surface-container-high'],
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: fs(expandedSize * 0.35), color: colors['on-surface'] }}>
                {initial}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          style={[
            rButtonsStyle,
            {
              position: 'absolute',
              top: centerY + expandedSize + 32,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing[8],
            },
          ]}
        >
          <Pressable
            style={styles.actionBtn}
            onPress={() => { close(); setTimeout(onPickCamera, DURATION + 50); }}
          >
            <View style={styles.actionBtnIcon}>
              <Ionicons name="camera-outline" size={26} color="white" />
            </View>
            <Text style={styles.actionBtnLabel}>Caméra</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => { close(); setTimeout(onPickLibrary, DURATION + 50); }}
          >
            <View style={styles.actionBtnIcon}>
              <Ionicons name="image-outline" size={26} color="white" />
            </View>
            <Text style={styles.actionBtnLabel}>Galerie</Text>
          </Pressable>
        </Animated.View>
      </AnimatedPressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    gap: spacing[2],
  },
  actionBtnIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
});

export default AnimatedAvatarPicker;
