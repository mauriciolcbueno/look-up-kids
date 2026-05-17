import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Trophy, BookOpen } from "lucide-react";
import { pickDaily, todayKey, type Category } from "@/data/quizData";
import { logEvent } from "@/lib/analytics";
import { quizPoints } from "@/lib/scoring";

interface Props {
  category: Category;
  onBack: () => void;
}

const QUESTIONS_PER_SESSION = 5;

export default function QuizGame({ category, onBack }: Props) {
  const questions = useMemo(
    () => pickDaily(category.questions, QUESTIONS_PER_SESSION, `${category.id}-${todayKey()}`),
    [category]
  );

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [done, setDone] = useState(false);
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    logEvent("quiz_started", { category: category.id });
  }, [category.id]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [idx]);

  const current = questions[idx];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === current.answer;
    const elapsedMs = Date.now() - questionStartRef.current;
    const earned = quizPoints(correct, elapsedMs);
    if (correct) setScore((s) => s + 1);
    if (earned > 0) setPoints((p) => p + earned);
    logEvent("quiz_question_answered", {
      category: category.id,
      questionIndex: idx,
      correct,
      elapsedMs,
      points: earned,
    });
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setDone(true);
        logEvent("quiz_completed", {
          category: category.id,
          score: correct ? score + 1 : score,
          total: questions.length,
          points: points + earned,
        });
      } else {
        setIdx((n) => n + 1);
        setPicked(null);
      }
    }, 1100);
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl shadow-playful p-8 text-center"
        >
          <Trophy size={56} className="mx-auto text-primary mb-3" />
          <h2 className="text-3xl font-black mb-1">
            {pct >= 80 ? "Amazing!" : pct >= 50 ? "Great job!" : "Good try!"}
          </h2>
          <p className="text-muted-foreground font-semibold mb-2">
            You got <span className="text-foreground font-black">{score}</span> of {questions.length} right.
          </p>
          <p className="text-muted-foreground font-semibold mb-4">
            <span className="text-foreground font-black text-xl">+{points}</span> points this week 🏆
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onBack}
              className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-2xl shadow-soft hover:scale-105 active:scale-95 transition"
            >
              Back home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-sm font-extrabold bg-card rounded-full px-3 py-1 shadow-soft">
          {idx + 1} / {questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-card rounded-3xl shadow-playful p-6"
        >
          <div className="text-3xl mb-2">{category.emoji}</div>
          <h2 className="text-xl md:text-2xl font-black mb-5">{current.q}</h2>
          <div className="grid gap-3">
            {current.options.map((opt, i) => {
              const isPicked = picked === i;
              const isCorrect = i === current.answer;
              const showState = picked !== null;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={`text-left rounded-2xl px-4 py-3 font-bold border-2 transition flex items-center justify-between
                    ${showState && isCorrect ? "bg-success/15 border-success text-foreground" : ""}
                    ${showState && isPicked && !isCorrect ? "bg-danger/15 border-danger text-foreground" : ""}
                    ${!showState ? "bg-muted border-transparent hover:border-primary hover:bg-primary/10" : ""}
                    ${showState && !isPicked && !isCorrect ? "opacity-60" : ""}
                  `}
                >
                  <span>{opt}</span>
                  {showState && isCorrect && <Check size={20} className="text-success" />}
                  {showState && isPicked && !isCorrect && <X size={20} className="text-danger" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              href={`https://en.wikipedia.org/wiki/${current.wiki}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
            >
              <BookOpen size={12} /> Learn more on Wikipedia
            </motion.a>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
