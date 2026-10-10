import { createMemoryStore } from "./memoryStore";
import { SEED_PRIZES } from "./seed";
import { createSupabaseStore } from "./supabaseStore";
import type { PrizeStore } from "./types";

const g = globalThis as typeof globalThis & { __devPrizeStore?: PrizeStore };

/**
 * Supabase 환경변수가 있으면 Supabase, 없으면 개발 모드에서만 메모리 저장소.
 * 프로덕션에서 환경변수가 빠졌으면 조용히 메모리로 돌지 않고 에러를 낸다.
 */
export function getStore(): PrizeStore {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return createSupabaseStore(url, key);
  if (process.env.NODE_ENV !== "production") {
    return (g.__devPrizeStore ??= createMemoryStore(SEED_PRIZES));
  }
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다");
}
