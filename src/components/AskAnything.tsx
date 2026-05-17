import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Volume2,
  Pause,
  Play,
  Square,
  BookOpen,
  Sparkles,
  ShieldAlert,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { askQuestion, type AskResult } from "@/lib/api";
import { speak, pauseSpeech, resumeSpeech, stopSpeech } from "@/lib/tts";
import { logEvent } from "@/lib/analytics";
import { isVoiceInputSupported, startListening, type VoiceSession } from "@/lib/voiceInput";

interface Props {
  onBack: () => void;
}

type AudioState = "idle" | "playing" | "paused";

export default function AskAnything({ onBack }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [audio, setAudio] = useState<AudioState>("idle");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const voiceRef = useRef<VoiceSession | null>(null);
  const lastQuestionRef = useRef<string>("");

  useEffect(() => {
    setVoiceSupported(isVoiceInputSupported());
    return () => voiceRef.current?.stop();
  }, []);

  function toggleVoice() {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      return;
    }
    setListening(true);
    voiceRef.current = startListening(
      (text, isFinal) => {
        setQuestion(text);
        if (isFinal) {
          voiceRef.current?.stop();
          voiceRef.current = null;
          setListening(false);
        }
      },
      () => setListening(false),
      () => setListening(false)
    );
    if (!voiceRef.current) setListening(false);
  }

  async function ask(e?: React.FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    stopSpeech();
    setAudio("idle");
    setLoading(true);
    setResult(null);
    lastQuestionRef.current = q;
    logEvent("ask_submitted", { length: q.length });
    const res = await askQuestion(q);
    setResult(res);
    setLoading(false);
    if (res.status === "ok") logEvent("ask_answered", { hasSource: !!res.source });
    if (res.status === "blocked") logEvent("ask_blocked", { reason: res.reason ?? "unspecified" });
  }

  async function playAudio() {
    if (!result?.answer) return;
    logEvent("ask_audio_played", {});
    setAudio("playing");
    await speak(result.answer, {
      onEnd: () => setAudio("idle"),
      onStart: () => setAudio("playing"),
    });
  }

  function togglePause() {
    if (audio === "playing") {
      pauseSpeech();
      setAudio("paused");
    } else if (audio === "paused") {
      resumeSpeech();
      setAudio("playing");
    }
  }

  function stop() {
    stopSpeech();
    setAudio("idle");
  }

  const samples = [
    "Why do volcanoes erupt?",
    "How does an octopus camouflage?",
    "Who built the pyramids?",
    "What is photosynthesis?",
  ];

  return (
    <div className="max-w-2xl mx-auto px-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-playful p-5 md:p-7"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="text-3xl">🦉</div>
          <div>
            <h2 className="text-2xl font-black">Ask Anything</h2>
            <p className="text-sm text-muted-foreground font-semibold">
              Short, friendly answers using only Wikipedia.
            </p>
          </div>
        </div>

        <form onSubmit={ask} className="flex gap-2 mt-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={listening ? "Listening… speak now" : "e.g. Why is the sky blue?"}
            className={`flex-1 rounded-2xl border-2 outline-none px-4 py-3 font-semibold bg-background ${
              listening ? "border-secondary animate-pulse" : "border-muted focus:border-primary"
            }`}
            maxLength={200}
            aria-label="Your question"
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={loading}
              className={`px-3 py-3 rounded-2xl shadow-soft hover:scale-105 active:scale-95 transition ${
                listening
                  ? "bg-danger text-white animate-pulse"
                  : "bg-accent text-accent-foreground"
              }`}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              title={listening ? "Stop listening" : "Speak your question"}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-primary text-primary-foreground font-extrabold px-4 py-3 rounded-2xl shadow-soft disabled:opacity-50 hover:scale-105 active:scale-95 transition"
            aria-label="Ask"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>

        {!result && !loading && (
          <div className="mt-4">
            <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles size={12} /> Try one
            </div>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="bg-muted hover:bg-primary/20 rounded-full px-3 py-1.5 text-xs font-bold transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.status + lastQuestionRef.current}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5"
            >
              {result.status === "ok" && result.answer && (
                <div className="bg-background rounded-2xl p-4 border-2 border-muted">
                  <p className="font-semibold leading-relaxed whitespace-pre-wrap">{result.answer}</p>

                  {result.source && (
                    <a
                      href={result.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                    >
                      <BookOpen size={12} /> Source: Wikipedia — {result.source.title}
                    </a>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    {audio === "idle" && (
                      <button
                        onClick={playAudio}
                        className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground font-bold rounded-full px-3 py-1.5 text-sm hover:scale-105 transition"
                        aria-label="Listen to answer"
                      >
                        <Volume2 size={14} /> Listen
                      </button>
                    )}
                    {audio !== "idle" && (
                      <>
                        <button
                          onClick={togglePause}
                          className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground font-bold rounded-full px-3 py-1.5 text-sm"
                          aria-label={audio === "playing" ? "Pause" : "Resume"}
                        >
                          {audio === "playing" ? <Pause size={14} /> : <Play size={14} />}
                          {audio === "playing" ? "Pause" : "Resume"}
                        </button>
                        <button
                          onClick={stop}
                          className="inline-flex items-center gap-1.5 bg-muted font-bold rounded-full px-3 py-1.5 text-sm"
                          aria-label="Stop"
                        >
                          <Square size={12} /> Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {result.status === "blocked" && (
                <div className="bg-secondary/10 rounded-2xl p-4 border-2 border-secondary/30">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={20} className="text-secondary mt-0.5" />
                    <div>
                      <p className="font-extrabold">Oops! 🙊</p>
                      <p className="text-sm font-semibold text-muted-foreground">
                        I can't help with that one. How about asking me about animals, history, or how rainbows are made?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.status === "error" && (
                <div className="bg-danger/10 rounded-2xl p-4 border-2 border-danger/30">
                  <p className="font-bold text-sm">Hmm, something went wrong. Try again in a moment.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-muted-foreground font-semibold mt-4">
          LookUp! only uses information from Wikipedia. Always double-check important facts with a grown-up or your teacher.
        </p>
      </motion.div>
    </div>
  );
}
