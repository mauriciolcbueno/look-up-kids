import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import netlifyIdentity, { type User } from "netlify-identity-widget";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AuthGate from "./components/AuthGate";
import ProfileSetup from "./components/ProfileSetup";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    netlifyIdentity.init({ APIUrl: "https://effulgent-parfait-7c389b.netlify.app/.netlify/identity" });
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

  // If user is logged in but hasn't set nickname/school yet, show profile setup
  if (effectiveUser) {
    const meta = effectiveUser.user_metadata as Record<string, string> | undefined;
    const hasProfile = meta?.nickname && meta?.school;
    if (!hasProfile) {
      return (
        <ProfileSetup
          user={effectiveUser}
          onComplete={(updated) => setUser(updated)}
        />
      );
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