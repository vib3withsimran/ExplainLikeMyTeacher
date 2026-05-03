-- ============================================================
-- ExplainLikeMyTeacher — Supabase Schema
-- Run this in: supabase.com → your project → SQL Editor → New query
-- ============================================================

-- Table 1: lecture_files
-- Records every file a user uploads
CREATE TABLE IF NOT EXISTS lecture_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  teacher_email TEXT,
  file_name     TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- Table 2: chat_sessions
-- Groups messages together under one file upload event
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id    UUID REFERENCES lecture_files(id) ON DELETE CASCADE NOT NULL,
  language   TEXT DEFAULT 'english',
  started_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: interactions
-- Every single chat message (user question + AI answer)
CREATE TABLE IF NOT EXISTS interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role       TEXT CHECK (role IN ('user', 'ai')) NOT NULL,
  content    TEXT NOT NULL,
  audio_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE lecture_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions   ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only see/edit their own lecture files
CREATE POLICY "Users manage own files"
  ON lecture_files FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: users can only see/edit their own sessions
CREATE POLICY "Users manage own sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: users can only see messages from their own sessions
CREATE POLICY "Users manage own interactions"
  ON interactions FOR ALL
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );
