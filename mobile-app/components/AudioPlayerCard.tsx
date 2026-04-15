import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/context/SettingsContext';

interface AudioPlayerCardProps {
  text: string;
  messageId: string;
}

// Estimate speech duration based on word count and rate
// Average English speech: ~150 words per minute at 1x
function estimateDuration(text: string, rate: number): number {
  const wordCount = text.split(/\s+/).length;
  const wordsPerSecond = (150 * rate) / 60;
  return Math.max(wordCount / wordsPerSecond, 1);
}

// Generate random waveform bar heights for visual effect
function generateWaveform(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // Create a natural-looking waveform pattern
    const base = 0.3 + Math.random() * 0.7;
    // Add some clustering for a more organic look
    const clustered = Math.sin(i * 0.4) * 0.3 + base;
    bars.push(Math.max(0.15, Math.min(1, clustered)));
  }
  return bars;
}

const BAR_COUNT = 32;

export default function AudioPlayerCard({ text, messageId }: AudioPlayerCardProps) {
  const Colors = useTheme();
  const { voiceSettings } = useSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<number[]>(generateWaveform(BAR_COUNT));

  const totalDuration = estimateDuration(text, voiceSettings.playbackSpeed);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 0.1;
        const newProgress = Math.min(next / totalDuration, 1);
        setProgress(newProgress);
        if (newProgress >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 100);
  }, [totalDuration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePlay = async () => {
    if (!voiceSettings.audioEnabled) return;

    if (isPlaying) {
      // Stop
      await Speech.stop();
      stopTimer();
      setIsPlaying(false);
      return;
    }

    // Reset if finished
    if (progress >= 1) {
      setProgress(0);
      setElapsed(0);
    }

    setIsPlaying(true);
    startTimer();

    Speech.speak(text, {
      language: voiceSettings.outputLanguage,
      rate: voiceSettings.playbackSpeed,
      onDone: () => {
        stopTimer();
        setIsPlaying(false);
        setProgress(1);
        setElapsed(totalDuration);
      },
      onStopped: () => {
        stopTimer();
        setIsPlaying(false);
      },
      onError: () => {
        stopTimer();
        setIsPlaying(false);
      },
    });
  };

  const handleSeek = (barIndex: number) => {
    const seekProgress = barIndex / BAR_COUNT;
    const seekTime = seekProgress * totalDuration;
    setProgress(seekProgress);
    setElapsed(seekTime);

    // Restart speech from approximate position
    // (expo-speech doesn't support seeking, so we restart from a word offset)
    if (isPlaying) {
      Speech.stop();
      stopTimer();

      const words = text.split(/\s+/);
      const startWordIndex = Math.floor(seekProgress * words.length);
      const remainingText = words.slice(startWordIndex).join(' ');

      if (remainingText.trim()) {
        startTimer();
        Speech.speak(remainingText, {
          language: voiceSettings.outputLanguage,
          rate: voiceSettings.playbackSpeed,
          onDone: () => {
            stopTimer();
            setIsPlaying(false);
            setProgress(1);
            setElapsed(totalDuration);
          },
          onStopped: () => {
            stopTimer();
            setIsPlaying(false);
          },
          onError: () => {
            stopTimer();
            setIsPlaying(false);
          },
        });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      Speech.stop();
    };
  }, [stopTimer]);

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
          // Calculate which bar was tapped
          const { locationX } = e.nativeEvent;
          const containerWidth = BAR_COUNT * 5; // approx width (3px bar + 2px gap)
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
                backgroundColor: index <= activeBarIndex
                  ? Colors.primary
                  : Colors.outline_variant,
              },
            ]}
          />
        ))}
      </Pressable>

      <Text style={styles.timeText}>
        {isPlaying || elapsed > 0
          ? formatTime(elapsed)
          : formatTime(totalDuration)}
      </Text>
    </View>
  );
}
