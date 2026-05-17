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
        try {
                const updated = await netlifyIdentity.currentUser()!.update({
                          data: { nickname: nick, school: sch },
                });
                onComplete(updated as User);
        } catch (err) {
                setError("Erro ao salvar. Tente novamente.");
                setSaving(false);
        }
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
                      </div>div>
                      <h1 className="text-xl font-black mb-1">Quase pronto!</h1>h1>
                      <p className="text-sm text-muted-foreground font-semibold mb-6">
                                Conta criada para <strong>{user.email}</strong>strong>. Agora diz-nos um pouco mais.
                      </p>p>
              
                      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                                <div>
                                            <label htmlFor="nickname" className="block text-sm font-bold mb-1">
                                                          <UserCircle size={14} className="inline mr-1" />
                                                          Apelido (como quer ser chamado?)
                                            </label>label>
                                            <input
                                                            id="nickname"
                                                            type="text"
                                                            value={nickname}
                                                            onChange={(e) => setNickname(e.target.value)}
                                                            placeholder="Ex: Gabi, Leozinho, SuperLeitor…"
                                                            maxLength={30}
                                                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                                                          />
                                </div>div>
                      
                                <div>
                                            <label htmlFor="school" className="block text-sm font-bold mb-1">
                                                          <School size={14} className="inline mr-1" />
                                                          Nome da escola
                                            </label>label>
                                            <input
                                                            id="school"
                                                            type="text"
                                                            value={school}
                                                            onChange={(e) => setSchool(e.target.value)}
                                                            placeholder="Ex: Escola Municipal Rui Barbosa"
                                                            maxLength={80}
                                                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                                                          />
                                </div>div>
                      
                        {error && (
                                    <p className="text-sm text-destructive font-semibold">{error}</p>p>
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
                                  {saving ? "Salvando…" : "Entrar no LookUp!"}
                                </button>button>
                      </form>form>
              </motion.div>motion.div>
        </div>div>
      );
}</div>
