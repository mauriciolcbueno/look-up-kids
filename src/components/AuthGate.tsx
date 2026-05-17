import { type ReactNode } from "react";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import { motion } from "framer-motion";
import { LogIn, Lock } from "lucide-react";
import Wordmark from "./Wordmark";

interface Props {
  user: User | null;
  requireAdmin?: boolean;
  children: ReactNode;
}

const ADMIN_ROLE = "admin";

export default function AuthGate({ user, requireAdmin, children }: Props) {
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl shadow-playful p-8 max-w-md w-full"
        >
          <div className="flex justify-center mb-3">
            <Wordmark size="md" pill />
          </div>
          <h1 className="sr-only">Welcome to LookUp kids</h1>
          <p className="text-muted-foreground font-semibold mb-6">
            A safe homework helper powered by Wikipedia. Ask a grown-up to sign you in.
          </p>
          <button
            onClick={() => netlifyIdentity.open()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl shadow-playful hover:scale-[1.03] active:scale-95 transition"
          >
            <LogIn size={18} /> Sign in
          </button>
          <p className="text-xs text-muted-foreground mt-4 font-semibold">
            For school use only. We never store your homework answers.
          </p>
        </motion.div>
      </div>
    );
  }

  if (requireAdmin) {
    const roles = (user.app_metadata?.roles as string[] | undefined) ?? [];
    if (!roles.includes(ADMIN_ROLE)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="bg-card rounded-3xl shadow-playful p-8 max-w-md">
            <Lock className="mx-auto mb-3" />
            <h1 className="text-2xl font-black mb-2">Admins only</h1>
            <p className="text-muted-foreground font-semibold">
              This dashboard is reserved for the LookUp! team.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
