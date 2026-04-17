import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useRef, useEffect } from 'react';
import { useLectureContext } from '@/context/LectureContext';
import { useSettings } from '@/context/SettingsContext';
import { askTeacher } from '@/services/gradioService';
import AudioPlayerCard from '@/components/AudioPlayerCard';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';

type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  time: string;
}

export default function ChatScreen() {
  const Colors = useTheme();
  const { currentFile, setCurrentFile } = useLectureContext();
  const { voiceSettings } = useSettings();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'intro',
    role: 'ai',
    content: "Upload a lecture video, ask a question, and I will answer like your favorite teacher — structured, clear, and calm.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleMicPress = async () => {
    Alert.alert(
      "Voice Support",
      "Native voice transcription requires a cloud build on Expo or an external API on Expo Go. This feature is currently disabled."
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCurrentFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          sizeMB: String(((file.size || 0) / 1024 / 1024).toFixed(2)) + ' MB',
        });
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const answer = await askTeacher(
        currentFile?.uri || null,
        currentFile?.name || null,
        currentFile?.mimeType || null,
        newMsg.content,
        voiceSettings.outputLanguage
      );

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'ai',
        content: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Sorry, I ran into an error getting that explanation.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    headerTitlesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.surface_container_highest,
    },
    headerTitles: {
      flex: 1,
    },
    newChatBtn: {
      backgroundColor: Colors.primary_container,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radii.full,
    },
    newChatBtnText: {
      ...Fonts.labelMd,
      color: Colors.on_primary_container,
      fontWeight: 'bold',
    },
    brandTitle: {
      ...Fonts.labelMd,
      color: Colors.primary,
      fontFamily: 'Manrope_700Bold',
      marginBottom: 2,
    },
    moduleTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
    },
    chatContainer: {
      flex: 1,
    },
    chatContent: {
      padding: Spacing.xl,
      gap: Spacing.lg,
      paddingBottom: Spacing.xxxl,
    },
    messageWrapper: {
      maxWidth: '95%',
      marginBottom: Spacing.sm,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: Colors.primary,
      padding: Spacing.lg,
      borderRadius: Radii.xl,
      borderTopRightRadius: 4,
    },
    userMessageText: {
      ...Fonts.bodyLg,
      color: Colors.on_primary,
    },
    timeText: {
      ...Fonts.labelSm,
      color: Colors.on_surface_variant,
      alignSelf: 'flex-end',
      marginTop: Spacing.xs,
    },
    aiMessage: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.surface_container_low,
      padding: Spacing.lg,
      borderRadius: Radii.xl,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: Colors.surface_container_highest,
    },
    aiMessageText: {
      ...Fonts.bodyLg,
      color: Colors.on_surface,
      lineHeight: 24,
    },
    inputSection: {
      padding: Spacing.lg,
      backgroundColor: Colors.background,
      borderTopWidth: 1,
      borderTopColor: Colors.surface_container_highest,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: Colors.surface_container_lowest,
      borderRadius: Radii.xl,
      padding: Spacing.xs,
      paddingBottom: Spacing.xxl,
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 2,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      ...Fonts.bodyLg,
      color: Colors.on_surface,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    micButton: {
      width: 48,
      height: 48,
      borderRadius: Radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    uploadCard: {
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.outline_variant,
      borderStyle: 'dashed',
      borderRadius: Radii.xl,
      width: '100%',
      padding: Spacing.xxxl,
      alignItems: 'center',
    },
    uploadIconFrame: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    uploadTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    uploadDesc: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      textAlign: 'center',
    },
    primaryButton: {
      marginTop: Spacing.xxl,
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxl,
      borderRadius: Radii.full,
    },
    primaryButtonText: {
      ...Fonts.labelLg,
      color: Colors.on_primary,
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Header title="Teacher Chat" />
      
      {!currentFile ? (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="arrow.up.circle.fill" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Upload Lecture Material</Text>
            <Text style={styles.uploadDesc}>Select a video, audio, or document to start your learning session.</Text>
            <Text style={[styles.uploadDesc, { marginTop: 8, fontSize: 12, opacity: 0.7 }]}>Supports Mp4, MOV, MP3, Wav files upto 500mb</Text>
            <Pressable style={styles.primaryButton} onPress={pickDocument}>
              <Text style={styles.primaryButtonText}>Select File</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.headerTitlesContainer}>
            <View style={styles.headerTitles}>
              <Text style={styles.brandTitle}>ExplainLikeMyTeacher</Text>
              <Text style={styles.moduleTitle} numberOfLines={1}>{currentFile.name}</Text>
            </View>
            <Pressable 
              style={styles.newChatBtn}
              onPress={() => setCurrentFile(null)}
            >
              <Text style={styles.newChatBtnText}>New +</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            ref={scrollViewRef}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageWrapper, { alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }]}>
                <View style={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
                  <Text style={msg.role === 'user' ? styles.userMessageText : styles.aiMessageText}>
                    {msg.content}
                  </Text>
                </View>
                <Text style={[styles.timeText, { alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginTop: Spacing.xs }]}>{msg.time}</Text>
                {msg.role === 'ai' && msg.id !== 'intro' && (
                  <AudioPlayerCard text={msg.content} messageId={msg.id} />
                )}
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageWrapper, { alignSelf: 'flex-start' }]}>
                <View style={styles.aiMessage}>
                  <Text style={styles.aiMessageText}>Thinking...</Text>
                </View>
              </View>
            )}

          </ScrollView>

          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor={Colors.outline_variant}
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
              {inputText.length > 0 ? (
                <Pressable style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
                  <IconSymbol name="arrow.up" size={20} color={Colors.on_primary} />
                </Pressable>
              ) : (
                <Pressable 
                  style={styles.micButton} 
                  onPress={handleMicPress}
                >
                  <IconSymbol 
                    name="mic.fill" 
                    size={24} 
                    color={Colors.outline} 
                  />
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
