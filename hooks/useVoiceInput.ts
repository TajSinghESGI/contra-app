import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';
import i18n from '@/i18n';

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  isAvailable: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useVoiceInput(onTranscript?: (text: string) => void): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  // Check availability on mount
  useEffect(() => {
    try {
      setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch {
      setIsAvailable(false);
    }
  }, []);

  // Listen for results
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal && text.trim()) {
      onTranscriptRef.current?.(text.trim());
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTranscript('');

    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    ExpoSpeechRecognitionModule.start({
      lang: locale,
      interimResults: true,
      continuous: false,
    });

    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return { isListening, transcript, isAvailable, startListening, stopListening };
}
