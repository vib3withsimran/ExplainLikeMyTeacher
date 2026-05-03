# ExplainLikeMyTeacher 🎓

An AI-powered mobile learning assistant that explains lecture content the way your favourite teacher would — structured, clear, and calm. Upload your notes, ask questions, get clear explanations, and visualise concepts as interactive mind maps.

Built with **React Native (Expo)**, powered by **Hugging Face Gradio** AI backends, and persisted with **Supabase** (PostgreSQL + Auth).

---

## Features

### ✅ Implemented

| Feature | Description |
|---|---|
| **Teacher Chat** | Upload a lecture file (video, audio, or document), ask questions in natural language, and get teacher-style AI explanations |
| **Text-to-Speech** | Every AI response can be played back as audio via `expo-speech` with adjustable speed |
| **Mind Maps** | Upload an image or PDF of your notes → AI generates a structured JSON tree → rendered as a zoomable, pannable, interactive mind map |
| **Quiz Generator** | Upload lecture material → AI generates MCQ quizzes → answer and check scores |
| **PBL Planner** | Upload lecture material → AI generates Project-Based Learning scenarios with guiding questions |
| **Authentication** | Email/Password sign-up & sign-in via Supabase Auth. Google OAuth supported in production builds |
| **Chat History** | All chat sessions and messages are persisted to Supabase PostgreSQL. View past conversations in the History screen with expandable message threads |
| **User Profiles** | Logged-in user's email displayed in Settings. Secure sign-out with confirmation |
| **Teacher Verification** | 3-step OTP consent workflow — file upload → teacher email + consent → OTP verification |
| **Light / Dark Mode** | Full system-wide theme toggle with a custom "Digital Mentor" palette |
| **Language Selection** | Switch AI responses between English and Hinglish from Settings |
| **Drawer Navigation** | Slide-in navigation with custom-styled drawer using Expo Router |

### 🔜 Planned / In Progress

| Feature | Status |
|---|---|
| Google OAuth in Expo Go | Requires production build (works in APK) |
| Mind Map Node Click → Explanation | Structure built, wiring pending |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router v6 (file-based, drawer layout) |
| Styling | Vanilla StyleSheet (no Tailwind) — custom `theme.ts` design tokens |
| Fonts | Inter, Manrope via `@expo-google-fonts` |
| Mind Maps | ReactFlow v11 (via `react-native-webview` HTML injection) |
| Speech | `expo-speech` (TTS) |
| File Picker | `expo-document-picker` |
| AI Backend | Hugging Face Gradio spaces (multiple spaces) |
| Database | Supabase PostgreSQL (hosted) |
| Authentication | Supabase Auth (Email/Password + Google OAuth) |
| Session Storage | `@react-native-async-storage/async-storage` |
| Build | EAS Build (APK + AAB) |

---

## Architecture

```
┌─────────────────────────┐
│    React Native App     │
│    (Expo Router)        │
├─────────────────────────┤
│                         │
│  ┌── Auth ────────────┐ │       ┌──────────────────────┐
│  │ Login / Signup     │─┼──────→│  Supabase Auth       │
│  │ Google OAuth       │ │       │  (auth.users)        │
│  └────────────────────┘ │       └──────────────────────┘
│                         │
│  ┌── Chat ────────────┐ │       ┌──────────────────────┐
│  │ Teacher Chat       │─┼──────→│  Gradio Space        │
│  │ OTP Verification   │ │       │  (AI Explanations)   │
│  └────────────────────┘ │       └──────────────────────┘
│         │               │
│         ▼               │       ┌──────────────────────┐
│  ┌── DB Service ──────┐ │       │  Supabase PostgreSQL │
│  │ Save sessions      │─┼──────→│  lecture_files        │
│  │ Save messages      │ │       │  chat_sessions       │
│  │ Fetch history      │ │       │  interactions        │
│  └────────────────────┘ │       └──────────────────────┘
│                         │
│  ┌── Mind Maps ───────┐ │       ┌──────────────────────┐
│  │ Quiz / PBL         │─┼──────→│  Gradio Space        │
│  └────────────────────┘ │       │  (Mindmap/Quiz/PBL)  │
│                         │       └──────────────────────┘
└─────────────────────────┘
```

---

## Database Schema (Supabase PostgreSQL)

```sql
auth.users              -- Managed by Supabase Auth (auto)
  │
  ├──→ lecture_files     -- Every uploaded file (name, type, size, teacher email)
  │         │
  │         └──→ chat_sessions   -- One per file upload (language, timestamp)
  │                   │
  │                   └──→ interactions   -- Every message (role, content, audio_url)
```

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## Gradio Backend Spaces

| Space | HF URL | Endpoint | Used For |
|---|---|---|---|
| Teacher Chat | `ayushi18270-explain-like-my-teacher.hf.space` | `/queue/join` + `/queue/data` (SSE) | AI explanations from lecture files |
| Mind Map / Quiz / PBL | `ayushi18270-teach-like-my-teacher.hf.space` | `/call/process` (SSE) | JSON mind map, quiz, PBL generation |

---

## Project Structure

```
ExplainLikeMyTeacher/
└── mobile-app/
    ├── app/
    │   ├── _layout.tsx              # Root layout — providers + auth guard
    │   ├── index.tsx                # Onboarding / splash screen
    │   ├── auth/
    │   │   ├── _layout.tsx          # Auth stack layout
    │   │   ├── login.tsx            # Login (Email + Google OAuth)
    │   │   ├── signup.tsx           # Sign up (Email + Google OAuth)
    │   │   └── callback.tsx         # OAuth deep-link handler
    │   └── (drawer)/
    │       ├── _layout.tsx          # Drawer navigator setup
    │       ├── chat.tsx             # Teacher Chat screen
    │       ├── mindmaps.tsx         # Mind Map screen
    │       ├── quiz.tsx             # Quiz screen
    │       ├── pbl.tsx              # PBL Planner screen
    │       ├── history.tsx          # Chat History (from Supabase)
    │       └── settings.tsx         # Settings (theme, language, voice, sign out)
    ├── components/
    │   ├── Header.tsx               # Drawer-toggle header
    │   ├── CustomDrawerContent.tsx
    │   ├── AudioPlayerCard.tsx      # TTS playback card
    │   └── MindMapView.tsx          # WebView + ReactFlow mind map renderer
    ├── services/
    │   ├── gradioService.ts         # All Gradio API calls (chat, mindmap, quiz, PBL)
    │   ├── supabaseClient.ts        # Supabase client (auth + DB)
    │   └── dbService.ts             # Database read/write operations
    ├── context/
    │   ├── ThemeContext.tsx          # Light/dark mode state
    │   ├── LectureContext.tsx        # Currently loaded lecture file
    │   └── SettingsContext.tsx       # Voice, language, playback preferences
    ├── constants/
    │   └── theme.ts                 # Design tokens (colors, spacing, radii, fonts)
    ├── eas.json                     # EAS Build config (APK + AAB profiles)
    └── supabase_schema.sql          # Database schema (run in Supabase SQL Editor)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app on your Android/iOS device, **or** an Android emulator
- A [Supabase](https://supabase.com) project (free tier)

### Install & Run (Development)

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** to open the app on your device.

### Build APK (Production)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The build runs on Expo's cloud servers (~10-15 min). You get a download link for the `.apk`.

---

## Environment Setup

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase_schema.sql` in the SQL Editor
3. Enable Email provider under Authentication → Providers
4. (Optional) Enable Google OAuth and add credentials

### Google OAuth (Optional)

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
5. Add credentials to Supabase → Authentication → Providers → Google

---

## How It Works

### Authentication Flow
1. User opens app → root layout checks Supabase session
2. No session → redirect to `/auth/login`
3. User signs in (Email/Password or Google OAuth)
4. Session persisted to AsyncStorage → stays logged in across restarts
5. Sign out available in Settings

### Teacher Chat Flow
1. User picks a lecture file (MP4, MOV, MP3, WAV, PDF — up to 500 MB)
2. User enters teacher's email, grants consent, verifies OTP
3. File + session saved to Supabase (`lecture_files` + `chat_sessions`)
4. File uploads to the Gradio space via `POST /gradio_api/upload`
5. Job submitted via `POST /gradio_api/queue/join`
6. SSE stream polled via `GET /gradio_api/queue/data` → response streamed back
7. AI answer displayed as chat message + optional TTS playback
8. Both user question and AI answer saved to Supabase (`interactions`)

### Mind Map Flow
1. User picks an image (PNG/JPG) or PDF of their notes
2. File uploads to the mindmap Gradio space
3. Job submitted via `POST /gradio_api/call/process`
4. JSON tree returned → converted to ReactFlow nodes + edges
5. Rendered inside a `<WebView>` with ReactFlow v11

### History Flow
1. User navigates to History screen
2. `getChatHistory()` fetches all sessions from Supabase (with nested messages)
3. Sessions displayed with expandable message threads
4. Data refreshes every time the screen comes into focus

---

## Settings

| Setting | Options |
|---|---|
| Output Language | English / Hinglish |
| Audio Enabled | On / Off |
| Auto-Play Audio | On / Off |
| Playback Speed | 1× / 1.5× / 2× |
| Theme | Light / Dark |
| Account | Shows user email, Sign Out button |
