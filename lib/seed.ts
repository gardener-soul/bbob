import type { Prize } from "./types";

/** 초기 상품 — supabase/schema.sql 의 insert 와 같은 값 */
export const SEED_PRIZES: Prize[] = [
  { rank: 1, name: "기프트카드 1만원권", stock: 7, initialStock: 7 },
  { rank: 2, name: "말랑이 or 그립톡", stock: 21, initialStock: 21 },
  { rank: 3, name: "물병", stock: 35, initialStock: 35 },
  { rank: 4, name: "파우치", stock: 35, initialStock: 35 },
  { rank: 5, name: "키링", stock: 35, initialStock: 35 },
];
