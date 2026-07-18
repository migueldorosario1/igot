"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook de leitura em voz alta (Text-to-Speech).
 *
 * Usa a API nativa do navegador (window.speechSynthesis) — GRÁTIS, sem
 * nenhuma API externa. Funciona em iOS Safari, Chrome, Firefox.
 *
 * Funcionalidades:
 *   - speak(text): lê o texto em voz alta (na língua do livro)
 *   - pause() / resume(): pausa/continua
 *   - stop(): para a leitura
 *   - state: "idle" | "playing" | "paused"
 *
 * Detecção de idioma: o caller passa o lang (ex: "en", "pt-BR"). Se não
 * achar uma voz exata, cai pro prefixo (ex: "en" → primeira voz "en-*").
 */
export function useTTS() {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Carrega as vozes (assíncrono em alguns navegadores).
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  /** Encontra a melhor voz pro idioma dado. */
  const pickVoice = useCallback(
    (lang: string): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;
      // 1. Match exato (ex: "pt-BR").
      let v = voices.find((vc) => vc.lang.toLowerCase() === lang.toLowerCase());
      // 2. Match pelo prefixo (ex: "en" → "en-US", "en-GB").
      if (!v) {
        const prefix = lang.split("-")[0].toLowerCase();
        v = voices.find((vc) => vc.lang.toLowerCase().startsWith(prefix));
      }
      return v ?? null;
    },
    [voices],
  );

  /** Lê um texto em voz alta. Para qualquer leitura anterior antes. */
  const speak = useCallback(
    (text: string, lang: string = "pt-BR") => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel(); // para qualquer leitura anterior
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(lang);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = lang;
      }
      utter.rate = 1;     // velocidade normal
      utter.pitch = 1;    // tom normal
      utter.onstart = () => setState("playing");
      utter.onend = () => setState("idle");
      utter.onerror = () => setState("idle");
      utter.onpause = () => setState("paused");
      utter.onresume = () => setState("playing");
      window.speechSynthesis.speak(utter);
    },
    [supported, pickVoice],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setState("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setState("playing");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
  }, [supported]);

  return { state, speak, pause, resume, stop, supported, voices };
}
