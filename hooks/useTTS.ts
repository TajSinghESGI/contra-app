import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import i18n from '@/i18n';

interface UseTTSReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtterance = useRef<string | null>(null);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    currentUtterance.current = null;
  }, []);

  // Stop TTS when component unmounts
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const speak = useCallback((text: string) => {
    // Stop any current speech first
    Speech.stop();

    if (!text.trim()) return;

    currentUtterance.current = text;
    setIsSpeaking(true);

    const language = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    Speech.speak(text, {
      language,
      rate: 1.05,
      pitch: 1.0,
      onDone: () => {
        if (currentUtterance.current === text) {
          setIsSpeaking(false);
          currentUtterance.current = null;
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
        currentUtterance.current = null;
      },
      onError: () => {
        setIsSpeaking(false);
        currentUtterance.current = null;
      },
    });
  }, []);

  return { isSpeaking, speak, stop };
}
