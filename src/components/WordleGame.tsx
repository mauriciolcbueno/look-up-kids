import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Lightbulb, RotateCw } from "lucide-react";
import { wordOfTheDay } from "@/data/wikiWords";
import { logEvent } from "@/lib/analytics";
import { wordlePoints } from "@/lib/scoring";
import { markWordleDoneToday } from "@/lib/dailyState";

interface Props {
  onBack: () => void;
}

const ROWS = 6;
const COLS = 5;

type LetterState = "correct" | "present" | "absent" | "empty";

const KEYBOARD = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","BACK"],
];

function evaluate(guess: string, solution: string): LetterState[] {
  const result: LetterState[] = Array(COLS).fill("absent");
  const sol = solution.split("");
  const used = Array(COLS).fill(false);
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === sol[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && guess[i] === sol[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

export default function WordleGame({ onBack }: Props) {
  const wod = useMemo(() => wordOfTheDay(), []);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    logEvent("wordle_started", { date: new Date().toISOString().slice(0, 10) });
  }, []);

  const submit = useCallback(() => {
    if (current.length !== COLS || status !== "playing") {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const next = [...guesses, current];
    setGuesses(next);
    logEvent("wordle_guess", { attempt: next.length, length: current.length });
    if (current === wod.word) {
      setStatus("won");
      try { sessionStorage.setItem("lookup:justPlayed", "1"); } catch { /* ignore */ }
      markWordleDoneToday();
      logEvent("wordle_won", {
        attempts: next.length,
        points: wordlePoints(next.length),
      });
    } else if (next.length >= ROWS) {
      setStatus("lost");
      markWordleDoneToday();
      logEvent("wordle_lost", { word: wod.word });
    }
    setCurrent("");
  }, [current, guesses, status, wod.word]);

  const pressKey = useCallback(
    (k: string) => {
      if (status !== "playing") return;
      if (k === "ENTER") return submit();
      if (k === "BACK") return setCurrent((c) => c.slice(0, -1));
      if (/^[A-Z]$/.test(k) && current.length < COLS) setCurrent((c) => c + k);
    },
    [current.length, status, submit]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") return pressKey("ENTER");
      if (e.key === "Backspace") return pressKey("BACK");
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) pressKey(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressKey]);

  const keyState: Record<string, LetterState> = {};
  for (const g of guesses) {
    const ev = evaluate(g, wod.word);
    for (let i = 0; i < COLS; i++) {
      const letter = g[i];
      const cur = keyState[letter];
      const next = ev[i];
      if (cur === "correct") continue;
      if (cur === "present" && next === "absent") continue;
      keyState[letter] = next;
    }
  }

  const rows: string[] = [];
  for (let i = 0; i < ROWS; i++) {
    if (i < guesses.length) rows.push(guesses[i]);
    else if (i === guesses.length) rows.push(current.padEnd(COLS, " "));
    else rows.push("     ");
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => setShowHint((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-bold bg-accent/30 hover:bg-accent/50 rounded-full px-3 py-1.5 transition"
        >
          <Lightbulb size={12} /> {showHint ? "Hide hint" : "Show hint"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-playful p-5"
      >
        <div className="text-center mb-2">
          <h2 className="text-2xl font-black">WikiWord 🦉</h2>
          <p className="text-xs font-bold text-muted-foreground">A new word every day</p>
        </div>

        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-accent/15 border-2 border-accent/30 rounded-2xl px-3 py-2 mb-3 text-sm font-semibold text-center"
          >
            💡 {wod.hint}
          </motion.div>
        )}

        <div className={`grid grid-rows-${ROWS} gap-1.5 mb-4 ${shake ? "animate-shake" : ""}`}>
          {rows.map((row, ri) => {
            const evaluated = ri < guesses.length ? evaluate(row, wod.word) : null;
            return (
              <div key={ri} className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: COLS }).map((_, ci) => {
                  const letter = row[ci]?.trim() ?? "";
                  const state = evaluated?.[ci];
                  const base = "aspect-square rounded-lg flex items-center justify-center font-black text-xl md:text-2xl uppercase border-2 transition";
                  const cls =
                    state === "correct" ? "bg-success text-white border-success" :
                    state === "present" ? "bg-primary text-foreground border-primary" :
                    state === "absent" ? "bg-muted-foreground/40 text-white border-muted-foreground/40" :
                    letter ? "bg-background border-foreground/30" : "bg-background border-muted";
                  return (
                    <div key={ci} className={`${base} ${cls}`}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {status === "won" && (
          <div className="bg-success/15 border-2 border-success/30 rounded-2xl p-3 text-center mb-3">
            <p className="font-extrabold">You got it! 🎉</p>
            <p className="text-sm font-bold text-foreground">
              +{wordlePoints(guesses.length)} points this week 🏆
            </p>
            <a
              href={`https://en.wikipedia.org/wiki/${wod.wiki}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline mt-1"
            >
              <BookOpen size={12} /> Learn about {wod.word} on Wikipedia
            </a>
          </div>
        )}

        {status === "lost" && (
          <div className="bg-danger/10 border-2 border-danger/30 rounded-2xl p-3 text-center mb-3">
            <p className="font-extrabold">The word was {wod.word}</p>
            <a
              href={`https://en.wikipedia.org/wiki/${wod.wiki}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline mt-1"
            >
              <BookOpen size={12} /> Read about {wod.word}
            </a>
          </div>
        )}

        <div className="space-y-1.5">
          {KEYBOARD.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map((k) => {
                const ks = keyState[k];
                const wide = k === "ENTER" || k === "BACK";
                const cls =
                  ks === "correct" ? "bg-success text-white" :
                  ks === "present" ? "bg-primary text-foreground" :
                  ks === "absent" ? "bg-muted-foreground/30 text-white" :
                  "bg-muted text-foreground";
                return (
                  <button
                    key={k}
                    onClick={() => pressKey(k)}
                    className={`${cls} ${wide ? "px-2 text-xs" : "w-8 md:w-9"} h-12 rounded-md font-bold uppercase active:scale-95 transition`}
                  >
                    {k === "BACK" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {status !== "playing" && (
          <button
            onClick={onBack}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-extrabold px-5 py-3 rounded-2xl shadow-soft hover:scale-[1.02] active:scale-95 transition"
          >
            <RotateCw size={16} /> Back home
          </button>
        )}
      </motion.div>
    </div>
  );
}
