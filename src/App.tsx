import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AuthGate from "./components/AuthGate";
import ProfileSetup from "./components/ProfileSetup";
import { fetchProfile } from "@/lib/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    netlifyIdentity.init();
    setUser(netlifyIdentity.currentUser());
    setReady(true);

    netlifyIdentity.on("login", (u) => {
      setUser(u);
      netlifyIdentity.close();
    });
    netlifyIdentity.on("logout", () => setUser(null));

    return () => {
      netlifyIdentity.off("login");
      netlifyIdentity.off("logout");
    };
  }, []);

  // On any user change, if the server has a profile but local cache doesn't,
  // hydrate localStorage so the rest of the app sees it. Lets a kid sign in
  // from a new device and skip the ProfileSetup form.
  useEffect(() => {
    if (!user) return;
    const stashKey = `lookup:profile:${user.id ?? user.email}`;
    let stashed: { nickname?: string; school?: string } = {};
    try {
      stashed = JSON.parse(localStorage.getItem(stashKey) ?? "{}");
    } catch { /* ignore */ }
    if (stashed.nickname && stashed.school) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (user.user_metadata ?? {}) as any;
    if (meta.nickname && meta.school) return;
    fetchProfile().then((p) => {
      if (p?.nickname && p?.school) {
        try {
          localStorage.setItem(stashKey, JSON.stringify({ nickname: p.nickname, school: p.school }));
          // Trigger a re-render so the new fallback gets picked up
          setUser({ ...user });
        } catch { /* ignore */ }
      }
    });
  }, [user]);

  if (!ready) return null;

  // Local dev only: ?dev=1 mocks a logged-in user so we can preview UI
  // without the Netlify Identity dance. Tree-shaken from production builds.
  const effectiveUser =
    import.meta.env.DEV && new URLSearchParams(window.location.search).get("dev")
      ? ({
          id: "dev-user",
          email: "dev@lookup.local",
          user_metadata: { full_name: "Dev User", nickname: "DevKid", school: "Test School" },
          app_metadata: { roles: ["admin"] },
        } as unknown as User)
      : user;

  // If user is logged in but hasn't set nickname/school yet, show profile setup.
  // We also accept a localStorage fallback (set by ProfileSetup if gotrue update fails)
  // so the form doesn't reappear on every reload when Identity metadata sync misbehaves.
  if (effectiveUser) {
    const meta = (effectiveUser.user_metadata ?? {}) as Record<string, string>;
    const stashKey = `lookup:profile:${effectiveUser.id ?? effectiveUser.email}`;
    let fallback: { nickname?: string; school?: string } = {};
    try {
      const raw = localStorage.getItem(stashKey);
      if (raw) fallback = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const nickname = meta.nickname ?? fallback.nickname;
    const school = meta.school ?? fallback.school;
    if (!nickname || !school) {
      return (
        <ProfileSetup
          user={effectiveUser}
          onComplete={(updated) => setUser(updated)}
        />
      );
    }
    // Make sure downstream components see the merged metadata
    if ((!meta.nickname || !meta.school) && fallback.nickname && fallback.school) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (effectiveUser as any).user_metadata = { ...meta, nickname, school };
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<AuthGate user={effectiveUser}><Index user={effectiveUser} /></AuthGate>}
      />
      <Route
        path="/admin"
        element={
          <AuthGate user={effectiveUser} requireAdmin>
            <AdminDashboard user={effectiveUser} />
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}