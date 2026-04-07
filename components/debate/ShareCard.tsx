import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fonts } from '@/constants/tokens';

interface ShareCardProps {
  score: number;
  topic: string;
  logic: number;
  rhetoric: number;
  evidence: number;
  originality: number;
  verdict: string;
}

const getScoreColor = (s: number) => {
  if (s >= 70) return '#34C759';
  if (s >= 40) return '#FF9500';
  return '#FF3B30';
};

// Rotating background quotes
const BG_QUOTES = [
  'THINK\nDEBATE\nWIN',
  'LOGIC\nIS THE\nWEAPON',
  'ARGUE\nBETTER\nTHINK\nDEEPER',
  'WORDS\nARE\nPOWER',
];

export function ShareCard({ score, topic, logic, rhetoric, evidence, originality, verdict }: ShareCardProps) {
  const bgQuote = BG_QUOTES[score % BG_QUOTES.length];
  const scoreColor = getScoreColor(score);

  const criteria = [
    { label: 'LOG', value: logic },
    { label: 'RHÉ', value: rhetoric },
    { label: 'PRE', value: evidence },
    { label: 'ORI', value: originality },
  ];

  return (
    <View style={styles.card} collapsable={false}>
      {/* Background quote watermark */}
      <Text style={styles.bgQuote}>{bgQuote}</Text>

      {/* Side accent bar */}
      <View style={[styles.sideBar, { backgroundColor: scoreColor }]}>
        <Text style={styles.sideBarText}>CONTRA</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.scoreSlash}>/100</Text>
        </View>

        {/* Verdict */}
        <Text style={styles.verdict}>{verdict}</Text>

        {/* Topic */}
        <View style={styles.topicBox}>
          <Text style={styles.topicText} numberOfLines={3}>{topic}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {criteria.map((c) => (
            <View key={c.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(c.value) }]}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Footer — logo */}
        <View style={styles.footer}>
          <Image source={require('@/assets/images/logo-contra.png')} style={styles.footerLogo} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },

  // Background watermark
  bgQuote: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: 0,
    fontFamily: fonts.bold,
    fontSize: 72,
    lineHeight: 74,
    color: 'rgba(255,255,255,0.03)',
    letterSpacing: -3,
  },

  // Side accent bar (like Spotify RapCaviar)
  sideBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBarText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    width: 100,
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 1,
    transform: [{ rotate: '-90deg' }],
    writingDirection: 'ltr',
  },

  // Main content
  content: {
    paddingLeft: 22,
    paddingRight: 50, // space for side bar
    paddingTop: 28,
    paddingBottom: 20,
  },

  // Score
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scoreNumber: {
    fontFamily: fonts.bold,
    fontSize: 64,
    lineHeight: 68,
  },
  scoreSlash: {
    fontFamily: fonts.light,
    fontSize: 20,
    color: '#444444',
    marginLeft: 4,
  },

  // Verdict
  verdict: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },

  // Topic
  topicBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#FF5722',
    paddingLeft: 10,
    marginBottom: 20,
  },
  topicText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: '#DDDDDD',
    lineHeight: 19,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 7,
    color: '#555555',
    letterSpacing: 1.5,
  },

  // Footer
  footer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  footerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    opacity: 0.5,
  },
});
