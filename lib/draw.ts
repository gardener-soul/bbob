import { pickRank } from "./pickRank";
import type { DrawResult, PrizeStore } from "./types";

const MAX_ATTEMPTS = 3;

/**
 * 재고 비례로 등수를 고르고 차감한다.
 * 고른 사이에 다른 폰이 마지막 재고를 가져가면 다시 읽고 다시 고른다.
 */
export async function drawPrize(
  store: PrizeStore,
  rand: () => number = Math.random,
): Promise<DrawResult> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prizes = await store.list();
    const rank = pickRank(prizes, rand());
    if (rank === null) return { soldOut: true };
    if (await store.take(rank)) {
      return { rank, name: prizes.find((p) => p.rank === rank)!.name };
    }
  }
  throw new Error(`재고 차감이 ${MAX_ATTEMPTS}번 연속 실패했습니다`);
}
