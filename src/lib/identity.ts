import netlifyIdentity, { type User } from "netlify-identity-widget";

type UserWithJwt = User & { jwt: () => Promise<string> };

export async function currentJwt(): Promise<string | null> {
  const user = netlifyIdentity.currentUser() as UserWithJwt | null;
  if (!user || typeof user.jwt !== "function") return null;
  try {
    return await user.jwt();
  } catch {
    return null;
  }
}

export async function jwtFor(user: User | null): Promise<string | null> {
  const u = user as UserWithJwt | null;
  if (!u || typeof u.jwt !== "function") return null;
  try {
    return await u.jwt();
  } catch {
    return null;
  }
}
