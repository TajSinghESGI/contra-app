import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Icon from '@/components/ui/Icon';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

const TOPIC_KEYS = [
  'ai', 'politics', 'philosophy', 'science',
  'economy', 'environment', 'education', 'health',
  'technology', 'culture', 'sport', 'history',
  'society', 'law', 'ethics', 'religion',
] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
  selectedTopics: string[];
  toggleTopic: (topic: string) => void;
}

export function TopicsBottomSheet({ visible, onClose, onDone, selectedTopics, toggleTopic }: Props) {
  const { colors, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const canDone = selectedTopics.length >= 3;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>{t('auth.register.topics.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.topics.subtitle')}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.grid}>
              {TOPIC_KEYS.map((key) => {
                const selected = selectedTopics.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleTopic(key);
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    {selected && <Icon name="check" size={11} color={colors['surface-container-lowest']} style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(`topics.${key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Text style={styles.hint}>
            {canDone
              ? t('auth.register.topics.selected', { count: selectedTopics.length })
              : t('auth.register.topics.remaining', { count: 3 - selectedTopics.length })}
          </Text>

          <Pressable onPress={canDone ? onDone : undefined} disabled={!canDone}>
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              style={[styles.cta, !canDone && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>{t('common.continue')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorTokens, fs: (n: number) => number) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors['surface-container-lowest'],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[5],
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors['outline-variant'],
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fs(22),
    color: colors['on-surface'],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
    marginBottom: spacing[4],
  },
  scroll: {
    maxHeight: 300,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
  },
  chipSelected: {
    backgroundColor: colors['on-surface'],
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface'],
  },
  chipTextSelected: {
    color: colors['surface-container-lowest'],
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['outline-variant'],
    textAlign: 'center',
    marginVertical: spacing[3],
  },
  cta: {
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});
