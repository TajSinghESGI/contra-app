import Icon, { type IconName } from '@/components/ui/Icon';
import { fonts, PLANS, radius, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { getCurrentOffering, type PurchasesPackage } from '@/services/revenuecat';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ─────────────────────────────────────────────────────────────────────

type PlanKey = 'pro_monthly' | 'pro_annual';

// ─── Dark palette (paywall is always dark — uses darkColors tokens) ──────────

import { darkColors } from '@/constants/tokens';

const dark = {
  bg:         darkColors.background,
  surface:    darkColors['surface-container-low'],
  surfaceHi:  darkColors['surface-container'],
  text:       darkColors['on-surface'],
  textDim:    darkColors['on-surface-variant'],
  textFaint:  'rgba(232,234,238,0.30)',
  accent:     '#AF52DE',
  border:     darkColors['outline-variant'],
} as const;

// ─── Main screen ────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { subscribe, restore } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro_annual');
  const [packages, setPackages] = useState<{ monthly?: PurchasesPackage; yearly?: PurchasesPackage }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real offerings from RevenueCat
  useEffect(() => {
    getCurrentOffering().then((offering) => {
      if (!offering) return;
      setPackages({
        monthly: offering.monthly ?? undefined,
        yearly: offering.annual ?? undefined,
      });
    });
  }, []);

  const FEATURES: { icon: IconName; label: string }[] = [
    { icon: 'circle-check',  label: t('paywall.features.unlimited') },
    { icon: 'fire',          label: t('paywall.features.brutal') },
    { icon: 'document-edit', label: t('paywall.features.coaching') },
    { icon: 'crown',         label: t('paywall.features.rankings') },
  ];

  const handleSubscribe = async () => {
    const pkg = selectedPlan === 'pro_annual' ? packages.yearly : packages.monthly;
    if (!pkg) return;
    setIsLoading(true);
    try {
      const success = await subscribe(pkg);
      if (success) router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const restored = await restore();
      if (restored) router.back();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Header blur */}
      {Platform.OS !== 'web' && (
        <MaskedView
          style={[styles.headerBlur, { height: insets.top + 70 }]}
          maskElement={
            <LinearGradient
              colors={['black', 'black', 'transparent']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      )}

      {/* Close */}
      <Pressable
        style={[styles.closeButton, { top: insets.top + spacing[3] }]}
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      >
        <View style={styles.closeCircle}>
          <Icon name="circle-x" size={18} color={dark.textDim} />
        </View>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.eyebrow}>{t('paywall.eyebrow')}</Text>
          <Text style={styles.headline}>{t('paywall.headline')}</Text>
          <Text style={styles.subheadline}>{t('paywall.subheadline')}</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIconWrapper}>
                <Icon name={f.icon} size={18} color={dark.text} />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Plan selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.planRow}>
          {/* Monthly */}
          <Pressable
            style={[styles.planCard, selectedPlan === 'pro_monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('pro_monthly')}
          >
            <Text style={[styles.planLabel, selectedPlan === 'pro_monthly' && styles.planLabelActive]}>
              {t('paywall.pro')}
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'pro_monthly' && styles.planPriceActive]}>
              {packages.monthly?.product.priceString ?? `${PLANS.pro_monthly.price}€`}
            </Text>
            <Text style={[styles.planPeriod, selectedPlan === 'pro_monthly' && styles.planPeriodActive]}>
              {t('paywall.perMonth')}
            </Text>
          </Pressable>

          {/* Annual */}
          <Pressable
            style={[styles.planCard, selectedPlan === 'pro_annual' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('pro_annual')}
          >
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>{PLANS.pro_annual.savingsBadge}</Text>
            </View>
            <Text style={[styles.planLabel, selectedPlan === 'pro_annual' && styles.planLabelActive]}>
              {t('paywall.pro')}
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'pro_annual' && styles.planPriceActive]}>
              {packages.yearly?.product.priceString ?? `${PLANS.pro_annual.price}€`}
            </Text>
            <Text style={[styles.planPeriod, selectedPlan === 'pro_annual' && styles.planPeriodActive]}>
              {t('paywall.perYear')}
            </Text>
            <Text style={styles.planPerMonth}>
              {packages.yearly ? `${(packages.yearly.product.price / 12).toFixed(2)}${t('paywall.perMonth')}` : `${(PLANS.pro_annual.price / 12).toFixed(2)}€${t('paywall.perMonth')}`}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Trial nudge */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.trialNudge}>
          <Icon name="info-circle" size={14} color={dark.textDim} />
          <Text style={styles.trialNudgeText}>{t('paywall.subheadline')}</Text>
        </Animated.View>
      </ScrollView>

      {/* CTA sticky */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={[styles.ctaArea, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}
      >
        <Pressable
          style={styles.ctaButton}
          onPress={handleSubscribe}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={dark.bg} />
          ) : (
            <Text style={styles.ctaText}>{t('paywall.cta')}</Text>
          )}
        </Pressable>

        <Text style={styles.legalText}>{t('paywall.legal')}</Text>

        <Pressable hitSlop={8} accessibilityRole="button" onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const createStyles = (_colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: dark.bg,
    },
    headerBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
    },
    closeButton: {
      position: 'absolute',
      right: spacing[5],
      zIndex: 10,
    },
    closeCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: dark.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[6],
    },

    // Header
    header: {
      marginBottom: spacing[5],
    },
    eyebrow: {
      ...typography['label-md'],
      color: dark.accent,
      marginBottom: spacing[4],
    },
    headline: {
      fontFamily: fonts.light,
      fontSize: 42,
      letterSpacing: -1.5,
      lineHeight: 48,
      color: dark.text,
      marginBottom: spacing[2],
    },
    subheadline: {
      fontFamily: fonts.regular,
      fontSize: 16,
      color: dark.textDim,
      lineHeight: 24,
    },

    // Features
    featureList: {
      gap: spacing[3],
      marginBottom: spacing[5],
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
    },
    featureIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      backgroundColor: dark.surfaceHi,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: dark.text,
      flex: 1,
    },

    // Plan cards
    planRow: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    planCard: {
      flex: 1,
      backgroundColor: dark.surface,
      borderRadius: 20,
      padding: spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      borderWidth: 1.5,
      borderColor: 'transparent',
      minHeight: 120,
    },
    planCardSelected: {
      borderColor: dark.text,
      backgroundColor: dark.surfaceHi,
    },
    savingsBadge: {
      position: 'absolute',
      top: -10,
      backgroundColor: dark.accent,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 4,
    },
    savingsBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: '#fff',
      letterSpacing: 0.5,
    },
    planLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: dark.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    planLabelActive: {
      color: dark.text,
    },
    planPrice: {
      fontFamily: fonts.bold,
      fontSize: 24,
      color: dark.textDim,
      letterSpacing: -0.5,
    },
    planPriceActive: {
      color: dark.text,
    },
    planPeriod: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: dark.textDim,
    },
    planPeriodActive: {
      color: dark.textDim,
    },
    planPerMonth: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: dark.textDim,
      marginTop: 4,
      opacity: 0.7,
    },

    // Trial nudge
    trialNudge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginTop: spacing[5],
      paddingHorizontal: spacing[1],
    },
    trialNudgeText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: dark.textDim,
      flex: 1,
    },

    // CTA
    ctaArea: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[3],
      gap: spacing[2],
      alignItems: 'center',
    },
    ctaButton: {
      width: '100%',
      height: 56,
      backgroundColor: dark.text,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: dark.bg,
      letterSpacing: 0.3,
    },
    legalText: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: dark.textFaint,
      textAlign: 'center',
    },
    restoreText: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: dark.textDim,
      textDecorationLine: 'underline',
    },
  });
