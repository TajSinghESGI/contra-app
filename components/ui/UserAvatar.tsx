import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fonts } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface UserAvatarProps {
  size: number;
  initial: string;
  avatarBg?: string;
  avatarUrl?: string;
}

export const UserAvatar = memo(function UserAvatar({
  size,
  initial,
  avatarBg,
  avatarUrl,
}: UserAvatarProps) {
  const { colors, fs } = useTheme();
  const borderRadius = size / 2;
  const fontSize = fs(size * 0.4);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: avatarBg || colors['surface-container-high'],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize, color: colors['on-surface'] }}>
        {initial}
      </Text>
    </View>
  );
});

export default UserAvatar;
