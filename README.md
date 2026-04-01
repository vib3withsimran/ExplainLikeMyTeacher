# Explain Like My Teacher

Explain Like My Teacher is a modernized React (Next.js) front end that lets learners upload lecture videos, ask natural-language questions, and receive teacher-style explanations augmented with speech synthesis. The UI mirrors premium AI assistants with glassmorphic surfaces, voice capture, and light/dark theming while keeping the original backend contract intact.

## Features

- **Next.js + Framer Motion UI** for smooth chat flows, typing indicators, and responsive layouts.
- **Voice interactions** with tap-to-speak, listening state, and resume/restart controls for synthesized answers.
- **Dynamic theming** to toggle between cinematic dark mode and a clean light palette.
- **Glassmorphic cards** optimized for desktop and mobile with accessible status messaging and error fallbacks.
- **Gradio backend integration** via `@gradio/client`, preserving the existing `/run_pipeline` API behavior.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app boots at [http://localhost:3000](http://localhost:3000) using Next.js Turbopack.

## Build & Deploy

```bash
npm run build
npm start
```

The production build outputs to `.next/` and can be deployed to any Node-compatible host or Vercel.

## Environment Notes

- Speech synthesis and recognition rely on browser APIs; recommend Chromium-based browsers for best voice support.
- The Gradio endpoint defaults to `ayushi18270/Explain-like-my-teacher`. Update `Client.connect` in `src/components/ExplainLikeMyTeacher.tsx` if your backend URL changes.

## Project Structure

```
ExplainLikeMyTeacher/
├── src/
│   ├── components/ExplainLikeMyTeacher.tsx
│   ├── pages/
│   │   ├── _app.tsx
│   │   └── index.tsx
│   └── styles/explain.css
├── public/
├── package.json
└── README.md
```

Feel free to extend the UI with analytics, auth, or richer document formatting while maintaining the ids/classnames required by the backend.
