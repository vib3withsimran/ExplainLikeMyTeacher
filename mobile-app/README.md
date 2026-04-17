# ExplainLikeMyTeacher — Mobile App

React Native Expo application for the ExplainLikeMyTeacher project. See the [root README](../README.md) for full project details.

## Quick Start

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your device.

## Key Commands

| Command | Description |
|---|---|
| `npx expo start` | Start Expo dev server |
| `npx expo run:android` | Build and run on Android |
| `npm run lint` | Run ESLint |

## Dependencies Added Beyond Expo Defaults

| Package | Purpose |
|---|---|
| `@xyflow/react` | ReactFlow (installed, used via CDN in WebView) |
| `react-native-webview` | Hosts the ReactFlow mind map HTML page |
| `expo-document-picker` | File selection for lecture upload and mind map |
| `expo-speech` | Text-to-speech playback of AI answers |
| `expo-linear-gradient` | Gradient backgrounds |
| `@expo-google-fonts/inter` | Inter 400/500 |
| `@expo-google-fonts/manrope` | Manrope 600/700 |
| `@react-navigation/drawer` | Drawer navigator |
