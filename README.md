# ExplainLikeMyTeacher 🎓

An AI-powered mobile learning assistant that explains lecture content the way your favourite teacher would — structured, clear, and calm. Upload your notes, ask questions, get clear explanations, and visualise concepts as interactive mind maps.

Built with **React Native (Expo)** and powered by two **Hugging Face Gradio** backends.

---

## Features

### ✅ Implemented

| Feature | Description |
|---|---|
| **Teacher Chat** | Upload a lecture file (video, audio, or document), ask questions in natural language, and get teacher-style AI explanations |
| **Text-to-Speech** | Every AI response can be played back as audio via `expo-speech` with adjustable speed |
| **Mind Maps** | Upload an image or PDF of your notes → AI generates a structured JSON tree → rendered as a zoomable, pannable, interactive mind map |
| **Light / Dark Mode** | Full system-wide theme toggle with a Stitch-designed "Digital Mentor" palette |
| **Language Selection** | Switch AI responses between English and Hindi from Settings |
| **Drawer Navigation** | Slide-in navigation with custom-styled drawer using Expo Router |

### 🔜 Planned / In Progress

| Feature | Status |
|---|---|
| Quiz Generator | UI scaffold in place, backend integration pending |
| PBL Planner | UI scaffold in place, backend integration pending |
| History | UI scaffold in place |
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
| Backend | Hugging Face Gradio spaces (two separate spaces) |

---

## Gradio Backend Spaces

| Space | HF URL | Endpoint | Used For |
|---|---|---|---|
| Teacher Chat | `ayushi18270-explain-like-my-teacher.hf.space` | `/queue/join` + `/queue/data` (SSE) | AI explanations from lecture files |
| Mind Map | `ayushi18270-teach-like-my-teacher.hf.space` | `/call/process` (SSE) | JSON mind map tree from image/PDF |

---

## Project Structure

```
ExplainLikeMyTeacher/
└── mobile-app/                  # React Native Expo app (active)
    ├── app/
    │   ├── _layout.tsx          # Root layout — providers (Theme, Lecture, Settings)
    │   ├── index.tsx            # Onboarding / splash screen
    │   └── (drawer)/
    │       ├── _layout.tsx      # Drawer navigator setup
    │       ├── chat.tsx         # Teacher Chat screen
    │       ├── mindmaps.tsx     # Mind Map screen
    │       ├── quiz.tsx         # Quiz screen (scaffold)
    │       ├── pbl.tsx          # PBL Planner screen (scaffold)
    │       ├── history.tsx      # History screen (scaffold)
    │       └── settings.tsx     # Settings (theme, language, voice)
    ├── components/
    │   ├── Header.tsx           # Drawer-toggle header
    │   ├── CustomDrawerContent.tsx
    │   ├── AudioPlayerCard.tsx  # TTS playback card
    │   └── MindMapView.tsx      # WebView + ReactFlow mind map renderer
    ├── services/
    │   └── gradioService.ts     # All Gradio API calls (upload, chat, mindmap)
    ├── context/
    │   ├── ThemeContext.tsx      # Light/dark mode state
    │   ├── LectureContext.tsx   # Currently loaded lecture file
    │   └── SettingsContext.tsx  # Voice, language, playback preferences
    └── constants/
        └── theme.ts             # Design tokens (colors, spacing, radii, fonts)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app on your Android/iOS device, **or** an Android emulator

### Install & Run

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** to open the app on your device.

> **Note:** Mind Map rendering requires an internet connection to load ReactFlow from CDN inside the WebView.

---

## How It Works

### Teacher Chat Flow
1. User picks a lecture file (MP4, MOV, MP3, WAV, PDF — up to 500 MB)
2. File uploads to the Gradio space via `POST /gradio_api/upload`
3. Job submitted via `POST /gradio_api/queue/join` (fn_index 2 → `run_pipeline`)
4. SSE stream polled via `GET /gradio_api/queue/data` → response streamed back
5. AI answer displayed as a chat message + optional TTS playback

### Mind Map Flow
1. User picks an image (PNG/JPG) or PDF of their notes
2. File uploads to the **mindmap Gradio space** via `POST /gradio_api/upload`
3. Job submitted via `POST /gradio_api/call/process`
4. SSE stream via `GET /gradio_api/call/process/{event_id}` → JSON tree returned
5. JSON tree converted to ReactFlow nodes + edges (`generateFlow`)
6. Rendered inside a `<WebView>` with ReactFlow v11 loaded from CDN
7. Tap any node → bottom card shows the topic label

---

## Settings

| Setting | Options |
|---|---|
| Output Language | English / Hindi |
| Audio Enabled | On / Off |
| Auto-Play Audio | On / Off |
| Playback Speed | 0.75× / 1× / 1.5× / 2× |
| Theme | Light / Dark |
