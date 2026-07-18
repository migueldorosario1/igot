"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Hook de reconhecimento de voz (Speech-to-Text).
 *
 * Usa a API nativa do navegador (window.SpeechRecognition ou webkitSpeechRecognition).
 * GRÁTIS, sem API externa. Funciona em Chrome/Edge e Safari iOS 14.5+.
 *
 * Funcionalidades:
 *   - start(): começa a ouvir (abre o microfone)
 *   - stop(): para de ouvir
 *   - transcript: texto reconhecido (atualiza em tempo real)
 *   - listening: true enquanto está captando áudio
 *   - onResult(callback): chamado quando termina uma frase
 *
 * Observação: Safari/iOS pode pedir permissão de microfone na primeira vez.
 */
interface SpeechRecognitionHook {
  supported: boolean;
  listening: boolean;
  transcript: string;
  start: (lang?: string) => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(onFinalResult?: (text: string) => void): SpeechRecognitionHook {
  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef(onFinalResult);
  callbackRef.current = onFinalResult;

  const start = useCallback((lang: string = "pt-BR") => {
    if (!supported) return;
    // Se já tá ouvindo, para primeiro.
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignora */ }
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = true;   // resultados parciais (enquanto fala)
    recognition.continuous = true;        // continua ouvindo até parar manualmente

    // Timeout de segurança: 2 minutos no máximo (evita ficar ouvindo pra sempre).
    const MAX_MS = 120_000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
      timeoutId = setTimeout(() => {
        try { recognition.stop(); } catch { /* ignora */ }
      }, MAX_MS);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript(final);
        callbackRef.current?.(final.trim());
      } else if (interim) {
        setTranscript(interim);
      }
    };

    recognition.onerror = () => {
      if (timeoutId) clearTimeout(timeoutId);
      setListening(false);
    };

    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignora */ }
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
  }, []);

  return { supported, listening, transcript, start, stop, reset };
}
