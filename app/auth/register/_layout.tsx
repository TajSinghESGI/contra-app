import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
