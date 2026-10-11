import { createHash, timingSafeEqual } from "node:crypto";
import { TEAM_COUNT, type Prize } from "./types";

type ParseResult = { ok: true; prizes: Prize[] } | { ok: false; error: string };

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

/** /admin 저장 요청 본문 검증 */
export function parsePrizeUpdate(input: unknown): ParseResult {
  if (!Array.isArray(input)) return { ok: false, error: "목록 형식이 아닙니다" };

  const prizes: Prize[] = [];
  const seen = new Set<number>();
  for (const item of input) {
    const { rank, name, stock, initialStock } = (item ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(rank) || (rank as number) < 1 || (rank as number) > 5) {
      return { ok: false, error: "등수는 1~5여야 합니다" };
    }
    if (seen.has(rank as number)) return { ok: false, error: `${rank}등이 중복됐습니다` };
    seen.add(rank as number);
    if (typeof name !== "string" || name.trim() === "") {
      return { ok: false, error: `${rank}등 상품명을 입력해주세요` };
    }
    if (!isCount(stock) || !isCount(initialStock)) {
      return { ok: false, error: `${rank}등 수량은 0 이상의 정수여야 합니다` };
    }
    prizes.push({ rank: rank as number, name: name.trim(), stock, initialStock });
  }
  return { ok: true, prizes };
}

/** 1~7팀이면 그 번호, 아니면 null */
export function parseTeam(input: unknown): number | null {
  return Number.isInteger(input) && (input as number) >= 1 && (input as number) <= TEAM_COUNT
    ? (input as number)
    : null;
}

const digest = (s: string) => createHash("sha256").update(s).digest();

/** 서버에 비밀번호가 없으면 항상 거부한다 */
export function isAdminPassword(given: string | null, expected: string | undefined): boolean {
  if (!expected || given === null) return false;
  return timingSafeEqual(digest(given), digest(expected));
}
