/** Fixed "now" so mock data is identical on server and client renders. */
export const NOW = new Date("2026-11-22T09:00:00+03:00").getTime();
const DAY = 86_400_000;

export function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date(NOW - days * DAY);
  d.setUTCHours(hour - 3, minute, 0, 0);
  return d.toISOString();
}

export function minutesAgo(minutes: number): string {
  return new Date(NOW - minutes * 60_000).toISOString();
}

/** Deterministic PRNG (mulberry32). */
export function createRandom(seed: number) {
  let a = seed;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    weighted: <T>(entries: readonly (readonly [T, number])[]): T => {
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      const last = entries.at(-1);
      if (!last) throw new Error("weighted() needs at least one entry");
      return last[0];
    },
  };
}
