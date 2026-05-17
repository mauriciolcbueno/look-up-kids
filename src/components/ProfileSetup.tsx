import { useState } from "react";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import { motion } from "framer-motion";
import { UserCircle, School, ArrowRight, Loader2 } from "lucide-react";
import Wordmark from "./Wordmark";

interface Props {
  user: User;
  onComplete: (updated: User) => void;
}

export default function ProfileSetup({ user, onComplete }: Props) {
  const [nickname, setNickname] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nick = nickname.trim();
    const sch = school.trim();
    if (!nick || !sch) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    setSaving(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cu = netlifyIdentity.currentUser() as any;
    if (!cu) {
      setError("Sessão expirou. Faz login de novo.");
      setSaving(false);
      return;
    }

    // Always stash locally up front so the user can proceed regardless of what
    // gotrue does. App.tsx + analytics.ts read this fallback when user_metadata
    // is missing the fields.
    const stashKey = `lookup:profile:${cu.id ?? cu.email}`;
    try {
      localStorage.setItem(stashKey, JSON.stringify({ nickname: nick, school: sch }));
    } catch {
      /* ignore quota issues */
    }

    const patched = {
      ...cu,
      user_metadata: { ...(cu.user_metadata ?? {}), nickname: nick, school: sch },
    } as User;

    // Try to persist to Netlify Identity in the background, but never block on it.
    // gotrue.update() is observed to hang ~12s right after signup on some
    // browsers (Safari iOS especially), so we race it against a short timeout
    // and treat any failure as a no-op — the user already has their profile
    // in localStorage and can use the app immediately.
    if (typeof cu.update === "function") {
      const TIMEOUT_MS = 8000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      );
      Promise.race([
        cu.update({ data: { nickname: nick, school: sch } }),
        timeoutPromise,
      ]).catch((err) => {
        // Logged for observability; UI already moved on.
        console.warn("[ProfileSetup] gotrue update did not complete:", err);
      });
    } else {
      console.warn("[ProfileSetup] currentUser().update is not a function");
    }

    onComplete(patched);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-3xl shadow-playful p-8 max-w-md w-full"
      >
        <img
          src="/icon.svg"
          alt=""
          aria-hidden="true"
          className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-soft"
        />
        <div className="flex justify-center mb-4">
          <Wordmark size="md" pill />
        </div>
        <h1 className="text-xl font-black mb-1">Quase pronto!</h1>
        <p className="text-sm text-muted-foreground font-semibold mb-6">
          Conta criada para <strong>{user.email}</strong>. Agora diz-nos um pouco mais.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label htmlFor="nickname" className="block text-sm font-bold mb-1">
              <UserCircle size={14} className="inline mr-1" />
              Apelido (como quer ser chamado?)
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: Gabi, Leozinho, SuperLeitor..."
              maxLength={30}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label htmlFor="school" className="block text-sm font-bold mb-1">
              <School size={14} className="inline mr-1" />
              Nome da escola
            </label>
            <input
              id="school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Ex: Escola Municipal Rui Barbosa"
              maxLength={80}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl shadow-playful hover:scale-[1.03] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowRight size={18} />
            )}
            {saving ? "Salvando..." : "Entrar no LookUp!"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}