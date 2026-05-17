/**
 * Text-to-speech wrapper around the Web Speech API.
 * Picks the best available voice for kids: prefers premium/neural voices
 * in the user's language with a friendly, natural sound. Free, no token cost.
 */

const PREFERRED_VOICE_HINTS = [
  "Samantha", "Allison", "Ava", "Karen", "Moira", "Tessa", "Serena", "Susan",
  "Google US English", "Google UK English Female", "Microsoft Aria",
  "Microsoft Jenny", "Microsoft Sonia", "Microsoft Libby",
];

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

export async function pickVoice(lang = "en-US"): Promise<SpeechSynthesisVoice | null> {
  const voices = cachedVoices ?? (await loadVoices());
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
  for (const hint of PREFERRED_VOICE_HINTS) {
    const match = langVoices.find((v) => v.name.includes(hint));
    if (match) return match;
  }
  const neural = langVoices.find((v) => /neural|premium|enhanced/i.test(v.name));
  if (neural) return neural;
  return langVoices[0] ?? voices[0] ?? null;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.voice = await pickVoice(opts.lang ?? "en-US");
  utt.rate = opts.rate ?? 0.95;
  utt.pitch = opts.pitch ?? 1.05;
  utt.lang = opts.lang ?? "en-US";
  if (opts.onBoundary) utt.onboundary = (e) => opts.onBoundary?.(e.charIndex);
  if (opts.onEnd) utt.onend = opts.onEnd;
  if (opts.onStart) utt.onstart = opts.onStart;
  window.speechSynthesis.speak(utt);
}

export function pauseSpeech() {
  window.speechSynthesis.pause();
}
export function resumeSpeech() {
  window.speechSynthesis.resume();
}
export function stopSpeech() {
  window.speechSynthesis.cancel();
}
