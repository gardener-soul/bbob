import { describe, expect, it } from "vitest";
import { isAdminPassword, parsePrizeUpdate } from "./admin";

const valid = { rank: 1, name: "기프트카드 1만원권", stock: 7, initialStock: 7 };

describe("parsePrizeUpdate", () => {
  it("올바른 입력은 받아들이고 상품명 앞뒤 공백과 다른 필드는 버린다", () => {
    const result = parsePrizeUpdate([{ ...valid, name: "  물병 ", extra: "x" }]);
    expect(result).toEqual({ ok: true, prizes: [{ ...valid, name: "물병" }] });
  });

  it("배열이 아니면 거절", () => {
    expect(parsePrizeUpdate({ ...valid }).ok).toBe(false);
  });

  it.each([0, 6, 1.5, "1"])("rank가 %s이면 거절", (rank) => {
    expect(parsePrizeUpdate([{ ...valid, rank }]).ok).toBe(false);
  });

  it("같은 등수가 두 번 나오면 거절", () => {
    expect(parsePrizeUpdate([valid, { ...valid }]).ok).toBe(false);
  });

  it("상품명이 비었거나 공백뿐이면 거절", () => {
    expect(parsePrizeUpdate([{ ...valid, name: "   " }]).ok).toBe(false);
    expect(parsePrizeUpdate([{ ...valid, name: undefined }]).ok).toBe(false);
  });

  it.each([-1, 2.5, "3", null])("수량이 %s이면 거절", (n) => {
    expect(parsePrizeUpdate([{ ...valid, stock: n }]).ok).toBe(false);
    expect(parsePrizeUpdate([{ ...valid, initialStock: n }]).ok).toBe(false);
  });
});

describe("isAdminPassword", () => {
  it("맞는 비밀번호면 true", () => {
    expect(isAdminPassword("dew-2026", "dew-2026")).toBe(true);
  });

  it("틀리거나 비었으면 false", () => {
    expect(isAdminPassword("wrong", "dew-2026")).toBe(false);
    expect(isAdminPassword(null, "dew-2026")).toBe(false);
  });

  it("서버에 비밀번호가 설정되지 않았으면 무엇을 보내도 false", () => {
    expect(isAdminPassword("", undefined)).toBe(false);
    expect(isAdminPassword("", "")).toBe(false);
    expect(isAdminPassword("anything", undefined)).toBe(false);
  });
});
