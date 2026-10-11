import type { Prize, PrizeStore, Seed, TeamBoard } from "./types";

/** Supabase 없이 로컬에서 돌려볼 때와 테스트에서 쓰는 저장소 */
export function createMemoryStore(seed: Seed): PrizeStore {
  const names = new Map(seed.names.map((n) => [n.rank, n.name]));
  const stock = new Map(seed.stock.map((s) => [`${s.team}:${s.rank}`, { ...s }]));

  const list = (team: number): Prize[] =>
    [...stock.values()]
      .filter((s) => s.team === team)
      .sort((a, b) => a.rank - b.rank)
      .map((s) => ({ rank: s.rank, name: names.get(s.rank) ?? "", stock: s.stock, initialStock: s.initialStock }));
  const listAll = (): TeamBoard[] =>
    [...new Set([...stock.values()].map((s) => s.team))]
      .sort((a, b) => a - b)
      .map((team) => ({ team, prizes: list(team) }));

  return {
    async list(team) {
      return list(team);
    },
    async take(team, rank) {
      const row = stock.get(`${team}:${rank}`);
      if (!row || row.stock <= 0) return false;
      row.stock -= 1;
      return true;
    },
    async listAll() {
      return listAll();
    },
    async update(team, prizes) {
      for (const p of prizes) {
        names.set(p.rank, p.name);
        stock.set(`${team}:${p.rank}`, { team, rank: p.rank, stock: p.stock, initialStock: p.initialStock });
      }
      return listAll();
    },
  };
}
