import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getActivityFeed, type ActivityEntry } from '@/services/api';

function ActivityRow({ item, colors, fs }: { item: ActivityEntry; colors: ColorTokens; fs: (n: number) => number }) {
  return (
    <View style={rowStyles(colors, fs).row}>
      <UserAvatar
        size={40}
        initial={item.initial}
        avatarBg={item.bg}
        avatarUrl={item.avatarUrl}
      />
      <View style={rowStyles(colors, fs).content}>
        <Text style={rowStyles(colors, fs).name}>{item.name}</Text>
        <Text style={rowStyles(colors, fs).snippet} numberOfLines={2}>{item.snippet}</Text>
      </View>
      <Text style={rowStyles(colors, fs).time}>{item.time}</Text>
    </View>
  );
}

const rowStyles = (colors: ColorTokens, fs: (n: number) => number) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    ...shadows.ambient,
  },
  content: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-surface'],
    lineHeight: fs(18),
  },
  snippet: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    lineHeight: fs(18),
    marginTop: 2,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },
});

export default function ActivityListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActivityFeed()
      .then(setActivity)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>{t('home.recentActivity')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activity.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('home.noActivity')}</Text>
        </View>
      ) : (
        <LegendList
          data={activity}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityRow item={item} colors={colors} fs={fs} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[8] }]}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={68}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ambient,
  },
  headerLabel: {
    ...typography['label-md'],
    color: colors.outline,
  },
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface-variant'],
  },
});
