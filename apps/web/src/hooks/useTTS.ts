"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Divide um texto longo em frases menores pra leitura mais fluida.
 * O speechSynthesis fica "sincopado" (palavra por palavra) com textos
 * muito grandes. Quebrando em frases e enfileirando, a leitura fica
 * natural e contínua — como uma pessoa lendo.
 *
 * Quebra em: pontos, ponto de interrogação, exclamação, quebras de linha.
 * Mantém pontuação pra pausas naturais.
 */
function splitIntoSentences(text: string): string[] {
  // Divide mantendo o separador no final de cada pedaço.
  // Regex lookbehind não é suportado pelo SWC do Next.js — uso split normal.
  const normalized = text.replace(/\n+/g, ". ");
  // Divide por espaços após pontuação, sem lookbehind.
  const parts = normalized
    .split(/([.!?])\s+/)  // captura o separador
    .reduce<string[]>((acc, part, i) => {
      // Junta o separador de volta na frase anterior.
      if (i % 2 === 0 && part.trim()) acc.push(part);
      else if (i % 2 === 1 && acc.length > 0) acc[acc.length - 1] += part;
      return acc;
    }, [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // Se alguma frase for MUITO longa (>200 chars), quebra por vírgulas.
  const result: string[] = [];
  for (const part of parts) {
    if (part.length > 200) {
      const sub = part.split(/[,;:]\s+/).map((s) => s.trim()).filter(Boolean);
      result.push(...sub);
    } else {
      result.push(part);
    }
  }
  return result.length > 0 ? result : [text];
}

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

      // Divide em frases pra leitura mais fluida (sem efeito sincopado).
      const sentences = splitIntoSentences(text);
      const voice = pickVoice(lang);

      setState("playing");

      // Enfileira cada frase como uma utterance separada.
      // O speechSynthesis toca uma após a outra automaticamente.
      sentences.forEach((sentence, idx) => {
        const utter = new SpeechSynthesisUtterance(sentence);
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang;
        } else {
          utter.lang = lang;
        }
        utter.rate = 1;     // velocidade normal
        utter.pitch = 1;    // tom normal
        // Só marca "idle" quando a ÚLTIMA frase terminar.
        if (idx === sentences.length - 1) {
          utter.onend = () => setState("idle");
          utter.onerror = () => setState("idle");
        }
        window.speechSynthesis.speak(utter);
      });
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
