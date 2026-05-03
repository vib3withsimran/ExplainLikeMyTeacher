import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import { useState, useCallback } from 'react';
import { getChatHistory, deleteChatSession, ChatSession } from '@/services/dbService';
import { useFocusEffect, router } from 'expo-router';

// ── Helpers ──────────────────────────────────────────────────────
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return 'doc.fill';
  if (mimeType.includes('pdf')) return 'doc.text.fill';
  if (mimeType.includes('video')) return 'video.fill';
  if (mimeType.includes('audio')) return 'waveform';
  if (mimeType.includes('image')) return 'photo.fill';
  return 'doc.fill';
}

// ── Component ─────────────────────────────────────────────────────
export default function HistoryScreen() {
  const Colors = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await getChatHistory();
    setSessions(data);
    setLoading(false);
  }, []);

  // Reload every time the screen comes into focus
  useFocusEffect(useCallback(() => {
    loadHistory();
  }, [loadHistory]));

  const handleDelete = (session: ChatSession, e: any) => {
    e.stopPropagation?.();
    Alert.alert(
      'Delete Session',
      `Delete this session and all ${session.interactions?.length ?? 0} messages? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatSession(session.id, session.file_id);
              setSessions(prev => prev.filter(s => s.id !== session.id));
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenSession = (session: ChatSession) => {
    router.push({
      pathname: '/(drawer)/chat',
      params: {
        sessionId: session.id,
        sessionFileName: session.lecture_files?.file_name ?? 'Previous session',
      },
    });
  };

  const s = makeStyles(Colors);

  // ── Empty state ──
  if (!loading && sessions.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <Header title="History" />
        <View style={s.emptyContainer}>
          <View style={s.emptyIcon}>
            <IconSymbol name="clock.fill" size={40} color={Colors.outline} />
          </View>
          <Text style={s.emptyTitle}>No sessions yet</Text>
          <Text style={s.emptyText}>
            Start a Teacher Chat and your conversation history will appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Header title="History" />

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadingText}>Loading your sessions…</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</Text>

          {sessions.map((session) => {
            const msgCount = session.interactions?.length ?? 0;
            const firstUserMsg = session.interactions?.find(m => m.role === 'user');
            const previewText = firstUserMsg?.content?.substring(0, 80) || 'No messages yet';

            return (
              <Pressable
                key={session.id}
                style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => handleOpenSession(session)}
              >
                <View style={s.cardHeader}>
                  <View style={s.iconBox}>
                    <IconSymbol
                      name={getFileIcon(session.lecture_files?.mime_type ?? null) as any}
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={s.cardMeta}>
                    <Text style={s.fileName} numberOfLines={1}>
                      {session.lecture_files?.file_name ?? 'Unknown file'}
                    </Text>
                    <Text style={s.previewText} numberOfLines={2}>
                      {previewText}{previewText.length >= 80 ? '…' : ''}
                    </Text>
                    <Text style={s.metaRow}>
                      {formatDate(session.started_at)} · {msgCount} message{msgCount !== 1 ? 's' : ''} · {session.language}
                    </Text>
                    {session.lecture_files?.teacher_email ? (
                      <Text style={s.teacherEmail}>
                        👩‍🏫 {session.lecture_files.teacher_email}
                      </Text>
                    ) : null}
                  </View>

                  <View style={s.cardActions}>
                    <Pressable
                      style={({ pressed }) => [s.deleteIconBtn, { opacity: pressed ? 0.5 : 1 }]}
                      onPress={(e) => handleDelete(session, e)}
                      hitSlop={12}
                    >
                      <IconSymbol name="trash.fill" size={18} color={Colors.error} />
                    </Pressable>
                    <IconSymbol name="chevron.right" size={14} color={Colors.outline} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(Colors: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scroll: { flex: 1 },
    content: {
      padding: Spacing.xl,
      paddingBottom: 100,
    },
    sectionTitle: {
      ...Fonts.labelLg,
      color: Colors.on_surface_variant,
      marginBottom: Spacing.lg,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    loadingText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xxl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: Colors.surface_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    emptyTitle: {
      ...Fonts.headlineMd,
      color: Colors.on_surface,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Session card
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radii.xl,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.surface_container_highest,
      overflow: 'hidden',
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      backgroundColor: Colors.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardMeta: { flex: 1 },
    fileName: {
      ...Fonts.labelLg,
      color: Colors.on_surface,
      marginBottom: 2,
    },
    previewText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      marginBottom: 4,
      lineHeight: 20,
    },
    metaRow: {
      ...Fonts.bodySm,
      color: Colors.outline,
    },
    teacherEmail: {
      ...Fonts.bodySm,
      color: Colors.primary,
      marginTop: 2,
    },
    cardActions: {
      alignItems: 'center',
      gap: Spacing.md,
    },
    deleteIconBtn: {
      width: 36,
      height: 36,
      borderRadius: Radii.full,
      backgroundColor: Colors.error_container,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
