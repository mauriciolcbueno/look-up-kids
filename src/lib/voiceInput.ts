/**
 * Thin wrapper around the Web Speech Recognition API.
 * Lets younger kids speak a question instead of typing. Free, no token cost.
 */

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionEvent extends Event {
  results: { [i: number]: { [j: number]: { transcript: string } } & { isFinal: boolean }; length: number };
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceInputSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface VoiceSession {
  stop(): void;
}

export function startListening(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError?: (err: string) => void,
  onEnd?: () => void,
  lang = "en-US"
): VoiceSession | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let interim = "";
    let finalText = "";
    for (let i = 0; i < e.results.length; i++) {
      const result = e.results[i];
      const text = result[0].transcript;
      if (result.isFinal) finalText += text;
      else interim += text;
    }
    onTranscript(finalText || interim, !!finalText);
  };
  recognition.onerror = (e) => onError?.(e.error);
  recognition.onend = () => onEnd?.();
  recognition.start();
  return { stop: () => recognition.stop() };
}
