import { describe, expect, it } from "vitest";
import { pickRank } from "./pickRank";

// 재현 가능한 난수 (mulberry32)
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const initial = [
  { rank: 1, stock: 7 },
  { rank: 2, stock: 21 },
  { rank: 3, stock: 35 },
  { rank: 4, stock: 35 },
  { rank: 5, stock: 35 },
];

describe("pickRank", () => {
  it("모든 재고가 0이면 null", () => {
    const empty = initial.map((p) => ({ ...p, stock: 0 }));
    expect(pickRank(empty, 0.5)).toBeNull();
  });

  it("목록이 비어 있으면 null", () => {
    expect(pickRank([], 0.5)).toBeNull();
  });

  it("재고 0인 등수는 어떤 rand에서도 나오지 않는다", () => {
    const prizes = [
      { rank: 1, stock: 0 },
      { rank: 2, stock: 3 },
      { rank: 3, stock: 0 },
      { rank: 4, stock: 1 },
      { rank: 5, stock: 0 },
    ];
    for (let i = 0; i < 1000; i++) {
      const rank = pickRank(prizes, i / 1000);
      expect([2, 4]).toContain(rank);
    }
  });

  it("rand 경계값은 재고가 있는 첫 등수와 마지막 등수로 간다", () => {
    const prizes = [
      { rank: 1, stock: 0 },
      { rank: 2, stock: 5 },
      { rank: 3, stock: 5 },
      { rank: 4, stock: 0 },
    ];
    expect(pickRank(prizes, 0)).toBe(2);
    expect(pickRank(prizes, 0.9999999)).toBe(3);
  });

  it("입력 순서와 상관없이 등수 순으로 구간을 나눈다", () => {
    const shuffled = [
      { rank: 3, stock: 1 },
      { rank: 1, stock: 1 },
    ];
    expect(pickRank(shuffled, 0)).toBe(1);
    expect(pickRank(shuffled, 0.75)).toBe(3);
  });

  it("10만 번 뽑으면 비율이 재고 비율과 ±1% 안에서 맞는다", () => {
    const rand = seeded(20261007);
    const total = initial.reduce((s, p) => s + p.stock, 0);
    const counts = new Map<number, number>();
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      const rank = pickRank(initial, rand())!;
      counts.set(rank, (counts.get(rank) ?? 0) + 1);
    }
    for (const p of initial) {
      expect(Math.abs((counts.get(p.rank) ?? 0) / N - p.stock / total)).toBeLessThan(0.01);
    }
  });
});
