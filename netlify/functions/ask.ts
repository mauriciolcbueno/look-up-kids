import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const BLOCKED = [
  // sexual / explicit
  "sex", "porn", "naked", "nude", "pornograph",
  // self-harm
  "kill myself", "suicide", "hurt myself",
  // violence / weapons how-to
  "how to make a bomb", "how to make a gun", "how to kill",
  // hate / slurs (basic — child product)
  "nazi", "racial slur",
  // drugs how-to
  "how to make meth", "how to make drugs", "cocaine recipe",
];

// Wikipedia article titles that should never reach the AI even if the
// search lands on them. Matched as a case-insensitive substring against
// the full title — so "Testicle" blocks "Testicle (anatomy)" too.
const BLOCKED_TITLES = [
  // anatomy / sexual topics (kids' search bar mistakes can surface these)
  "testicle", "penis", "vagina", "vulva", "clitoris", "breast",
  "scrotum", "anus", "anal ", "orgasm", "ejaculation", "masturbat",
  "intercourse", "sexual ", "intercourse", "fetish",
  "pregnan", "menstr", "abortion", "contracepti",
  // explicit / violent media
  "pornograph", "prostitut", "rape", "molest",
  // hate / atrocities (kids should learn these via teachers/parents, not AI)
  "holocaust", "genocide", "slavery",
  // drugs / overdose
  "heroin", "cocaine", "methamphetamine", "fentanyl", "overdose", "drug abuse",
  // suicide / self-harm
  "suicide", "self-harm",
];

function isBlocked(q: string): boolean {
  const lower = q.toLowerCase();
  return BLOCKED.some((b) => lower.includes(b));
}

function isBlockedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_TITLES.some((b) => lower.includes(b));
}

// Tiny sleep helper for retry backoff.
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface WikiSummary {
  title: string;
  extract: string;
  url: string;
}

// Wikipedia requires a descriptive User-Agent per their policy or they may
// throttle/reject. https://meta.wikimedia.org/wiki/User-Agent_policy
const WIKI_HEADERS = {
  "User-Agent": "LookUpKids/1.0 (https://lookupkids.netlify.app; school project)",
  Accept: "application/json",
};

// Strip common question words so search ranks topical nouns higher.
// "How does an octopus camouflage?" -> "octopus camouflage"
function distillQuery(q: string): string {
  const stop = new Set([
    "how", "does", "do", "did", "is", "are", "was", "were", "the", "a", "an",
    "what", "who", "when", "where", "why", "which", "can", "could", "would",
    "should", "of", "in", "on", "to", "for", "by", "with", "and", "or", "but",
    "tell", "me", "about", "explain",
  ]);
  const cleaned = q
    .toLowerCase()
    .replace(/[?!.,;:]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w))
    .join(" ")
    .trim();
  return cleaned || q;
}

async function fetchSummary(title: string): Promise<WikiSummary | null> {
  try {
    const summaryURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryURL, { headers: WIKI_HEADERS });
    if (!summaryRes.ok) return null;
    const summary = (await summaryRes.json()) as {
      title: string;
      extract?: string;
      type?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    // Disambiguation pages have no useful extract.
    if (summary.type === "disambiguation" || !summary.extract) return null;
    return {
      title: summary.title,
      extract: summary.extract,
      url:
        summary.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

async function openSearch(query: string): Promise<string[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      query
    )}&limit=5&namespace=0&format=json`;
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[], string[], string[]];
    return data[1] ?? [];
  } catch {
    return [];
  }
}

async function fullTextSearch(query: string): Promise<string[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&srlimit=5`;
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { search?: Array<{ title: string }> };
    };
    return (data.query?.search ?? []).map((h) => h.title);
  } catch {
    return [];
  }
}

/**
 * Score how likely a Wikipedia title is to be a clean, canonical topic article
 * (vs a list, book, year, question-titled stub, etc).
 * Higher = better.
 */
function scoreTitle(title: string): number {
  let score = 100;
  if (/^List of\b/i.test(title)) score -= 70;
  if (/\?$/.test(title)) score -= 60; // "Who Built the Pyramids?" (book)
  if (/^\d{3,4}\b/.test(title)) score -= 40; // year-led specific events
  if (/\b\d{4}\b/.test(title)) score -= 15; // year anywhere
  if (/\(.+\)$/.test(title)) score -= 15; // disambiguating parens
  if (/^Index of\b|^Outline of\b|^Timeline of\b/i.test(title)) score -= 60;
  if (/^The\s/i.test(title)) score -= 5;
  // Prefer concise titles — long titles are usually specific subtopics
  const words = title.split(/\s+/).length;
  score -= Math.max(0, words - 2) * 6;
  return score;
}

async function searchWikipedia(query: string): Promise<WikiSummary | null | "blocked"> {
  const distilled = distillQuery(query);

  const pools = await Promise.all([
    openSearch(distilled),
    distilled !== query ? openSearch(query) : Promise.resolve<string[]>([]),
    fullTextSearch(distilled),
    distilled !== query ? fullTextSearch(query) : Promise.resolve<string[]>([]),
  ]);

  // Collect unique candidates with a base score from their pool rank.
  const candidates = new Map<string, number>();
  pools.forEach((pool, poolIdx) => {
    // opensearch (poolIdx 0,1) gets a small bump as it tends toward canonical titles
    const poolBonus = poolIdx < 2 ? 8 : 0;
    pool.forEach((title, rank) => {
      const rankBonus = Math.max(0, 5 - rank) * 2; // top of pool > bottom
      const score = scoreTitle(title) + poolBonus + rankBonus;
      const prev = candidates.get(title);
      if (prev === undefined || score > prev) candidates.set(title, score);
    });
  });

  const ranked = [...candidates.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([title]) => title);

  // If the FIRST candidate is a blocked topic, the user almost certainly
  // typed something inappropriate (or so vague Wikipedia surfaced something
  // inappropriate). Refuse the whole request rather than silently moving on
  // to a different article that might also be questionable.
  if (ranked[0] && isBlockedTitle(ranked[0])) return "blocked";

  for (const title of ranked) {
    if (isBlockedTitle(title)) continue;
    const summary = await fetchSummary(title);
    if (summary && summary.extract.length > 60) return summary;
  }
  return null;
}

const SYSTEM_PROMPT = `You are LookUp!, a kind homework helper for kids aged 7-12.

You will be given a Wikipedia excerpt and a question. Follow these rules WITHOUT EXCEPTION:

1) If the Wikipedia excerpt CONTAINS information that answers the question, answer using ONLY that information. 2 to 4 short sentences. Plain words a 10-year-old understands. No jargon.

2) If the excerpt is about something different from the question (e.g. question is about why volcanoes erupt but excerpt is about a list of specific volcanoes), you MUST respond with EXACTLY this single sentence and NOTHING ELSE:
"I couldn't find that in Wikipedia. Try asking it a different way!"
Do NOT explain what the excerpt is about. Do NOT mention the word "excerpt", "article", "source", "Wikipedia". Do NOT suggest other search terms. Do NOT apologize. Just that one sentence.

3) Never invent facts. Never break character. Never address yourself or your context — talk only to the kid.

4) Don't write a finished essay or homework answer. Explain the idea and encourage the kid to put it in their own words.

5) If the topic is not appropriate for kids, refuse warmly in one sentence and suggest changing the subject.

6) Friendly, curious tone. No emojis in your answer (the app adds those).`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body: { question?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ status: "error", reason: "Invalid JSON" }) };
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ status: "error", reason: "Empty question" }) };
  }
  // Reject ultra-short queries — they tend to surface random Wikipedia
  // entries that aren't what the kid meant ("test" -> "Testicle", etc).
  if (question.length < 4) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        answer: "Hmm, can you ask me a longer question? Like 'How does an octopus camouflage?'",
      }),
    };
  }
  if (question.length > 300) {
    return { statusCode: 400, body: JSON.stringify({ status: "error", reason: "Question too long" }) };
  }

  if (isBlocked(question)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "blocked",
        reason: "blocklist",
      }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", reason: "Server is missing ANTHROPIC_API_KEY" }),
    };
  }

  const wiki = await searchWikipedia(question);
  if (wiki === "blocked") {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "blocked", reason: "topic" }),
    };
  }
  if (!wiki || !wiki.extract) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        answer: "I couldn't find that in Wikipedia. Try asking it a different way!",
      }),
    };
  }

  const client = new Anthropic({ apiKey });
  // Retry on transient Anthropic overloads (529) and rate limits (429).
  // Backoff: 500ms, then 1500ms.
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [500, 1500];
  let completion;
  try {
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        completion = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 220,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Wikipedia article: "${wiki.title}"\n\nWikipedia excerpt:\n${wiki.extract}\n\nKid's question: ${question}`,
            },
          ],
        });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number }).status;
        const transient = status === 429 || status === 529 || (status !== undefined && status >= 500);
        if (!transient || attempt === MAX_ATTEMPTS) throw err;
        await delay(BACKOFF_MS[attempt - 1] ?? 1500);
      }
    }
    if (!completion) throw lastErr ?? new Error("no completion");

    const text = completion.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        answer: text || "Hmm, I couldn't find a good answer. Try asking it a different way!",
        source: { title: wiki.title, url: wiki.url },
      }),
    };
  } catch (err) {
    const status = (err as { status?: number }).status;
    const isOverload = status === 429 || status === 529;
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        answer: isOverload
          ? "I'm a little busy right now! Try asking again in a few seconds."
          : "Something went wrong on my side. Try asking it a different way!",
      }),
    };
  }
};
