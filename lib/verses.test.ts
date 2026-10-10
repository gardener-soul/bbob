import { describe, expect, it } from "vitest";
import { VERSES, pickVerse } from "./verses";

describe("VERSES", () => {
  it("대조를 마친 22구절이 모두 들어 있다", () => {
    expect(VERSES).toHaveLength(22);
  });

  it("참조가 겹치지 않고 본문이 비어 있지 않다", () => {
    expect(new Set(VERSES.map((v) => v.ref)).size).toBe(VERSES.length);
    for (const v of VERSES) expect(v.text.trim().length).toBeGreaterThan(0);
  });

  it("pickVerse는 rand 범위 전체에서 목록 안의 구절을 고른다", () => {
    expect(pickVerse(0)).toBe(VERSES[0]);
    expect(pickVerse(0.9999999)).toBe(VERSES[VERSES.length - 1]);
  });
});
