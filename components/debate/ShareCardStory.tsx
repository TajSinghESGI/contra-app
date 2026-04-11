import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fonts } from '@/constants/tokens';

interface ShareCardStoryProps {
  score: number;
  topic: string;
  logic: number;
  rhetoric: number;
  evidence: number;
  originality: number;
  verdict: string;
  debateId?: string;
}

// Accent color — graphite primary, always the same regardless of score
const ACCENT = '#8A8A8A';
const ACCENT_DIM = '#5f5e5e';

// Rotating background quotes
const BG_QUOTES = [
  'THINK\nDEBATE\nWIN',
  'LOGIC\nIS THE\nWEAPON',
  'ARGUE\nBETTER\nTHINK\nDEEPER',
  'WORDS\nARE\nPOWER',
];

export function ShareCardStory({
  score,
  topic,
  logic,
  rhetoric,
  evidence,
  originality,
  verdict,
  debateId,
}: ShareCardStoryProps) {
  const bgQuote = BG_QUOTES[score % BG_QUOTES.length];

  const criteria = [
    { label: 'LOG', value: logic },
    { label: 'RHE', value: rhetoric },
    { label: 'PRE', value: evidence },
    { label: 'ORI', value: originality },
  ];

  return (
    <View style={styles.card} collapsable={false}>
      {/* Background quote watermark */}
      <Text style={styles.bgQuote}>{bgQuote}</Text>

      {/* Top branding label */}
      <View style={styles.brandingBar}>
        <Text style={styles.brandingText}>CONTRA</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Large score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreSlash}>/100</Text>
        </View>

        {/* Verdict */}
        <Text style={styles.verdict} numberOfLines={2}>
          {verdict}
        </Text>

        {/* Topic box */}
        <View style={styles.topicBox}>
          <Text style={styles.topicText} numberOfLines={3}>
            {topic}
          </Text>
        </View>

        {/* Criteria grid 2x2 */}
        <View style={styles.criteriaGrid}>
          <View style={styles.criteriaRow}>
            {criteria.slice(0, 2).map((c) => (
              <View key={c.label} style={styles.criteriaItem}>
                <Text style={styles.criteriaValue}>{c.value}</Text>
                <Text style={styles.criteriaLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.criteriaRow}>
            {criteria.slice(2, 4).map((c) => (
              <View key={c.label} style={styles.criteriaItem}>
                <Text style={styles.criteriaValue}>{c.value}</Text>
                <Text style={styles.criteriaLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer — logo + URL */}
        <View style={styles.footer}>
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.footerLogo}
          />
          {debateId ? (
            <Text style={styles.footerUrl}>
              contra-app.cloud/d/{debateId}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 533,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },

  // Background watermark
  bgQuote: {
    position: 'absolute',
    top: 20,
    left: -10,
    right: 0,
    fontFamily: fonts.bold,
    fontSize: 64,
    lineHeight: 66,
    color: 'rgba(255,255,255,0.03)',
    letterSpacing: -3,
  },

  // Top branding bar
  brandingBar: {
    backgroundColor: ACCENT_DIM,
    paddingVertical: 10,
    alignItems: 'center',
  },
  brandingText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#EEEEEE',
    letterSpacing: 4,
  },

  // Main content
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  // Score
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scoreNumber: {
    fontFamily: fonts.bold,
    fontSize: 72,
    lineHeight: 76,
    color: '#FFFFFF',
  },
  scoreSlash: {
    fontFamily: fonts.light,
    fontSize: 22,
    color: '#444444',
    marginLeft: 4,
  },

  // Verdict
  verdict: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#777777',
    marginBottom: 16,
  },

  // Topic
  topicBox: {
    borderLeftWidth: 2,
    borderLeftColor: ACCENT,
    paddingLeft: 10,
    marginBottom: 20,
  },
  topicText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  // Criteria 2x2 grid
  criteriaGrid: {
    gap: 6,
    marginBottom: 16,
  },
  criteriaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  criteriaItem: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  criteriaValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#CCCCCC',
  },
  criteriaLabel: {
    fontFamily: fonts.medium,
    fontSize: 8,
    color: '#555555',
    letterSpacing: 1.5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    opacity: 0.5,
  },
  footerUrl: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: '#555555',
  },
});
