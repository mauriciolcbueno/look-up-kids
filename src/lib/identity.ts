import netlifyIdentity, { type User } from "netlify-identity-widget";

// The widget's .jwt() actually accepts a forceRefresh boolean but the
// bundled types don't declare it — override just enough for the cast.
type UserWithJwt = User & { jwt: (forceRefresh?: boolean) => Promise<string> };

export async function currentJwt(forceRefresh = false): Promise<string | null> {
  const user = netlifyIdentity.currentUser() as UserWithJwt | null;
  if (!user || typeof user.jwt !== "function") return null;
  try {
    return await user.jwt(forceRefresh);
  } catch {
    return null;
  }
}

export async function jwtFor(
  user: User | null,
  forceRefresh = false,
): Promise<string | null> {
  const u = user as UserWithJwt | null;
  if (!u || typeof u.jwt !== "function") return null;
  try {
    return await u.jwt(forceRefresh);
  } catch {
    return null;
  }
}
