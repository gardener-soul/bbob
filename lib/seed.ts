import { TEAMS, type Seed } from "./types";

const NAMES = ["기프트카드 1만원권", "말랑이 or 그립톡", "볼펜", "파우치", "키링"];
/** 팀당 등수별 수량 — 전체 상품을 7팀에 똑같이 나눴다(1등 7 · 2등 28 · 3~5등 35) */
const PER_TEAM = [1, 4, 5, 5, 5];

/** 초기 상품 — supabase/schema.sql 의 insert 와 같은 값 */
export const SEED: Seed = {
  names: NAMES.map((name, i) => ({ rank: i + 1, name })),
  stock: TEAMS.flatMap((team) =>
    PER_TEAM.map((q, i) => ({ team, rank: i + 1, stock: q, initialStock: q })),
  ),
};
