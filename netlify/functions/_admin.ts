import type { HandlerEvent } from "@netlify/functions";

/**
 * Verifies whether a request comes from a Netlify Identity user with the
 * `admin` role, WITHOUT relying on event.clientContext.
 *
 * Background: the classic (v1) Netlify Functions runtime is supposed to
 * decode a Netlify Identity Bearer JWT into event.clientContext.user, but
 * we've observed it staying null in this project even when the widget has
 * a fresh valid token. Instead of debugging that, we re-verify the token
 * by calling Identity's own /user endpoint with it. If Identity accepts
 * the token, we trust the returned user object.
 *
 * Costs one extra HTTPS round-trip per admin call — fine for a low-volume
 * dashboard, and it always sees the latest metadata (helps when roles were
 * just updated on the Netlify UI).
 */

interface IdentityUser {
  id: string;
  email: string;
  app_metadata?: { roles?: string[] };
  user_metadata?: Record<string, unknown>;
}

export type AdminCheckResult =
  | { ok: true; user: IdentityUser }
  | { ok: false; status: number; reason: string; seen?: unknown };

function bearerFrom(event: HandlerEvent): string | null {
  const raw =
    event.headers?.authorization ?? event.headers?.Authorization ?? null;
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  return match ? match[1].trim() : null;
}

function identityURLFrom(event: HandlerEvent): string {
  // Prefer the site URL Netlify injects; fall back to the request Host.
  // Using the current-request host means we call the same site's Identity,
  // even on branch deploys or custom domains.
  const envUrl = process.env.URL;
  if (envUrl) return `${envUrl.replace(/\/+$/, "")}/.netlify/identity/user`;
  const host = event.headers?.host ?? event.headers?.Host;
  const proto =
    event.headers?.["x-forwarded-proto"] ??
    event.headers?.["X-Forwarded-Proto"] ??
    "https";
  if (host) return `${proto}://${host}/.netlify/identity/user`;
  // As a last resort, no reasonable target — reject.
  return "";
}

export async function verifyAdmin(event: HandlerEvent): Promise<AdminCheckResult> {
  const token = bearerFrom(event);
  if (!token) {
    return {
      ok: false,
      status: 401,
      reason: "Missing Authorization Bearer token",
    };
  }

  const identityURL = identityURLFrom(event);
  if (!identityURL) {
    return {
      ok: false,
      status: 500,
      reason: "Could not determine Identity URL for this deploy",
    };
  }

  let res: Response;
  try {
    res = await fetch(identityURL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      reason: `Identity verification network error: ${(err as Error).message}`,
    };
  }

  if (res.status === 401 || res.status === 404) {
    return {
      ok: false,
      status: 401,
      reason: "Netlify Identity rejected the token (expired or invalid)",
      seen: { identityStatus: res.status, identityURL },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      reason: `Identity returned ${res.status}`,
      seen: { identityURL },
    };
  }

  let user: IdentityUser;
  try {
    user = (await res.json()) as IdentityUser;
  } catch (err) {
    return {
      ok: false,
      status: 502,
      reason: `Could not parse Identity response: ${(err as Error).message}`,
    };
  }

  const roles = user.app_metadata?.roles ?? [];
  if (!roles.includes("admin")) {
    return {
      ok: false,
      status: 403,
      reason: "User has no 'admin' role in app_metadata.roles",
      seen: { email: user.email, roles, app_metadata: user.app_metadata },
    };
  }

  return { ok: true, user };
}
