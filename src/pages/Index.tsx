import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import { categories } from "@/data/quizData";
import CategoryCard from "@/components/CategoryCard";
import QuizGame from "@/components/QuizGame";
import AskAnything from "@/components/AskAnything";
import WordleGame from "@/components/WordleGame";
import Leaderboard from "@/components/Leaderboard";
import Wordmark from "@/components/Wordmark";
import { logEvent } from "@/lib/analytics";
import {
  Sparkles,
  MessageCircle,
  Mic,
  ArrowRight,
  LogOut,
  Type,
  ShieldCheck,
} from "lucide-react";

type View = "home" | "quiz" | "ask" | "wordle";

interface Props {
  user: User | null;
}

const ADMIN_ROLE = "admin";

export default function Index({ user }: Props) {
  const [view, setView] = useState<View>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const category = categories.find((c) => c.id === selectedCategory);
  const isAdmin = ((user?.app_metadata?.roles as string[] | undefined) ?? []).includes(ADMIN_ROLE);

  useEffect(() => {
    logEvent("page_view", { view });
  }, [view]);

  if (view === "ask") {
    return (
      <div className="min-h-screen py-8">
        <AskAnything onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "wordle") {
    return (
      <div className="min-h-screen py-8">
        <WordleGame onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "quiz" && category) {
    return (
      <div className="min-h-screen py-8">
        <QuizGame
          category={category}
          onBack={() => {
            setView("home");
            setSelectedCategory(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl flex justify-between items-center gap-2 mb-4">
        <span className="text-xs font-bold text-muted-foreground truncate min-w-0">
          Hi, {(() => {
            const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
            return meta.nickname || meta.full_name || user?.email || "friend";
          })()} 👋
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-xs font-bold bg-muted hover:bg-secondary/20 rounded-full px-3 py-1.5 transition"
            >
              <ShieldCheck size={12} /> Admin
            </Link>
          )}
          <button
            onClick={() => netlifyIdentity.logout()}
            className="inline-flex items-center gap-1 text-xs font-bold bg-muted hover:bg-danger/20 rounded-full px-3 py-1.5 transition"
            aria-label="Sign out"
          >
            <LogOut size={12} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 flex flex-col items-center"
      >
        <motion.div
          className="inline-flex items-center gap-2 bg-primary/40 rounded-full px-4 py-1.5 mb-5"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Sparkles size={16} className="text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Ask Wikipedia and let AI help you
          </span>
        </motion.div>
        <Wordmark size="lg" className="mb-3" />
        <p className="text-lg text-muted-foreground font-semibold max-w-md mx-auto">
          Pick a topic and test your knowledge with amazing questions! 🧠
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setView("ask")}
        className="w-full max-w-xl mb-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-3xl p-6 cursor-pointer text-left shadow-playful relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-card/10 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-card/20 flex items-center justify-center">
              <MessageCircle size={28} className="text-secondary-foreground" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-card/15 flex items-center justify-center">
              <Mic size={20} className="text-secondary-foreground" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-secondary-foreground mb-1">
            🦉 Ask Anything
          </h3>
          <p className="text-sm text-secondary-foreground/80 font-semibold mb-3">
            Type any question and get an instant Wikipedia answer. Now with audio 🔊
          </p>
          <div className="inline-flex items-center gap-1.5 bg-card/20 rounded-full px-3 py-1.5 text-xs font-bold text-secondary-foreground">
            Start exploring <ArrowRight size={12} />
          </div>
        </div>
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xl mb-4 mt-4"
      >
        <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          🏆 Daily Challenges
        </h2>
        <p className="text-sm text-muted-foreground font-semibold">
          Track your rank, guess the word, and tackle a quiz — fresh every day!
        </p>
      </motion.div>

      <Leaderboard />

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setView("wordle")}
        className="w-full max-w-xl mb-8 bg-gradient-to-br from-accent to-accent/70 rounded-3xl p-5 cursor-pointer text-left shadow-playful relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-card/15 rounded-full -translate-y-6 translate-x-6" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card/25 flex items-center justify-center">
            <Type size={24} className="text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-accent-foreground">
              WikiWord 🦉
            </h3>
            <p className="text-sm text-accent-foreground/80 font-semibold">
              Guess today's 5-letter word. New one tomorrow!
            </p>
          </div>
          <ArrowRight size={20} className="text-accent-foreground" />
        </div>
      </motion.button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-8">
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            index={i}
            onClick={() => {
              setSelectedCategory(cat.id);
              setView("quiz");
            }}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-sm text-muted-foreground font-semibold"
      >
        Made with 💛 for curious minds
      </motion.p>
    </div>
  );
}
