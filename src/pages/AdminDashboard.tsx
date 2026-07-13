import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import { jwtFor } from "@/lib/identity";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { ArrowLeft, Loader2, RefreshCw, Users, MessageSquare, BarChart3 } from "lucide-react";

interface Stats {
  totalEvents: number;
  uniqueUsers: number;
  byName: Record<string, number>;
  series: { day: string; count: number }[];
  recent: { name: string; day: string; ts: number; userId: string; props: Record<string, unknown> }[];
}

interface Profile {
  userId: string;
  nickname: string;
  school: string;
  email: string | null;
  createdAt: number;
  updatedAt: number;
}

interface Props {
  user: User | null;
}

export default function AdminDashboard({ user }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  function isSessionReason(reason: string | undefined): boolean {
    if (!reason) return false;
    const r = reason.toLowerCase();
    return (
      r.includes("jwt missing or invalid") ||
      r.includes("missing authorization") ||
      r.includes("rejected the token") ||
      r.includes("expired") ||
      r.includes("invalid")
    );
  }

  async function tryFetch(token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    const [statsRes, profRes] = await Promise.all([
      fetch("/.netlify/functions/admin-stats", { headers }),
      fetch("/.netlify/functions/admin-profiles", { headers }),
    ]);
    return { statsRes, profRes };
  }

  async function load() {
    setLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      // First try with whatever token the widget has cached
      let token = await jwtFor(user);
      if (!token) {
        setSessionExpired(true);
        return;
      }
      let { statsRes, profRes } = await tryFetch(token);

      // If server didn't recognize the JWT, force a refresh and retry once.
      // This handles the common case of an expired but refreshable session.
      if (statsRes.status === 403) {
        const body = await statsRes.clone().json().catch(() => ({}));
        const reason = (body as { reason?: string }).reason;
        if (isSessionReason(reason)) {
          const refreshed = await jwtFor(user, true);
          if (!refreshed) {
            setSessionExpired(true);
            return;
          }
          ({ statsRes, profRes } = await tryFetch(refreshed));
          if (statsRes.status === 403) {
            const body2 = await statsRes.json().catch(() => ({}));
            const reason2 = (body2 as { reason?: string }).reason;
            if (reason2?.includes("JWT missing or invalid")) {
              setSessionExpired(true);
              return;
            }
            throw new Error(reason2 ?? "Forbidden after refresh");
          }
        }
      }

      if (!statsRes.ok) {
        const body = await statsRes.json().catch(() => ({}));
        const reason = (body as { reason?: string }).reason ?? `HTTP ${statsRes.status}`;
        throw new Error(reason);
      }
      setStats(await statsRes.json());
      if (profRes.ok) {
        const data = (await profRes.json()) as { profiles: Profile[] };
        setProfiles(data.profiles);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byNameRows = stats
    ? Object.entries(stats.byName)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back to app
          </Link>
          <h1 className="text-3xl md:text-4xl font-black mt-1">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            Live usage and activity from LookUp! kids.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1 text-xs font-bold bg-card hover:bg-muted rounded-full px-3 py-1.5 shadow-soft transition"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => netlifyIdentity.logout()}
            className="inline-flex items-center gap-1 text-xs font-bold bg-card hover:bg-danger/20 rounded-full px-3 py-1.5 shadow-soft transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
          <Loader2 className="animate-spin" size={16} /> Loading…
        </div>
      )}

      {sessionExpired && (
        <div className="bg-primary/10 border-2 border-primary/40 rounded-2xl p-4">
          <p className="font-extrabold mb-2">Your session expired</p>
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Sign in again to see the dashboard.
          </p>
          <button
            onClick={() => {
              netlifyIdentity.logout();
              setTimeout(() => netlifyIdentity.open(), 200);
            }}
            className="inline-flex items-center gap-1 text-sm font-bold bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-soft"
          >
            Sign in again
          </button>
        </div>
      )}

      {error && !sessionExpired && (
        <div className="bg-danger/10 border-2 border-danger/30 rounded-2xl p-4 font-bold">
          Couldn't load stats: {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard icon={<BarChart3 size={18} />} label="Total events" value={stats.totalEvents} />
            <KpiCard icon={<Users size={18} />} label="Unique users" value={stats.uniqueUsers} />
            <KpiCard
              icon={<MessageSquare size={18} />}
              label="Questions answered"
              value={stats.byName["ask_answered"] ?? 0}
            />
          </div>

          <div className="bg-card rounded-3xl shadow-soft p-5 mb-6">
            <h2 className="font-extrabold mb-3">Events per day</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={stats.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(280 80% 65%)" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-3xl shadow-soft p-5 mb-6">
            <h2 className="font-extrabold mb-3">Top events</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={byNameRows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={160} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(45 100% 60%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {profiles && (
            <div className="bg-card rounded-3xl shadow-soft p-5 mb-6">
              <h2 className="font-extrabold mb-1">Registered users</h2>
              <p className="text-xs text-muted-foreground font-semibold mb-3">
                {profiles.length} {profiles.length === 1 ? "kid has" : "kids have"} set up their profile.
              </p>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No profiles yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-4">Nickname</th>
                        <th className="py-1.5 pr-4">School</th>
                        <th className="py-1.5 pr-4">Email</th>
                        <th className="py-1.5">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.userId} className="border-t border-muted">
                          <td className="py-1.5 pr-4 font-bold">{p.nickname}</td>
                          <td className="py-1.5 pr-4">{p.school}</td>
                          <td className="py-1.5 pr-4 font-mono text-[10px]">{p.email ?? "—"}</td>
                          <td className="py-1.5 font-mono text-[10px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-card rounded-3xl shadow-soft p-5">
            <h2 className="font-extrabold mb-3">Recent activity (last 30)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1.5 pr-4">When</th>
                    <th className="py-1.5 pr-4">Event</th>
                    <th className="py-1.5 pr-4">User</th>
                    <th className="py-1.5">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((r, i) => (
                    <tr key={i} className="border-t border-muted">
                      <td className="py-1.5 pr-4 font-mono">
                        {new Date(r.ts).toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-4 font-bold">{r.name}</td>
                      <td className="py-1.5 pr-4 font-mono text-[10px] truncate max-w-[10ch]">
                        {r.userId.slice(0, 8)}
                      </td>
                      <td className="py-1.5 text-muted-foreground font-mono text-[10px]">
                        {JSON.stringify(r.props)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl shadow-soft p-4">
      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="text-3xl font-black mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
