import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LectureFile {
  uri: string;
  name: string;
  sizeMB: string;
  mimeType: string;
}

interface LectureContextType {
  currentFile: LectureFile | null;
  setCurrentFile: (file: LectureFile | null) => void;
}

const LectureContext = createContext<LectureContextType | undefined>(undefined);

export function LectureProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile] = useState<LectureFile | null>(null);

  return (
    <LectureContext.Provider value={{ currentFile, setCurrentFile }}>
      {children}
    </LectureContext.Provider>
  );
}

export function useLectureContext() {
  const context = useContext(LectureContext);
  if (context === undefined) {
    throw new Error('useLectureContext must be used within a LectureProvider');
  }
  return context;
}
