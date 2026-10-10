import { describe, expect, it } from "vitest";
import { drawPrize } from "./draw";
import { createMemoryStore } from "./memoryStore";
import type { Prize, PrizeStore } from "./types";

const seed: Prize[] = [
  { rank: 1, name: "기프트카드 1만원권", stock: 7, initialStock: 7 },
  { rank: 2, name: "말랑이 or 그립톡", stock: 21, initialStock: 21 },
  { rank: 3, name: "물병", stock: 35, initialStock: 35 },
  { rank: 4, name: "파우치", stock: 35, initialStock: 35 },
  { rank: 5, name: "키링", stock: 35, initialStock: 35 },
];

describe("drawPrize", () => {
  it("뽑힌 등수와 상품명을 돌려주고 그 등수 재고를 1 줄인다", async () => {
    const store = createMemoryStore(seed);
    const result = await drawPrize(store, () => 0); // rand 0 → 1등

    expect(result).toEqual({ rank: 1, name: "기프트카드 1만원권" });
    const after = await store.list();
    expect(after.find((p) => p.rank === 1)!.stock).toBe(6);
    expect(after.find((p) => p.rank === 2)!.stock).toBe(21);
  });

  it("재고가 전부 0이면 soldOut", async () => {
    const store = createMemoryStore(seed.map((p) => ({ ...p, stock: 0 })));
    expect(await drawPrize(store, () => 0.5)).toEqual({ soldOut: true });
  });

  it("고른 등수를 다른 폰이 먼저 가져가면 재고를 다시 읽고 다시 고른다", async () => {
    const inner = createMemoryStore([
      { rank: 1, name: "기프트카드 1만원권", stock: 1, initialStock: 1 },
      { rank: 5, name: "키링", stock: 1, initialStock: 1 },
    ]);
    let raced = false;
    const racing: PrizeStore = {
      ...inner,
      async take(rank) {
        if (!raced) {
          raced = true;
          await inner.take(rank); // 다른 폰이 같은 등수를 먼저 가져감
        }
        return inner.take(rank);
      },
    };

    const result = await drawPrize(racing, () => 0); // 처음엔 1등을 고름

    expect(result).toEqual({ rank: 5, name: "키링" });
    expect((await inner.list()).every((p) => p.stock === 0)).toBe(true);
  });

  it("3번 연속 차감에 실패하면 에러를 던진다", async () => {
    const inner = createMemoryStore(seed);
    let attempts = 0;
    const alwaysLoses: PrizeStore = {
      ...inner,
      async take() {
        attempts++;
        return false;
      },
    };

    await expect(drawPrize(alwaysLoses, () => 0.5)).rejects.toThrow();
    expect(attempts).toBe(3);
  });

  it("133번 뽑으면 재고가 정확히 바닥나고 134번째는 soldOut", async () => {
    const store = createMemoryStore(seed);
    const counts = new Map<number, number>();
    for (let i = 0; i < 133; i++) {
      const r = await drawPrize(store, Math.random);
      if ("soldOut" in r) throw new Error(`${i}번째에 soldOut`);
      counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1);
    }
    for (const p of seed) expect(counts.get(p.rank)).toBe(p.initialStock);
    expect(await drawPrize(store, Math.random)).toEqual({ soldOut: true });
  });
});

describe("createMemoryStore", () => {
  it("take는 재고가 있을 때만 1 줄이고 0 아래로 내려가지 않는다", async () => {
    const store = createMemoryStore([{ rank: 1, name: "a", stock: 1, initialStock: 1 }]);
    expect(await store.take(1)).toBe(true);
    expect(await store.take(1)).toBe(false);
    expect((await store.list())[0].stock).toBe(0);
  });

  it("list 결과를 바꿔도 저장소에는 영향이 없다", async () => {
    const store = createMemoryStore(seed);
    const list = await store.list();
    list[0].stock = 999;
    expect((await store.list())[0].stock).toBe(7);
  });

  it("update는 상품명과 수량을 덮어쓰고 등수 순으로 돌려준다", async () => {
    const store = createMemoryStore(seed);
    const updated = await store.update([
      { rank: 2, name: "그립톡", stock: 10, initialStock: 21 },
    ]);
    expect(updated.find((p) => p.rank === 2)).toEqual({
      rank: 2, name: "그립톡", stock: 10, initialStock: 21,
    });
    expect(updated.map((p) => p.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});
