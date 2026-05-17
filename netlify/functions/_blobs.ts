import { connectLambda, getStore } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";

/**
 * Wires Netlify Blobs into a classic v1 Lambda-style Netlify Function.
 *
 * The Netlify runtime injects the Blobs site+token context into the lambda
 * event's clientContext (not the process env, despite what most docs claim
 * for esbuild-bundled functions). connectLambda(event) extracts it so the
 * subsequent getStore() call works without arguments. Call this once per
 * handler invocation, before any getStore() call.
 */
export function bindBlobs(event: HandlerEvent) {
  try {
    // The HandlerEvent type doesn't declare the `blobs` field, but the
    // Netlify runtime adds it on the wire. connectLambda reads it from there.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectLambda(event as any);
  } catch {
    /* no-op if context isn't there (local dev) */
  }
}

export function store(name: string, consistency: "strong" | "eventual" = "eventual") {
  return getStore({ name, consistency });
}
