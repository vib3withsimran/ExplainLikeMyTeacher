"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@gradio/client";
import { AnimatePresence, motion } from "framer-motion";

type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
    sendData?: () => Promise<void>;
  }
}

const INTRO_MESSAGE: Message = {
  id: "intro",
  role: "ai",
  content:
    "Upload a lecture video, ask a question, and I will answer like your favorite teacher — structured, clear, and calm."
};

const TYPING_MESSAGE: Message = {
  id: "typing",
  role: "ai",
  content: "typing"
};

const ExplainLikeMyTeacher = () => {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [fileName, setFileName] = useState("No Video Selected");
  const [messages, setMessages] = useState<Message[]>([INTRO_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const scrollAnchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.body.dataset.theme = theme;
  }, [theme]);

  const speakText = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsPaused(false);
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        utterance.voice =
          voices.find((voice) => voice.name.includes("Google")) ?? voices[0];
        window.speechSynthesis.speak(utterance);
      }
    };

    const availableVoices = window.speechSynthesis.getVoices();
    if (!availableVoices.length) {
      window.speechSynthesis.onvoiceschanged = assignVoice;
    } else {
      assignVoice();
    }
  }, []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev.filter((m) => m.id !== TYPING_MESSAGE.id), message]);
  }, []);

  const startTypingIndicator = useCallback(() => {
    setMessages((prev) => {
      const withoutTyping = prev.filter((m) => m.id !== TYPING_MESSAGE.id);
      return [...withoutTyping, TYPING_MESSAGE];
    });
  }, []);

  const stopTypingIndicator = useCallback(() => {
    setMessages((prev) => prev.filter((m) => m.id !== TYPING_MESSAGE.id));
  }, []);

  const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const sendData = useCallback(async () => {
    if (!question.trim() || isLoading) {
      return;
    }

    const newMessage: Message = {
      id: createId(),
      role: "user",
      content: question.trim()
    };

    appendMessage(newMessage);
    setQuestion("");
    setError(null);
    setIsLoading(true);
    startTypingIndicator();

    try {
      const client = await Client.connect("ayushi18270/Explain-like-my-teacher");
      const result = await client.predict("/run_pipeline", {
        file,
        question: newMessage.content
      });

      const answerText = result.data[0];
      const aiMessage: Message = {
        id: createId(),
        role: "ai",
        content: answerText
      };

      appendMessage(aiMessage);
      setLastAnswer(answerText);
      speakText(answerText);
    } catch (err) {
      console.error(err);
      setError("We ran into a glitch while generating that explanation. Please try again.");
    } finally {
      setIsLoading(false);
      stopTypingIndicator();
    }
  }, [appendMessage, file, isLoading, question, speakText, startTypingIndicator, stopTypingIndicator]);

  useEffect(() => {
    window.sendData = sendData;
  }, [sendData]);

  const handleVoiceCapture = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setError("Unable to capture audio. Please try again.");
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, []);

  const pauseSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!window.speechSynthesis.speaking && !isPaused) {
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const restartSpeech = useCallback(() => {
    if (!lastAnswer || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsPaused(false);
    speakText(lastAnswer);
  }, [lastAnswer, speakText]);

  const structuredAnswer = useMemo(() => {
    if (!lastAnswer) {
      return [];
    }
    return lastAnswer.split(/\n+/).filter(Boolean);
  }, [lastAnswer]);

  return (
    <div className="page-shell">
      <nav className="site-nav" aria-label="Primary">
        <span className="nav-brand">ExplainLikeMyTeacher</span>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#docs">Docs</a>
          <a href="#logic-signup">Logic Signup</a>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span className="theme-icon" aria-hidden="true">
            {theme === "dark" ? "☀" : "🌙"}
          </span>
          <span className="theme-label">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </nav>

      <div className="container chat-shell" role="main" id="home">

        <header className="chat-header">
          <div>
            <h2>Explain Like My Teacher</h2>
            <p className="subtitle">Learn the way teachers explain</p>
          </div>
          <div className="status-dot" aria-live="polite">
            {isLoading ? "Thinking..." : "Ready"}
          </div>
        </header>

        <div className="upload-block">
          <label htmlFor="fileInput" className="file-label">
            Choose Lecture Video
          </label>
          <input
            type="file"
            id="fileInput"
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setFileName(selected ? selected.name : "No Video Selected");
            }}
          />
          <span id="fileName">{fileName}</span>
        </div>

        <section className="chat-interface" aria-live="polite">
          <div className="message-stream" role="log">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.article
                  key={message.id}
                  className={`message-bubble ${message.role === "user" ? "message-user" : "message-ai"}`}
                  initial={{ opacity: 0, translateY: 16 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {message.id === TYPING_MESSAGE.id ? (
                    <div className="typing-indicator" aria-label="AI is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </motion.article>
              ))}
            </AnimatePresence>
            <div ref={scrollAnchor} />
          </div>
        </section>

        <footer className="input-footer" id="logic-signup">
          <div className="input-row">
            <input
              type="text"
              id="question"
              className="question-input"
              placeholder="Ask question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className={`mic-button ${isListening ? "is-active" : ""}`}
              onClick={handleVoiceCapture}
              aria-pressed={isListening}
            >
              <i className="fa-solid fa-microphone" aria-hidden="true" />
              <span className="sr-only">{isListening ? "Listening" : "Start voice input"}</span>
              <span className="mic-tooltip">mic</span>
            </button>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={sendData}
            disabled={isLoading}
          >
            {isLoading ? "Explaining" : "Explain"}
          </button>
        </footer>

        <section className="answer-panel" aria-live="polite" id="docs">
          <div className="answer-header">
            <h3>Answer</h3>
            <div className="answer-actions">
              <button
                type="button"
                className={`audio-button ${isSpeaking && !isPaused ? "is-speaking" : ""} ${
                  isPaused ? "is-paused" : ""
                }`}
                onClick={() => speakText(lastAnswer)}
                disabled={!lastAnswer || isLoading}
              >
                {isSpeaking ? "Playing" : "Play"}
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={pauseSpeech}
                disabled={!lastAnswer || (!isSpeaking && !isPaused)}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={restartSpeech}
                disabled={!lastAnswer || isLoading}
              >
                Restart
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={() => navigator.clipboard.writeText(lastAnswer)}
                disabled={!lastAnswer}
              >
                Copy
              </button>
            </div>
          </div>
          <div id="result" className={`answer-body ${isLoading ? "is-loading" : ""}`}>
            {isLoading && (
              <div className="answer-loading">
                <div className="shimmer" />
                <p>Generating a teacher-style explanation...</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="answer-error" role="alert">
                <p>{error}</p>
                <button type="button" className="outline-button" onClick={sendData}>
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && !!lastAnswer && (
              <article className="answer-text">
                {structuredAnswer.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </article>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExplainLikeMyTeacher;
