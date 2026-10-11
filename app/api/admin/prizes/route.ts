import { isAdminPassword, parsePrizeUpdate, parseTeam } from "@/lib/admin";
import { getStore } from "@/lib/store";

// 비밀번호는 한글도 쓸 수 있게 클라이언트에서 encodeURIComponent 해서 보낸다
function authorized(request: Request): boolean {
  const raw = request.headers.get("x-admin-password");
  let given: string | null = null;
  try {
    given = raw === null ? null : decodeURIComponent(raw);
  } catch {
    given = null;
  }
  return isAdminPassword(given, process.env.ADMIN_PASSWORD);
}

const unauthorized = () => Response.json({ error: "비밀번호가 맞지 않아요" }, { status: 401 });

export async function GET(request: Request) {
  if (!authorized(request)) return unauthorized();
  try {
    return Response.json(await getStore().listAll());
  } catch (err) {
    console.error("[admin:get]", err);
    return Response.json({ error: "재고를 불러오지 못했어요" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!authorized(request)) return unauthorized();
  // 본문: { team: 1~7, prizes: [...] } — 상품명은 모든 팀, 수량은 그 팀만 바뀐다
  const body = await request.json().catch(() => null);
  const team = parseTeam(body?.team);
  if (team === null) return Response.json({ error: "팀 번호가 올바르지 않아요" }, { status: 400 });
  const parsed = parsePrizeUpdate(body?.prizes);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  try {
    return Response.json(await getStore().update(team, parsed.prizes));
  } catch (err) {
    console.error("[admin:put]", err);
    return Response.json({ error: "저장하지 못했어요" }, { status: 500 });
  }
}
