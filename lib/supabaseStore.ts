import { createClient } from "@supabase/supabase-js";
import type { Prize, PrizeStore } from "./types";

type Row = { rank: number; name: string; stock: number; initial_stock: number };

const toPrize = (r: Row): Prize => ({
  rank: r.rank,
  name: r.name,
  stock: r.stock,
  initialStock: r.initial_stock,
});

/** 서버 전용. service role(secret) 키를 쓰므로 브라우저 코드에서 import 하지 말 것 */
export function createSupabaseStore(url: string, serviceKey: string): PrizeStore {
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function list(): Promise<Prize[]> {
    const { data, error } = await db
      .from("prizes")
      .select("rank, name, stock, initial_stock")
      .order("rank");
    if (error) throw error;
    return (data as Row[]).map(toPrize);
  }

  return {
    list,
    async take(rank) {
      const { data, error } = await db.rpc("take_prize", { p_rank: rank });
      if (error) throw error;
      return data === true;
    },
    async update(prizes) {
      const rows: Row[] = prizes.map((p) => ({
        rank: p.rank,
        name: p.name,
        stock: p.stock,
        initial_stock: p.initialStock,
      }));
      const { error } = await db.from("prizes").upsert(rows, { onConflict: "rank" });
      if (error) throw error;
      return list();
    },
  };
}
