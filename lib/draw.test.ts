import { describe, expect, it } from "vitest";
import { drawPrize } from "./draw";
import { createMemoryStore } from "./memoryStore";
import { SEED } from "./seed";
import type { PrizeStore, Seed } from "./types";

const NAMES = [
  { rank: 1, name: "기프트카드 1만원권" },
  { rank: 5, name: "키링" },
];

/** teams: { 팀번호: [1등 재고, 5등 재고] } */
function seedOf(teams: Record<number, [number, number]>): Seed {
  return {
    names: NAMES,
    stock: Object.entries(teams).flatMap(([team, [r1, r5]]) => [
      { team: Number(team), rank: 1, stock: r1, initialStock: r1 },
      { team: Number(team), rank: 5, stock: r5, initialStock: r5 },
    ]),
  };
}

const stockOf = async (store: PrizeStore, team: number, rank: number) =>
  (await store.list(team)).find((p) => p.rank === rank)!.stock;

describe("drawPrize", () => {
  it("고른 팀의 재고에서 뽑고 그 팀 재고만 1 줄인다", async () => {
    const store = createMemoryStore(seedOf({ 1: [1, 5], 2: [1, 5] }));
    const result = await drawPrize(store, 1, () => 0); // rand 0 → 1등

    expect(result).toEqual({ rank: 1, name: "기프트카드 1만원권" });
    expect(await stockOf(store, 1, 1)).toBe(0);
    expect(await stockOf(store, 2, 1)).toBe(1);
  });

  it("다른 팀에 재고가 남아 있어도 고른 팀이 바닥나면 soldOut", async () => {
    const store = createMemoryStore(seedOf({ 1: [0, 0], 2: [1, 5] }));
    expect(await drawPrize(store, 1, () => 0.5)).toEqual({ soldOut: true });
  });

  it("고른 등수를 같은 팀의 다른 기기가 먼저 가져가면 다시 읽고 다시 고른다", async () => {
    const inner = createMemoryStore(seedOf({ 3: [1, 1] }));
    let raced = false;
    const racing: PrizeStore = {
      ...inner,
      async take(team, rank) {
        if (!raced) {
          raced = true;
          await inner.take(team, rank); // 같은 팀 다른 iPad가 먼저 가져감
        }
        return inner.take(team, rank);
      },
    };

    const result = await drawPrize(racing, 3, () => 0); // 처음엔 1등을 고름

    expect(result).toEqual({ rank: 5, name: "키링" });
    expect((await inner.list(3)).every((p) => p.stock === 0)).toBe(true);
  });

  it("3번 연속 차감에 실패하면 에러를 던진다", async () => {
    const inner = createMemoryStore(seedOf({ 1: [1, 5] }));
    let attempts = 0;
    const alwaysLoses: PrizeStore = {
      ...inner,
      async take() {
        attempts++;
        return false;
      },
    };

    await expect(drawPrize(alwaysLoses, 1, () => 0.5)).rejects.toThrow();
    expect(attempts).toBe(3);
  });

  it("한 팀이 20번 뽑으면 그 팀 재고만 정확히 바닥나고 다른 팀은 그대로다", async () => {
    const store = createMemoryStore(SEED);
    const counts = new Map<number, number>();
    for (let i = 0; i < 20; i++) {
      const r = await drawPrize(store, 4, Math.random);
      if ("soldOut" in r) throw new Error(`${i}번째에 soldOut`);
      counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1);
    }
    expect([...counts.entries()].sort()).toEqual([[1, 1], [2, 4], [3, 5], [4, 5], [5, 5]]);
    expect(await drawPrize(store, 4, Math.random)).toEqual({ soldOut: true });

    const others = (await store.listAll()).filter((b) => b.team !== 4);
    for (const b of others) expect(b.prizes.reduce((s, p) => s + p.stock, 0)).toBe(20);
  });
});

describe("SEED", () => {
  it("7팀 × (1등 1 · 2등 4 · 3~5등 5) = 140개", () => {
    const teams = new Set(SEED.stock.map((s) => s.team));
    expect([...teams].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const team of teams) {
      const q = SEED.stock.filter((s) => s.team === team).sort((a, b) => a.rank - b.rank).map((s) => s.stock);
      expect(q).toEqual([1, 4, 5, 5, 5]);
    }
    expect(SEED.stock.reduce((s, x) => s + x.stock, 0)).toBe(140);
    expect(SEED.names.map((n) => n.name)).toEqual(["기프트카드 1만원권", "말랑이 or 그립톡", "볼펜", "파우치", "키링"]);
  });
});

describe("createMemoryStore", () => {
  it("take는 그 팀 재고가 있을 때만 1 줄이고 0 아래로 내려가지 않는다", async () => {
    const store = createMemoryStore(seedOf({ 1: [1, 0], 2: [1, 0] }));
    expect(await store.take(1, 1)).toBe(true);
    expect(await store.take(1, 1)).toBe(false);
    expect(await stockOf(store, 1, 1)).toBe(0);
    expect(await stockOf(store, 2, 1)).toBe(1);
  });

  it("없는 팀·등수는 take가 false", async () => {
    const store = createMemoryStore(seedOf({ 1: [1, 1] }));
    expect(await store.take(9, 1)).toBe(false);
    expect(await store.take(1, 3)).toBe(false);
  });

  it("list 결과를 바꿔도 저장소에는 영향이 없다", async () => {
    const store = createMemoryStore(SEED);
    const list = await store.list(1);
    list[0].stock = 999;
    expect(await stockOf(store, 1, 1)).toBe(1);
  });

  it("update는 상품명을 모든 팀에 반영하고 수량은 그 팀만 바꾼다", async () => {
    const store = createMemoryStore(SEED);
    const boards = await store.update(2, [{ rank: 3, name: "볼펜(검정)", stock: 2, initialStock: 5 }]);

    const team2 = boards.find((b) => b.team === 2)!.prizes.find((p) => p.rank === 3);
    const team5 = boards.find((b) => b.team === 5)!.prizes.find((p) => p.rank === 3);
    expect(team2).toEqual({ rank: 3, name: "볼펜(검정)", stock: 2, initialStock: 5 });
    expect(team5).toEqual({ rank: 3, name: "볼펜(검정)", stock: 5, initialStock: 5 });
    expect(boards.map((b) => b.team)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
