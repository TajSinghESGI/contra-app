import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { StyleSheet } from 'react-native';

export const createSharedStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors['surface-container-highest'] },
  dotActive: { width: 20, backgroundColor: colors.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing[4] },
  card: {
    backgroundColor: colors['surface-container-lowest'], borderRadius: 32, padding: spacing[7],
    ...shadows.ambient,
  },
  stepLabel: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  title: { ...typography['headline-md'], color: colors['on-surface'], marginBottom: 6 },
  subtitle: { ...typography['body-sm'], color: colors['on-surface-variant'], marginBottom: spacing[6] },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: fs(13), color: colors['on-surface'], marginBottom: spacing[2] },
  inputWrapper: {
    backgroundColor: colors['surface-container-low'], borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', borderColor: 'transparent',
  },
  input: { flex: 1, paddingHorizontal: spacing[4], paddingVertical: 14, fontFamily: fonts.regular, fontSize: fs(15), color: colors['on-surface'] },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  ctaWrapper: {
    marginTop: spacing[6], borderRadius: radius.full,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 3,
  },
  ctaDisabled: { opacity: 0.5, shadowOpacity: 0 },
  ctaGradient: { borderRadius: radius.full, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.semibold, fontSize: fs(15), color: colors['on-primary'], letterSpacing: 0.5 },
});
