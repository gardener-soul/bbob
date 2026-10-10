import type { Prize, PrizeStore } from "./types";

/** Supabase 없이 로컬에서 돌려볼 때와 테스트에서 쓰는 저장소 */
export function createMemoryStore(initial: Prize[]): PrizeStore {
  const rows = new Map(initial.map((p) => [p.rank, { ...p }]));
  const snapshot = () =>
    [...rows.values()].sort((a, b) => a.rank - b.rank).map((p) => ({ ...p }));

  return {
    async list() {
      return snapshot();
    },
    async take(rank) {
      const row = rows.get(rank);
      if (!row || row.stock <= 0) return false;
      row.stock -= 1;
      return true;
    },
    async update(prizes) {
      for (const p of prizes) rows.set(p.rank, { ...p });
      return snapshot();
    },
  };
}
