import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fonts } from '@/constants/tokens';

const ILLUSTRATIONS = {
  won: require('@/assets/illustration/won.png'),
  lost: require('@/assets/illustration/lost.png'),
  tie: require('@/assets/illustration/tie.png'),
};

interface ChallengeShareCardProps {
  myName: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
  topic: string;
  won: boolean;
}

const getScoreColor = (s: number) => {
  if (s >= 70) return '#34C759';
  if (s >= 40) return '#FF9500';
  return '#FF3B30';
};

const BG_QUOTES = [
  'ARGUE\nBETTER\nWIN',
  'CLASH\nOF\nMINDS',
  'PROVE\nYOUR\nPOINT',
  'THINK\nFAST\nWIN',
];

export function ChallengeShareCard({ myName, opponentName, myScore, opponentScore, topic, won }: ChallengeShareCardProps) {
  const isTie = myScore === opponentScore;
  const resultLabel = won ? 'VICTOIRE' : isTie ? 'ÉGALITÉ' : 'DÉFAITE';
  const resultColor = won ? '#34C759' : isTie ? '#FF9500' : '#FF3B30';
  const resultIllustration = won ? ILLUSTRATIONS.won : isTie ? ILLUSTRATIONS.tie : ILLUSTRATIONS.lost;
  const bgQuote = BG_QUOTES[myScore % BG_QUOTES.length];
  const winnerName = myScore >= opponentScore ? myName : opponentName;

  return (
    <View style={styles.card} collapsable={false}>
      {/* Background watermark */}
      <Text style={styles.bgQuote}>{bgQuote}</Text>

      {/* Side accent bar */}
      <View style={[styles.sideBar, { backgroundColor: resultColor }]}>
        <Text style={styles.sideBarText}>CONTRA</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Result illustration + label */}
        <Image source={resultIllustration} style={styles.resultImage} />
        <Text style={[styles.resultLabel, { color: resultColor }]}>{resultLabel}</Text>

        {/* VS Scores */}
        <View style={styles.vsRow}>
          {/* My side */}
          <View style={styles.playerCol}>
            <Text style={[styles.playerName, won && styles.winnerName]} numberOfLines={1}>{myName}</Text>
            <Text style={[styles.playerScore, { color: getScoreColor(myScore) }]}>{myScore}</Text>
            <Text style={styles.outOf}>/100</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* Opponent side */}
          <View style={styles.playerCol}>
            <Text style={[styles.playerName, !won && !isTie && styles.winnerName]} numberOfLines={1}>{opponentName}</Text>
            <Text style={[styles.playerScore, { color: getScoreColor(opponentScore) }]}>{opponentScore}</Text>
            <Text style={styles.outOf}>/100</Text>
          </View>
        </View>

        {/* Winner highlight */}
        <View style={[styles.winnerBadge, { backgroundColor: `${resultColor}15` }]}>
          <Text style={[styles.winnerBadgeText, { color: resultColor }]}>
            {isTie ? 'Égalité parfaite' : `${winnerName} l'emporte`}
          </Text>
        </View>

        {/* Topic */}
        <View style={styles.topicBox}>
          <Text style={styles.topicLabel}>SUJET</Text>
          <Text style={styles.topicText} numberOfLines={2}>{topic}</Text>
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
  bgQuote: {
    position: 'absolute',
    top: -10,
    left: -10,
    fontFamily: fonts.bold,
    fontSize: 68,
    lineHeight: 70,
    color: 'rgba(255,255,255,0.03)',
    letterSpacing: -3,
  },
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
  },
  content: {
    paddingLeft: 22,
    paddingRight: 50,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  resultImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  resultLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: 16,
  },

  // VS row
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  playerName: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#666666',
  },
  winnerName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  playerScore: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 44,
  },
  outOf: {
    fontFamily: fonts.light,
    fontSize: 11,
    color: '#444444',
  },
  vsText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#444444',
    letterSpacing: 2,
    marginHorizontal: 6,
  },

  // Winner badge
  winnerBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  winnerBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Topic
  topicBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#FF5722',
    paddingLeft: 10,
    marginBottom: 14,
  },
  topicLabel: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: '#FF5722',
    letterSpacing: 2,
    marginBottom: 3,
  },
  topicText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#BBBBBB',
    lineHeight: 16,
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
