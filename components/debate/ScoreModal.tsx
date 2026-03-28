import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing, radius, SCORE_CRITERIA, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { ScoreResult } from '@/store/debateStore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { BottomSheetMethods } from '@/components/ui/BottomSheet/types';
import { LiveScoreBar } from './LiveScoreBar';

interface ScoreModalProps {
  visible: boolean;
  score: ScoreResult;
  onClose: () => void;
  onViewDetails: () => void;
}

export const ScoreModal = memo(function ScoreModal({
  visible,
  score,
  onClose,
  onViewDetails,
}: ScoreModalProps) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { t } = useTranslation();
  const ref = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (visible) ref.current?.expand();
    else ref.current?.close();
  }, [visible]);

  const criteriaScores: Record<string, number> = {
    logic: score.logic,
    rhetoric: score.rhetoric,
    evidence: score.evidence,
    originality: score.originality,
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={['60%']}
      onClose={onClose}
      enableHapticFeedback
    >
      {/* Verdict section */}
      <View style={styles.verdictSection}>
        <Text style={styles.verdictLabel}>{t('result.sessionVerdict')}</Text>
        <Text style={styles.verdictText}>{score.verdict}</Text>
        <Text style={styles.totalScore}>
          {score.total}
          <Text style={styles.totalScoreSuffix}>{t('result.scoreOutOf')}</Text>
        </Text>
      </View>

      {/* Criteria bars */}
      <View style={styles.criteriaSection}>
        {SCORE_CRITERIA.map((criterion) => (
          <View key={criterion.key} style={styles.criterionRow}>
            <LiveScoreBar
              score={criteriaScores[criterion.key] ?? 0}
              label={criterion.label}
            />
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={onViewDetails}
          style={styles.primaryButtonWrapper}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors['accent-user'], colors['accent-user-dim']]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonLabel}>{t('result.viewAnalysis')}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={styles.ghostButton}
          accessibilityRole="button"
        >
          <Text style={styles.ghostButtonLabel}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
});

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  verdictSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  verdictLabel: {
    ...typography['label-sm'],
    color: colors['outline-variant'],
    marginBottom: spacing[2],
  },
  verdictText: {
    ...typography['display-sm'],
    color: colors['on-surface'],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  totalScore: {
    ...typography['display-lg'],
    fontFamily: fonts.thin,
    color: colors['on-surface'],
    lineHeight: 72,
  },
  totalScoreSuffix: {
    fontFamily: fonts.light,
    fontSize: fs(32),
    letterSpacing: -0.5,
    color: colors['on-surface-variant'],
  },
  criteriaSection: {
    gap: spacing[4],
    marginBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  criterionRow: {
    flex: 1,
  },
  actions: {
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  primaryButtonWrapper: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    letterSpacing: 0.8,
    color: colors['on-primary'],
  },
  ghostButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },
});

export default ScoreModal;
