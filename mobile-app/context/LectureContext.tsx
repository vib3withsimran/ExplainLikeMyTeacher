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
  teacherEmail: string | null;
  setTeacherEmail: (email: string | null) => void;
  teacherVerified: boolean;
  setTeacherVerified: (verified: boolean) => void;
}

const LectureContext = createContext<LectureContextType | undefined>(undefined);

export function LectureProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile] = useState<LectureFile | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [teacherVerified, setTeacherVerified] = useState(false);

  return (
    <LectureContext.Provider value={{
      currentFile, setCurrentFile,
      teacherEmail, setTeacherEmail,
      teacherVerified, setTeacherVerified,
    }}>
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
