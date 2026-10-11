import { parseTeam } from "@/lib/admin";
import { drawPrize } from "@/lib/draw";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const team = parseTeam(body?.team);
  if (team === null) return Response.json({ error: "팀을 먼저 골라주세요" }, { status: 400 });
  try {
    return Response.json(await drawPrize(getStore(), team));
  } catch (err) {
    console.error("[draw]", err);
    return Response.json({ error: "뽑기에 실패했어요" }, { status: 500 });
  }
}
