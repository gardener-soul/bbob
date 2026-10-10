export type RankStock = { rank: number; stock: number };

/**
 * 남은 재고에 비례해 등수를 고른다(뽑기통 방식).
 * rand는 [0, 1) 값. 재고가 하나도 없으면 null.
 */
export function pickRank(prizes: RankStock[], rand: number): number | null {
  const candidates = prizes
    .filter((p) => p.stock > 0)
    .sort((a, b) => a.rank - b.rank);
  const total = candidates.reduce((sum, p) => sum + p.stock, 0);
  if (total === 0) return null;

  const target = rand * total;
  let cumulative = 0;
  for (const p of candidates) {
    cumulative += p.stock;
    if (target < cumulative) return p.rank;
  }
  return candidates[candidates.length - 1].rank;
}
