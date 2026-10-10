import { drawPrize } from "@/lib/draw";
import { getStore } from "@/lib/store";

export async function POST() {
  try {
    return Response.json(await drawPrize(getStore()));
  } catch (err) {
    console.error("[draw]", err);
    return Response.json({ error: "뽑기에 실패했어요" }, { status: 500 });
  }
}
