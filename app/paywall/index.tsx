import Icon, { type IconName } from '@/components/ui/Icon';
import { fonts, PLANS, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getProfile } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { getCurrentOffering, type PurchasesPackage } from '@/services/revenuecat';
import { track } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
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
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { subscribe, restore, isPro, tier } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro_annual');
  const [packages, setPackages] = useState<{ monthly?: PurchasesPackage; yearly?: PurchasesPackage }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real offerings from RevenueCat
  useEffect(() => {
    track(AnalyticsEvents.PAYWALL_VIEWED);
    getCurrentOffering().then((offering) => {
      if (!offering) return;
      setPackages({
        monthly: offering.monthly ?? undefined,
        yearly: offering.annual ?? undefined,
      });
    });
  }, []);

  const COMPARISONS: { icon: IconName; feature: string; free: string; pro: string }[] = [
    { icon: 'fire',          feature: t('paywall.compare.debates'),     free: t('paywall.compare.debatesFree'),    pro: t('paywall.compare.debatesPro') },
    { icon: 'star',          feature: t('paywall.compare.difficulty'),  free: t('paywall.compare.difficultyFree'), pro: t('paywall.compare.difficultyPro') },
    { icon: 'clock',         feature: t('paywall.compare.rounds'),     free: t('paywall.compare.roundsFree'),     pro: t('paywall.compare.roundsPro') },
    { icon: 'document-edit', feature: t('paywall.compare.coaching'),   free: '—',                                  pro: t('paywall.compare.coachingPro') },
    { icon: 'chart-line',    feature: t('paywall.compare.analytics'),  free: '—',                                  pro: t('paywall.compare.analyticsPro') },
    { icon: 'scale',         feature: t('paywall.compare.challenges'), free: '—',                                  pro: t('paywall.compare.challengesPro') },
  ];

  const refreshUser = async () => {
    try {
      const updated = await getProfile();
      const current = useAuthStore.getState().user;
      if (current) useAuthStore.setState({ user: { ...current, ...updated } });
    } catch {}
  };

  const handleSubscribe = async () => {
    const pkg = selectedPlan === 'pro_annual' ? packages.yearly : packages.monthly;
    if (!pkg) return;
    track(AnalyticsEvents.PURCHASE_STARTED, { plan: selectedPlan });
    setIsLoading(true);
    try {
      const success = await subscribe(pkg);
      if (success) {
        await refreshUser();
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const restored = await restore();
      if (restored) {
        await refreshUser();
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Already subscribed — show management screen
  if (isPro) {
    return (
      <View style={[styles.root, { paddingBottom: insets.bottom, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing[6] }]}>
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + spacing[3], left: spacing[5] }}>
          <Icon name="chevron-left" size={22} color={dark.text} />
        </Pressable>

        <Icon name="verified-check" size={48} color={dark.accent} />
        <Text style={[styles.heroTitle, { marginTop: spacing[4], textAlign: 'center' }]}>
          {t('paywall.alreadyPro')}
        </Text>
        <Text style={[styles.legalText, { marginTop: spacing[2], marginBottom: spacing[6] }]}>
          {t('paywall.alreadyProSub')}
        </Text>

        <Pressable
          style={{ width: '100%' }}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            } else {
              Linking.openURL('https://play.google.com/store/account/subscriptions');
            }
          }}
        >
          <LinearGradient
            colors={[dark.accent, dark.accentDim]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{t('paywall.manageSubscription')}</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://contra-app.cloud/terms')}>
            <Text style={styles.legalLinkText}>{t('paywall.termsOfUse')}</Text>
          </Pressable>
          <Text style={styles.legalSep}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://contra-app.cloud/privacy')}>
            <Text style={styles.legalLinkText}>{t('paywall.privacyPolicy')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
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

        {/* Comparison table */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.compareTable}>
          {/* Header row */}
          <View style={styles.compareHeaderRow}>
            <View style={{ flex: 1 }} />
            <Text style={styles.compareHeaderFree}>{t('paywall.compare.free')}</Text>
            <Text style={styles.compareHeaderPro}>{t('paywall.compare.pro')}</Text>
          </View>

          {COMPARISONS.map((c, i) => (
            <Animated.View
              key={c.feature}
              entering={FadeInDown.delay(150 + i * 50).duration(350)}
              style={[styles.compareRow, i === COMPARISONS.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={styles.compareFeature}>
                <Icon name={c.icon} size={14} color={dark.textDim} />
                <Text style={styles.compareFeatureText}>{c.feature}</Text>
              </View>
              <Text style={styles.compareFreeValue}>{c.free}</Text>
              <Text style={styles.compareProValue}>{c.pro}</Text>
            </Animated.View>
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

        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://contra-app.cloud/terms')}>
            <Text style={styles.legalLinkText}>{t('paywall.termsOfUse')}</Text>
          </Pressable>
          <Text style={styles.legalSep}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://contra-app.cloud/privacy')}>
            <Text style={styles.legalLinkText}>{t('paywall.privacyPolicy')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const createStyles = (_colors: ColorTokens, typography: any, fs: (n: number) => number) =>
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
      fontSize: fs(42),
      letterSpacing: -1.5,
      lineHeight: fs(48),
      color: dark.text,
      marginBottom: spacing[2],
    },
    subheadline: {
      fontFamily: fonts.regular,
      fontSize: fs(16),
      color: dark.textDim,
      lineHeight: fs(24),
    },

    // Comparison table
    compareTable: {
      backgroundColor: dark.surface,
      borderRadius: 20,
      padding: spacing[4],
      marginBottom: spacing[5],
    },
    compareHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing[3],
      marginBottom: spacing[1],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    compareHeaderFree: {
      width: 52,
      fontFamily: fonts.semibold,
      fontSize: fs(10),
      color: dark.textDim,
      textAlign: 'center',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    compareHeaderPro: {
      width: 52,
      fontFamily: fonts.bold,
      fontSize: fs(10),
      color: dark.accent,
      textAlign: 'center',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    compareFeature: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    compareFeatureText: {
      fontFamily: fonts.medium,
      fontSize: fs(13),
      color: dark.text,
    },
    compareFreeValue: {
      width: 52,
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: dark.textDim,
      textAlign: 'center',
    },
    compareProValue: {
      width: 52,
      fontFamily: fonts.semibold,
      fontSize: fs(11),
      color: dark.accent,
      textAlign: 'center',
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
      fontSize: fs(11),
      color: '#fff',
      letterSpacing: 0.5,
    },
    planLabel: {
      fontFamily: fonts.semibold,
      fontSize: fs(12),
      color: dark.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    planLabelActive: {
      color: dark.text,
    },
    planPrice: {
      fontFamily: fonts.bold,
      fontSize: fs(24),
      color: dark.textDim,
      letterSpacing: -0.5,
    },
    planPriceActive: {
      color: dark.text,
    },
    planPeriod: {
      fontFamily: fonts.regular,
      fontSize: fs(13),
      color: dark.textDim,
    },
    planPeriodActive: {
      color: dark.textDim,
    },
    planPerMonth: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
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
      fontSize: fs(13),
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
      fontSize: fs(16),
      color: dark.bg,
      letterSpacing: 0.3,
    },
    legalText: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: dark.textFaint,
      textAlign: 'center',
    },
    restoreText: {
      fontFamily: fonts.semibold,
      fontSize: fs(13),
      color: dark.textDim,
      textDecorationLine: 'underline',
    },
    legalLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      marginTop: spacing[3],
    },
    legalLinkText: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: dark.textDim,
      textDecorationLine: 'underline',
    },
    legalSep: {
      fontSize: fs(11),
      color: dark.textFaint,
    },
  });
