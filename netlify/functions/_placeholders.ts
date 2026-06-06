/**
 * Placeholder players for the weekly leaderboard.
 * Shown only when there are fewer than `limit` real players this week.
 * Easy to beat (max 200 pts) so a single decent game puts a real kid on the
 * podium. Names rotate every ISO week so a solo player feels like the league
 * is moving even if nobody else joined.
 */

const POOL = [
  "NinjaPanda7",
  "PixelTiger",
  "BlazeRider99",
  "GalaxyOwl",
  "MintWizard",
  "MapleKnight42",
  "CrystalDragon",
  "ThunderJay",
  "CyberBunny",
  "SunSamurai",
  "RocketRaccoon",
  "StarPilot8",
  "ShadowFox",
  "NeonTurtle",
  "QuestMaster",
  "BraveLemon",
  "JadeFalcon",
  "SugarBlitz",
  "CometKid",
  "EpicMango",
  "MoonRanger3",
  "SilverFin",
  "RoyalLynx",
  "JellyKnight",
  "BananaBoss",
  "DonutNinja",
  "BlueberryBolt",
  "PixelPirate",
  "SkyDolphin",
  "MysticOtter",
];

// Points assigned to placeholder positions 1, 2, 3.
// Tuned so that ~one decent game beats #3, and a strong game beats #1.
const POINTS_BY_RANK = [200, 100, 30];

/**
 * Deterministically picks `n` names from POOL based on the ISO week key
 * (e.g. "2026-W21"). Same week → same names. Next week → different names.
 */
export function pickPlaceholderNames(weekKey: string, n: number): string[] {
  // FNV-ish hash so we don't need Math.random and stay deterministic.
  let h = 0x811c9dc5;
  for (let i = 0; i < weekKey.length; i++) {
    h ^= weekKey.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }

  // Linear-congruential PRNG seeded from the hash, used to shuffle a copy.
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  const copy = [...POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export interface PlaceholderEntry {
  userId: string;
  displayName: string;
  points: number;
  placeholder: true;
}

/**
 * Returns up to `count` placeholder entries (rank 1..count) for the given
 * week. Caller picks how many to use based on how many real-player slots
 * are still empty.
 */
export function buildPlaceholders(weekKey: string, count: number): PlaceholderEntry[] {
  const names = pickPlaceholderNames(weekKey, count);
  return names.map((displayName, i) => ({
    userId: `placeholder:${weekKey}:${i}`,
    displayName,
    points: POINTS_BY_RANK[i] ?? 10,
    placeholder: true,
  }));
}
