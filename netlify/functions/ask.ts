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

function isBlocked(q: string): boolean {
  const lower = q.toLowerCase();
  return BLOCKED.some((b) => lower.includes(b));
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

async function searchWikipedia(query: string): Promise<WikiSummary | null> {
  const distilled = distillQuery(query);
  // Try the distilled query first, fall back to the raw query if no hits.
  for (const q of [distilled, query]) {
    const searchURL = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      q
    )}&format=json&srlimit=5`;
    const searchRes = await fetch(searchURL, { headers: WIKI_HEADERS });
    if (!searchRes.ok) continue;
    const searchData = (await searchRes.json()) as {
      query?: { search?: Array<{ title: string }> };
    };
    const hits = searchData.query?.search ?? [];
    for (const hit of hits) {
      const summary = await fetchSummary(hit.title);
      if (summary && summary.extract.length > 60) return summary;
    }
  }
  return null;
}

const SYSTEM_PROMPT = `You are LookUp!, a kind homework helper for kids aged 7-12.
Rules you must follow without exception:
- Answer ONLY from the Wikipedia excerpt provided. If the excerpt does not contain the answer, say "I couldn't find that in Wikipedia. Try asking it a different way!"
- Use 2 to 4 short sentences. Plain words a 10-year-old understands. No jargon.
- Never invent facts. Never quote sources other than the provided Wikipedia excerpt.
- Don't give direct homework answers like a finished essay. Explain the idea and encourage them to write it in their own words.
- If the topic is not appropriate for kids, refuse warmly and suggest a different topic.
- Friendly, curious tone. No emojis in the answer itself (the UI adds those).`;

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
  try {
    const completion = await client.messages.create({
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
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", reason: (err as Error).message }),
    };
  }
};
