import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2 } from "lucide-react";

interface Entry {
  userId: string;
  displayName: string;
  points: number;
}

interface ApiResponse {
  week: string;
  resetsAt: string;
  top: Entry[];
}

const MEDALS = ["🥇", "🥈", "🥉"];
const ROW_STYLES = [
  "from-amber-300/80 to-yellow-300/60 border-amber-400",
  "from-zinc-200 to-zinc-100 border-zinc-300",
  "from-orange-200 to-amber-100 border-amber-300",
];

function daysUntil(iso: string): string {
  const target = new Date(iso).getTime();
  const ms = target - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 1) return "Resets tomorrow";
  return `Resets in ${days} days`;
}

export default function Leaderboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
        // cache-bust each call so we don't see stale data right after a game
        const res = await fetch(
          `/.netlify/functions/leaderboard?limit=3&_=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error("non-json");
        const json: ApiResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setReachable(true);
        }
      } catch {
        if (!cancelled) setReachable(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Initial load
    load();

    // If a game was just played in this tab, retry once after 3s — gives
    // Netlify Blobs eventual consistency time to surface the new event.
    let retryId: number | undefined;
    if (sessionStorage.getItem("lookup:justPlayed") === "1") {
      sessionStorage.removeItem("lookup:justPlayed");
      retryId = window.setTimeout(() => load(true), 3000);
    }

    // Refresh whenever the tab regains focus
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (retryId) clearTimeout(retryId);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!reachable) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="w-full max-w-xl mb-8 bg-card rounded-3xl shadow-playful p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          <h2 className="text-xl font-extrabold">This week's top 3</h2>
        </div>
        {data && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            {daysUntil(data.resetsAt)}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
          <Loader2 className="animate-spin" size={14} /> Loading rankings…
        </div>
      )}

      {!loading && data && data.top.length === 0 && (
        <div className="text-sm text-muted-foreground font-semibold py-2">
          No scores yet this week. Play a quiz or WikiWord to take the lead! 🚀
        </div>
      )}

      {!loading && data && data.top.length > 0 && (
        <ol className="space-y-2">
          {data.top.map((e, i) => (
            <li
              key={e.userId}
              className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${ROW_STYLES[i] ?? "from-muted to-muted"} border-2 px-3 py-2`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl">{MEDALS[i] ?? "🏅"}</span>
                <span className="font-extrabold truncate">{e.displayName}</span>
              </div>
              <span className="font-black text-foreground tabular-nums">
                {e.points.toLocaleString()} pts
              </span>
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  );
}
