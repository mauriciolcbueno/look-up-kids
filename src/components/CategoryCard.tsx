import { motion } from "framer-motion";
import type { Category } from "@/data/quizData";
import { ArrowRight, Check } from "lucide-react";

interface Props {
  category: Category;
  index: number;
  onClick: () => void;
  done?: boolean;
}

export default function CategoryCard({ category, index, onClick, done }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.06 }}
      whileHover={done ? undefined : { scale: 1.03 }}
      whileTap={done ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={done}
      className={`bg-gradient-to-br ${category.color} text-left rounded-3xl p-5 shadow-playful relative overflow-hidden ${
        done ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full -translate-y-6 translate-x-6" />
      {done && (
        <div className="absolute top-3 right-3 bg-success text-white rounded-full p-1.5 shadow-soft" aria-label="Completed today">
          <Check size={14} strokeWidth={3} />
        </div>
      )}
      <div className="relative z-10 text-foreground">
        <div className="text-4xl mb-2">{category.emoji}</div>
        <div className="text-xl font-extrabold">{category.name}</div>
        <div className="text-sm font-semibold opacity-80">{category.description}</div>
        <div className="mt-3 inline-flex items-center gap-1 bg-white/30 rounded-full px-3 py-1 text-xs font-bold">
          {done ? "Done today" : <>Play <ArrowRight size={12} /></>}
        </div>
      </div>
    </motion.button>
  );
}
