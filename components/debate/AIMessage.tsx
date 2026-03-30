import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { spacing, radius, fonts, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TypingDots } from './TypingDots';

interface AIMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const AIMessage = memo(function AIMessage({
  content,
  isStreaming = false,
}: AIMessageProps) {
  const { colors, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const showTypingDots = isStreaming && content.length === 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.senderLabel}>{t('debate.argumentativeAI')}</Text>
        <View style={styles.coreBadge}>
          <Text style={styles.coreBadgeText}>{t('debate.logicCore')}</Text>
        </View>
      </View>

      {/* Content or typing indicator */}
      {showTypingDots ? (
        <TypingDots />
      ) : (
        <TextInput
          style={styles.content}
          value={content}
          editable={false}
          multiline
          scrollEnabled={false}
        />
      )}
    </Animated.View>
  );
});

const createStyles = (colors: ColorTokens, fs: (size: number) => number) => StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: colors['accent-ai-container'],
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[2],
  },
  senderLabel: {
    fontSize: fs(9),
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors['accent-ai'],
  },
  coreBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors['accent-ai'],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coreBadgeText: {
    fontSize: fs(10),
    fontFamily: fonts.medium,
    color: colors['accent-ai'],
  },
  content: {
    fontSize: fs(18),
    fontFamily: fonts.regular,
    lineHeight: 28,
    color: colors['on-surface'],
  },
});

export default AIMessage;
