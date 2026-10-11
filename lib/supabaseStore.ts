import { createClient } from "@supabase/supabase-js";
import { TEAMS, type Prize, type PrizeStore, type TeamBoard } from "./types";

type NameRow = { rank: number; name: string };
type StockRow = { team: number; rank: number; stock: number; initial_stock: number };

/** 서버 전용. service role(secret) 키를 쓰므로 브라우저 코드에서 import 하지 말 것 */
export function createSupabaseStore(url: string, serviceKey: string): PrizeStore {
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function names(): Promise<Map<number, string>> {
    const { data, error } = await db.from("prizes").select("rank, name");
    if (error) throw error;
    return new Map((data as NameRow[]).map((r) => [r.rank, r.name]));
  }

  async function stocks(team?: number): Promise<StockRow[]> {
    let q = db.from("team_stock").select("team, rank, stock, initial_stock").order("team").order("rank");
    if (team !== undefined) q = q.eq("team", team);
    const { data, error } = await q;
    if (error) throw error;
    return data as StockRow[];
  }

  const toPrize = (s: StockRow, n: Map<number, string>): Prize => ({
    rank: s.rank,
    name: n.get(s.rank) ?? "",
    stock: s.stock,
    initialStock: s.initial_stock,
  });

  async function listAll(): Promise<TeamBoard[]> {
    const [n, s] = await Promise.all([names(), stocks()]);
    return TEAMS.map((team) => ({
      team,
      prizes: s.filter((r) => r.team === team).map((r) => toPrize(r, n)),
    }));
  }

  return {
    async list(team) {
      const [n, s] = await Promise.all([names(), stocks(team)]);
      return s.map((r) => toPrize(r, n));
    },
    async take(team, rank) {
      const { data, error } = await db.rpc("take_prize", { p_team: team, p_rank: rank });
      if (error) throw error;
      return data === true;
    },
    listAll,
    async update(team, prizes) {
      const nameRows: NameRow[] = prizes.map((p) => ({ rank: p.rank, name: p.name }));
      const stockRows: StockRow[] = prizes.map((p) => ({
        team,
        rank: p.rank,
        stock: p.stock,
        initial_stock: p.initialStock,
      }));
      const { error: nameError } = await db.from("prizes").upsert(nameRows, { onConflict: "rank" });
      if (nameError) throw nameError;
      const { error: stockError } = await db.from("team_stock").upsert(stockRows, { onConflict: "team,rank" });
      if (stockError) throw stockError;
      return listAll();
    },
  };
}
