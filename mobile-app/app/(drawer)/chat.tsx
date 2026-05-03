import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useRef, useEffect } from 'react';
import { useLectureContext } from '@/context/LectureContext';
import { useSettings } from '@/context/SettingsContext';
import { askTeacher, sendOtp as sendOtpApi, TeacherResponse } from '@/services/gradioService';
import { saveLectureFile, createChatSession, saveMessage } from '@/services/dbService';
import AudioPlayerCard from '@/components/AudioPlayerCard';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';

type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  audioUrl?: string | null;
  time: string;
}

// ─── Multi-step form types ───
type FormStep = 'upload' | 'verify' | 'otp' | 'done';

export default function ChatScreen() {
  const Colors = useTheme();
  const { currentFile, setCurrentFile, teacherEmail, setTeacherEmail, setTeacherVerified } = useLectureContext();
  const { voiceSettings } = useSettings();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'intro',
    role: 'ai',
    content: "Upload a lecture video, ask a question, and I will answer like your favorite teacher — structured, clear, and calm.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);

  // ─── Form state ───
  const [formStep, setFormStep] = useState<FormStep>('upload');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType: string; sizeMB: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ─── DB session tracking ───
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleMicPress = async () => {
    Alert.alert(
      "Voice Support",
      "Native voice transcription requires a cloud build on Expo or an external API on Expo Go. This feature is currently disabled."
    );
  };

  // ─── Step 1: Pick file ───
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setPickedFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          sizeMB: String(((file.size || 0) / 1024 / 1024).toFixed(2)) + ' MB',
        });
        setFormStep('verify');
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  // ─── Step 2: Send OTP ───
  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', "Please enter the teacher's Gmail ID.");
      return;
    }
    if (!consent) {
      Alert.alert('Consent Required', 'Please confirm you have teacher permission.');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail address.');
      return;
    }

    setSendingOtp(true);
    try {
      const status = await sendOtpApi(email.trim());
      console.log('OTP send status:', status);
      setOtpSent(true);
      setFormStep('otp');
      Alert.alert('OTP Sent', `A verification OTP has been sent to ${email.trim()}`);
    } catch (err: any) {
      console.error('OTP send error:', err);
      Alert.alert('OTP Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ─── Step 3: Verify OTP & proceed ───
  const handleVerifyAndSubmit = async () => {
    if (!otpValue.trim() || otpValue.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the OTP you received.');
      return;
    }

    setVerifying(true);
    setTeacherEmail(email.trim());
    setTeacherVerified(true);

    if (pickedFile) {
      setCurrentFile({
        uri: pickedFile.uri,
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
        sizeMB: pickedFile.sizeMB,
      });

      // ─── Save to Supabase (non-blocking) ───
      try {
        const sizeBytes = Math.round(parseFloat(pickedFile.sizeMB) * 1024 * 1024);
        const fileId = await saveLectureFile(
          email.trim(),
          pickedFile.name,
          pickedFile.mimeType,
          sizeBytes
        );
        const sessionId = await createChatSession(fileId, voiceSettings.outputLanguage);
        setDbSessionId(sessionId);
      } catch (e) {
        // DB save failed — chat still works, history just won't record this session
        console.warn('DB session creation failed (non-fatal):', e);
      }
    }

    setFormStep('done');
    setVerifying(false);
  };

  // ─── New chat: reset everything ───
  const handleNewChat = () => {
    setCurrentFile(null);
    setTeacherEmail(null);
    setTeacherVerified(false);
    setFormStep('upload');
    setPickedFile(null);
    setConsent(false);
    setEmail('');
    setOtpSent(false);
    setOtpValue('');
    setDbSessionId(null);
    setMessages([{
      id: 'intro',
      role: 'ai',
      content: "Upload a lecture video, ask a question, and I will answer like your favorite teacher — structured, clear, and calm.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
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
      const response: TeacherResponse = await askTeacher(
        currentFile?.uri || null,
        currentFile?.name || null,
        currentFile?.mimeType || null,
        newMsg.content,
        voiceSettings.outputLanguage,
        teacherEmail || '',
        otpValue || '',
        consent
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.text,
        audioUrl: response.audioUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);

      // ─── Persist both messages to Supabase ───
      if (dbSessionId) {
        saveMessage(dbSessionId, 'user', newMsg.content);
        saveMessage(dbSessionId, 'ai', response.text, response.audioUrl);
      }
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

  // ─── Show chat when file is set (form completed) ───
  const showChat = !!currentFile;

  const s = makeStyles(Colors);

  // ─── Render the multi-step form ───
  const renderForm = () => {
    // Step 1: Upload
    if (formStep === 'upload') {
      return (
        <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 1 of 3</Text>
            </View>
            <View style={s.uploadIconFrame}>
              <IconSymbol name="arrow.up.circle.fill" size={36} color={Colors.primary} />
            </View>
            <Text style={s.formTitle}>Upload Lecture Material</Text>
            <Text style={s.formDesc}>Select a video, audio, or document to start your learning session.</Text>
            <Text style={[s.formHint]}>Supports MP4, MOV, MP3, WAV files up to 500 MB</Text>
            <Pressable style={s.primaryBtn} onPress={pickDocument}>
              <IconSymbol name="doc.fill" size={18} color={Colors.on_primary} />
              <Text style={s.primaryBtnText}>Select File</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    // Step 2: Consent + Gmail + Send OTP
    if (formStep === 'verify') {
      return (
        <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 2 of 3</Text>
            </View>

            {/* File preview */}
            <View style={s.filePreview}>
              <IconSymbol name="doc.text.fill" size={22} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={s.fileName} numberOfLines={1}>{pickedFile?.name}</Text>
                <Text style={s.fileSize}>{pickedFile?.sizeMB}</Text>
              </View>
              <Pressable onPress={() => { setFormStep('upload'); setPickedFile(null); }}>
                <IconSymbol name="xmark.circle.fill" size={22} color={Colors.outline} />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Consent */}
            <Pressable style={s.consentRow} onPress={() => setConsent(!consent)}>
              <View style={[s.checkbox, consent && s.checkboxChecked]}>
                {consent && <IconSymbol name="checkmark" size={14} color={Colors.on_primary} />}
              </View>
              <Text style={s.consentText}>I confirm I have teacher's permission</Text>
            </Pressable>

            {/* Teacher Gmail */}
            <Text style={s.inputLabel}>Teacher's Gmail ID</Text>
            <TextInput
              style={s.textField}
              placeholder="teacher@gmail.com"
              placeholderTextColor={Colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {/* Send OTP */}
            <Pressable
              style={[s.primaryBtn, (!consent || !email.trim()) && s.disabledBtn]}
              onPress={handleSendOtp}
              disabled={!consent || !email.trim() || sendingOtp}
            >
              {sendingOtp ? (
                <ActivityIndicator size="small" color={Colors.on_primary} />
              ) : (
                <>
                  <IconSymbol name="envelope.fill" size={18} color={Colors.on_primary} />
                  <Text style={s.primaryBtnText}>Send OTP</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    // Step 3: Enter OTP + Submit
    if (formStep === 'otp') {
      return (
        <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 3 of 3</Text>
            </View>

            <View style={s.otpIconFrame}>
              <IconSymbol name="lock.shield.fill" size={36} color={Colors.primary} />
            </View>

            <Text style={s.formTitle}>Verify OTP</Text>
            <Text style={s.formDesc}>Enter the OTP sent to{'\n'}<Text style={{ fontWeight: '700', color: Colors.primary }}>{email}</Text></Text>

            <TextInput
              style={s.otpInput}
              placeholder="Enter OTP"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              maxLength={6}
              value={otpValue}
              onChangeText={setOtpValue}
            />

            <Pressable onPress={() => handleSendOtp()}>
              <Text style={s.resendText}>Didn't receive it? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Resend OTP</Text></Text>
            </Pressable>

            <Pressable
              style={[s.primaryBtn, s.submitBtn, (!otpValue.trim()) && s.disabledBtn]}
              onPress={handleVerifyAndSubmit}
              disabled={!otpValue.trim() || verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color={Colors.on_primary} />
              ) : (
                <>
                  <IconSymbol name="checkmark.shield.fill" size={18} color={Colors.on_primary} />
                  <Text style={s.primaryBtnText}>Verify & Start Chat</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <Header title="Teacher Chat" />

      {!showChat ? (
        <View style={s.formContainer}>
          {/* Progress bar */}
          <View style={s.progressContainer}>
            {[0, 1, 2].map((i) => {
              const stepIndex = formStep === 'upload' ? 0 : formStep === 'verify' ? 1 : 2;
              return (
                <View
                  key={i}
                  style={[
                    s.progressDot,
                    i <= stepIndex && { backgroundColor: Colors.primary },
                  ]}
                />
              );
            })}
          </View>
          {renderForm()}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.headerTitlesContainer}>
            <View style={s.headerTitles}>
              <Text style={s.brandTitle}>ExplainLikeMyTeacher</Text>
              <Text style={s.moduleTitle} numberOfLines={1}>{currentFile.name}</Text>
            </View>
            <Pressable
              style={s.newChatBtn}
              onPress={handleNewChat}
            >
              <Text style={s.newChatBtnText}>New +</Text>
            </Pressable>
          </View>

          <ScrollView
            style={s.chatContainer}
            contentContainerStyle={s.chatContent}
            ref={scrollViewRef}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[s.messageWrapper, { alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }]}>
                <View style={msg.role === 'user' ? s.userMessage : s.aiMessage}>
                  <Text style={msg.role === 'user' ? s.userMessageText : s.aiMessageText}>
                    {msg.content}
                  </Text>
                </View>
                <Text style={[s.timeText, { alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginTop: Spacing.xs }]}>{msg.time}</Text>
                {msg.role === 'ai' && msg.id !== 'intro' && (
                  <AudioPlayerCard text={msg.content} audioUrl={msg.audioUrl ?? null} messageId={msg.id} />
                )}
              </View>
            ))}

            {isLoading && (
              <View style={[s.messageWrapper, { alignSelf: 'flex-start' }]}>
                <View style={s.aiMessage}>
                  <Text style={s.aiMessageText}>Thinking...</Text>
                </View>
              </View>
            )}

          </ScrollView>

          <View style={s.inputSection}>
            <View style={s.inputContainer}>
              <TextInput
                style={s.input}
                placeholder="Ask anything..."
                placeholderTextColor={Colors.outline_variant}
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
              {inputText.length > 0 ? (
                <Pressable style={s.sendButton} onPress={handleSend} disabled={isLoading}>
                  <IconSymbol name="arrow.up" size={20} color={Colors.on_primary} />
                </Pressable>
              ) : (
                <Pressable
                  style={s.micButton}
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

// ─── Styles ───
function makeStyles(Colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },

    // ── Form ──
    formContainer: {
      flex: 1,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    progressDot: {
      width: 48,
      height: 5,
      borderRadius: Radii.full,
      backgroundColor: Colors.surface_container_highest,
    },
    formScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    formCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radii.xl,
      padding: Spacing.xxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.surface_container_highest,
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
    stepBadge: {
      backgroundColor: Colors.primary_container,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.full,
      marginBottom: Spacing.xl,
    },
    stepBadgeText: {
      ...Fonts.labelSm,
      color: Colors.on_primary_container,
      fontWeight: '700',
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
    otpIconFrame: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    formTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    formDesc: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      textAlign: 'center',
      lineHeight: 20,
    },
    formHint: {
      ...Fonts.bodySm,
      color: Colors.outline,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },

    // ── File preview ──
    filePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary_container,
      padding: Spacing.md,
      borderRadius: Radii.lg,
      width: '100%',
      marginBottom: Spacing.md,
    },
    fileName: {
      ...Fonts.labelLg,
      color: Colors.on_primary_container,
    },
    fileSize: {
      ...Fonts.labelSm,
      color: Colors.on_primary_container,
      opacity: 0.7,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.surface_container_highest,
      width: '100%',
      marginVertical: Spacing.lg,
    },

    // ── Consent ──
    consentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: Spacing.xl,
      paddingVertical: Spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: Radii.sm,
      borderWidth: 2,
      borderColor: Colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    checkboxChecked: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    consentText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface,
      flex: 1,
    },

    // ── Input fields ──
    inputLabel: {
      ...Fonts.labelLg,
      color: Colors.on_surface,
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
    },
    textField: {
      width: '100%',
      backgroundColor: Colors.surface_container_low,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.outline_variant,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Fonts.bodyLg,
      color: Colors.on_surface,
      marginBottom: Spacing.xl,
    },
    otpInput: {
      width: '80%',
      backgroundColor: Colors.surface_container_low,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.outline_variant,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      ...Fonts.headlineMd,
      color: Colors.on_surface,
      textAlign: 'center',
      letterSpacing: 8,
      marginTop: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    resendText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      marginBottom: Spacing.xl,
    },

    // ── Buttons ──
    primaryBtn: {
      marginTop: Spacing.lg,
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxl,
      borderRadius: Radii.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      width: '100%',
    },
    primaryBtnText: {
      ...Fonts.labelLg,
      color: Colors.on_primary,
      fontWeight: '700',
    },
    submitBtn: {
      backgroundColor: Colors.primary,
    },
    disabledBtn: {
      opacity: 0.45,
    },

    // ── Chat (unchanged from original) ──
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
  });
}
