import type { Handler } from "@netlify/functions";

/**
 * Temporary diagnostic endpoint: reports which Netlify-injected env vars
 * exist in this function's runtime so we can figure out how to configure
 * Blobs explicitly. SAFE: returns boolean existence + length only, never
 * the actual values.
 */
export const handler: Handler = async () => {
  const interesting = [
    "NETLIFY",
    "NETLIFY_BLOBS_CONTEXT",
    "BLOBS_CONTEXT",
    "NETLIFY_SITE_ID",
    "SITE_ID",
    "DEPLOY_ID",
    "URL",
    "DEPLOY_URL",
    "CONTEXT",
    "BRANCH",
    "AWS_LAMBDA_FUNCTION_NAME",
    "AWS_REGION",
    "NODE_VERSION",
  ];

  const report: Record<string, { present: boolean; length?: number }> = {};
  for (const key of interesting) {
    const v = process.env[key];
    report[key] = v == null
      ? { present: false }
      : { present: true, length: v.length };
  }

  // List ALL env var keys (no values) to surface anything we missed.
  const allKeys = Object.keys(process.env).filter(
    (k) =>
      !/SECRET|TOKEN|KEY|PASSWORD|PRIVATE/i.test(k) ||
      ["NETLIFY_BLOBS_CONTEXT", "BLOBS_CONTEXT"].includes(k)
  );

  // Also peek at globalThis.Netlify if it exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  const netlifyGlobal = g.Netlify
    ? {
        present: true,
        hasContext: !!g.Netlify.context,
        contextKeys: g.Netlify.context ? Object.keys(g.Netlify.context) : [],
      }
    : { present: false };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interesting: report, allKeys, netlifyGlobal }, null, 2),
  };
};
