"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Minimal typing for the Web Speech API (not in TypeScript's DOM lib). */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser's site settings.",
  "service-not-allowed": "Microphone access was blocked. Allow it in your browser's site settings.",
  "no-speech": "Didn't catch that. Try again a little closer to the mic.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs an internet connection.",
};

/** Splits a recognition event into newly finalised text and the current interim guess. */
export function readResults(e: RecognitionEvent): { final: string; interim: string } {
  let final = "";
  let interim = "";
  for (let i = e.resultIndex; i < e.results.length; i++) {
    const r = e.results[i];
    if (r.isFinal) final += r[0].transcript;
    else interim += r[0].transcript;
  }
  return { final: final.trim(), interim: interim.trim() };
}

/**
 * Browser speech-to-text (Web Speech API) as a fallback for people without Wispr Flow.
 * Continuous listening: each finalised phrase is passed to `onFinal`; `interim` previews the rest.
 */
export function useSpeechDictation(lang: string, onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(recognitionCtor()),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onFinal);

  useEffect(() => {
    callback.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => recognition.current?.stop(), []);

  const stop = useCallback(() => recognition.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recognition.current?.stop();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const { final, interim: guess } = readResults(e);
      if (final) callback.current(final);
      setInterim(guess);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] ?? "Voice input stopped. Please try again.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognition.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }, [lang]);

  return { supported, listening, interim, error, start, stop };
}
