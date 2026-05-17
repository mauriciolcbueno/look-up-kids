import { motion } from "framer-motion";
import type { Category } from "@/data/quizData";
import { ArrowRight } from "lucide-react";

interface Props {
  category: Category;
  index: number;
  onClick: () => void;
}

export default function CategoryCard({ category, index, onClick }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.06 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${category.color} text-left rounded-3xl p-5 shadow-playful relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full -translate-y-6 translate-x-6" />
      <div className="relative z-10 text-foreground">
        <div className="text-4xl mb-2">{category.emoji}</div>
        <div className="text-xl font-extrabold">{category.name}</div>
        <div className="text-sm font-semibold opacity-80">{category.description}</div>
        <div className="mt-3 inline-flex items-center gap-1 bg-white/30 rounded-full px-3 py-1 text-xs font-bold">
          Play <ArrowRight size={12} />
        </div>
      </div>
    </motion.button>
  );
}
