import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/context/SettingsContext';

interface AudioPlayerCardProps {
  text: string;
  audioUrl: string | null;
  messageId: string;
}

// Estimate speech duration for the expo-speech fallback
function estimateDuration(text: string, rate: number): number {
  const wordCount = text.split(/\s+/).length;
  const wordsPerSecond = (150 * rate) / 60;
  return Math.max(wordCount / wordsPerSecond, 1);
}

// Generate a stable waveform pattern per instance
function generateWaveform(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const base = 0.3 + Math.random() * 0.7;
    const clustered = Math.sin(i * 0.4) * 0.3 + base;
    bars.push(Math.max(0.15, Math.min(1, clustered)));
  }
  return bars;
}

const BAR_COUNT = 32;

export default function AudioPlayerCard({ text, audioUrl, messageId }: AudioPlayerCardProps) {
  const Colors = useTheme();
  const { voiceSettings } = useSettings();
  const waveformRef = useRef<number[]>(generateWaveform(BAR_COUNT));

  // ── expo-audio (server URL path) ──────────────────────────────
  // useAudioPlayer accepts null to start with no source.
  // The source is set once and won't change per message card.
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  // Derived from expo-audio status when audioUrl exists
  const serverDuration = status.duration ?? 0;
  const serverElapsed = status.currentTime ?? 0;
  const serverPlaying = status.playing;

  // ── expo-speech fallback (no server audio) ────────────────────
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [speechElapsed, setSpeechElapsed] = useState(0);
  const estimatedDuration = estimateDuration(text, voiceSettings.playbackSpeed);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setSpeechElapsed(prev => {
        const next = prev + 0.1;
        if (next >= estimatedDuration) {
          stopTimer();
          setSpeechPlaying(false);
          return estimatedDuration;
        }
        return next;
      });
    }, 100);
  }, [estimatedDuration, stopTimer]);

  const playViaSpeech = useCallback(
    (fromStart = true) => {
      if (fromStart) setSpeechElapsed(0);

      setSpeechPlaying(true);
      startTimer();

      const wordsArr = text.split(/\s+/);
      const startIdx = fromStart
        ? 0
        : Math.floor((speechElapsed / estimatedDuration) * wordsArr.length);
      const spokenText = wordsArr.slice(startIdx).join(' ');

      Speech.speak(spokenText, {
        language: voiceSettings.outputLanguage,
        rate: voiceSettings.playbackSpeed,
        onDone: () => { stopTimer(); setSpeechPlaying(false); setSpeechElapsed(estimatedDuration); },
        onStopped: () => { stopTimer(); setSpeechPlaying(false); },
        onError: () => { stopTimer(); setSpeechPlaying(false); },
      });
    },
    [text, voiceSettings, estimatedDuration, speechElapsed, startTimer, stopTimer]
  );

  // ── Unified computed state ────────────────────────────────────
  const isPlaying = audioUrl ? serverPlaying : speechPlaying;
  const elapsed   = audioUrl ? serverElapsed : speechElapsed;
  const duration  = audioUrl
    ? (serverDuration > 0 ? serverDuration : estimateDuration(text, 1))
    : estimatedDuration;
  const progress  = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  // ── Audio mode setup ──────────────────────────────────────────
  useEffect(() => {
    if (audioUrl) {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, [audioUrl]);

  // ── Play / Pause handler ──────────────────────────────────────
  const handlePlay = () => {
    if (!voiceSettings.audioEnabled) return;

    if (audioUrl) {
      // expo-audio path — status.playing is always the source of truth
      if (serverPlaying) {
        player.pause();
      } else {
        // If the track has finished, restart from the beginning
        if (serverDuration > 0 && serverElapsed >= serverDuration - 0.2) {
          player.seekTo(0);
        }
        player.play();
      }
    } else {
      // expo-speech fallback
      if (speechPlaying) {
        Speech.stop();
        stopTimer();
        setSpeechPlaying(false);
      } else {
        const isFinished = speechElapsed >= estimatedDuration - 0.1;
        if (isFinished) setSpeechElapsed(0);
        playViaSpeech(isFinished);
      }
    }
  };

  // ── Seek handler ──────────────────────────────────────────────
  const handleSeek = (barIndex: number) => {
    const seekFraction = barIndex / BAR_COUNT;

    if (audioUrl) {
      const seekSec = seekFraction * (serverDuration > 0 ? serverDuration : 0);
      player.seekTo(seekSec);
    } else {
      const seekSec = seekFraction * estimatedDuration;
      setSpeechElapsed(seekSec);

      if (speechPlaying) {
        Speech.stop();
        stopTimer();
        playViaSpeech(false);
      }
    }
  };

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      Speech.stop().catch(() => {});
    };
  }, [stopTimer]);

  const formatTime = (seconds: number): string => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeBarIndex = Math.floor(progress * BAR_COUNT);

  const styles = StyleSheet.create({
    container: {
      marginTop: Spacing.sm,
      backgroundColor: Colors.surface_container_lowest,
      borderRadius: Radii.xl,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.surface_container_highest,
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    },
    playButton: {
      width: 44,
      height: 44,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    playButtonDisabled: {
      backgroundColor: Colors.outline_variant,
    },
    waveformContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      gap: 2,
    },
    bar: {
      width: 3,
      borderRadius: 2,
    },
    timeText: {
      ...Fonts.labelMd,
      color: Colors.on_surface_variant,
      minWidth: 36,
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.playButton, !voiceSettings.audioEnabled && styles.playButtonDisabled]}
        onPress={handlePlay}
        disabled={!voiceSettings.audioEnabled}
      >
        <IconSymbol
          name={isPlaying ? 'pause.fill' : 'play.fill'}
          size={18}
          color={Colors.on_primary}
        />
      </Pressable>

      <Pressable
        style={styles.waveformContainer}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          const containerWidth = BAR_COUNT * 5; // 3px bar + 2px gap
          const tappedBar = Math.floor((locationX / containerWidth) * BAR_COUNT);
          handleSeek(Math.max(0, Math.min(BAR_COUNT - 1, tappedBar)));
        }}
      >
        {waveformRef.current.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: height * 28 + 4,
                backgroundColor:
                  index <= activeBarIndex ? Colors.primary : Colors.outline_variant,
              },
            ]}
          />
        ))}
      </Pressable>

      <Text style={styles.timeText}>
        {formatTime(elapsed > 0 || isPlaying ? elapsed : duration)}
      </Text>
    </View>
  );
}
