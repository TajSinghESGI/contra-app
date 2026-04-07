/**
 * Centralized sound service for CONTRA.
 * Uses expo-av for short sound effects.
 * Respects iOS silent mode by default.
 */

import { Audio } from 'expo-av';

// Pre-loaded sound instances
let scoreRevealSound: Audio.Sound | null = null;
let levelUpSound: Audio.Sound | null = null;
let badgeUnlockSound: Audio.Sound | null = null;

/**
 * Preload all sounds at app startup.
 * Call this once in the root layout.
 */
export async function preloadSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // respect silent switch
      staysActiveInBackground: false,
    });

    const [s1, s2, s3] = await Promise.all([
      Audio.Sound.createAsync(require('@/assets/sounds/score-reveal.mp3')),
      Audio.Sound.createAsync(require('@/assets/sounds/level-up.mp3')),
      Audio.Sound.createAsync(require('@/assets/sounds/badge-unlock.mp3')),
    ]);

    scoreRevealSound = s1.sound;
    levelUpSound = s2.sound;
    badgeUnlockSound = s3.sound;
  } catch {
    // Sounds are optional — fail silently
  }
}

async function play(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Ignore playback errors
  }
}

export const playScoreReveal = () => play(scoreRevealSound);
export const playLevelUp = () => play(levelUpSound);
export const playBadgeUnlock = () => play(badgeUnlockSound);

/**
 * Cleanup — call on app unmount (optional).
 */
export async function unloadSounds(): Promise<void> {
  await scoreRevealSound?.unloadAsync();
  await levelUpSound?.unloadAsync();
  await badgeUnlockSound?.unloadAsync();
}
