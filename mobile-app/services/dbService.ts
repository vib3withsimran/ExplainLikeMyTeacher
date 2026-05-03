/**
 * dbService.ts
 * All database read/write operations for ExplainLikeMyTeacher.
 * Every function assumes the user is already authenticated via Supabase Auth.
 */

import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ChatSession {
  id: string;
  file_id: string;
  language: string;
  started_at: string;
  lecture_files: {
    file_name: string;
    teacher_email: string | null;
    mime_type: string | null;
  };
  interactions: Interaction[];
}

export interface Interaction {
  id: string;
  session_id: string;
  role: 'user' | 'ai';
  content: string;
  audio_url: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// Write operations (called during chat)
// ─────────────────────────────────────────────

/**
 * Save a newly uploaded lecture file to the database.
 * Returns the new file row ID to use when creating a session.
 */
export async function saveLectureFile(
  teacherEmail: string | null,
  fileName: string,
  mimeType: string | null,
  sizeBytes: number | null
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('lecture_files')
    .insert({
      user_id: user.id,
      teacher_email: teacherEmail,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save file: ${error.message}`);
  return data.id;
}

/**
 * Create a new chat session for a given file.
 * Returns the session ID.
 */
export async function createChatSession(
  fileId: string,
  language: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user.id,
      file_id: fileId,
      language,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data.id;
}

/**
 * Save a single chat message (user or AI).
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'ai',
  content: string,
  audioUrl?: string | null
): Promise<void> {
  const { error } = await supabase.from('interactions').insert({
    session_id: sessionId,
    role,
    content,
    audio_url: audioUrl ?? null,
  });

  if (error) {
    // Non-fatal: log but don't crash the chat
    console.warn('Failed to save message:', error.message);
  }
}

// ─────────────────────────────────────────────
// Read operations (called by History screen)
// ─────────────────────────────────────────────

/**
 * Fetch all chat sessions for the current user, newest first.
 * Each session includes its lecture file info and all messages.
 */
export async function getChatHistory(): Promise<ChatSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      file_id,
      language,
      started_at,
      lecture_files ( file_name, teacher_email, mime_type ),
      interactions ( id, session_id, role, content, audio_url, created_at )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (error) {
    console.warn('Failed to fetch history:', error.message);
    return [];
  }

  // Sort interactions within each session chronologically
  return (data as ChatSession[]).map((session) => ({
    ...session,
    interactions: (session.interactions ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));
}
