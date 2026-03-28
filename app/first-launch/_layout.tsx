import { Stack } from 'expo-router';

export default function FirstLaunchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="demo" />
      <Stack.Screen name="font-size" />
    </Stack>
  );
}
