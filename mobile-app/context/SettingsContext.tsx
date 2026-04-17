import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface VoiceSettings {
  audioEnabled: boolean;
  autoPlayAudio: boolean;
  playbackSpeed: number; // 0.75, 1, 1.5, 2
  outputLanguage: string;
  voiceSelection: string;
}

interface SettingsContextType {
  voiceSettings: VoiceSettings;
  setAudioEnabled: (value: boolean) => void;
  setAutoPlayAudio: (value: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setOutputLanguage: (lang: string) => void;
  setVoiceSelection: (voice: string) => void;
}

const defaultSettings: VoiceSettings = {
  audioEnabled: true,
  autoPlayAudio: true,
  playbackSpeed: 1,
  outputLanguage: 'english',
  voiceSelection: 'Default',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultSettings);

  const setAudioEnabled = (value: boolean) =>
    setVoiceSettings(prev => ({ ...prev, audioEnabled: value }));

  const setAutoPlayAudio = (value: boolean) =>
    setVoiceSettings(prev => ({ ...prev, autoPlayAudio: value }));

  const setPlaybackSpeed = (speed: number) =>
    setVoiceSettings(prev => ({ ...prev, playbackSpeed: speed }));

  const setOutputLanguage = (lang: string) =>
    setVoiceSettings(prev => ({ ...prev, outputLanguage: lang }));

  const setVoiceSelection = (voice: string) =>
    setVoiceSettings(prev => ({ ...prev, voiceSelection: voice }));

  return (
    <SettingsContext.Provider
      value={{
        voiceSettings,
        setAudioEnabled,
        setAutoPlayAudio,
        setPlaybackSpeed,
        setOutputLanguage,
        setVoiceSelection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
