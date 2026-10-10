import { isAdminPassword, parsePrizeUpdate } from "@/lib/admin";
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
    return Response.json(await getStore().list());
  } catch (err) {
    console.error("[admin:get]", err);
    return Response.json({ error: "재고를 불러오지 못했어요" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!authorized(request)) return unauthorized();
  const parsed = parsePrizeUpdate(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  try {
    return Response.json(await getStore().update(parsed.prizes));
  } catch (err) {
    console.error("[admin:put]", err);
    return Response.json({ error: "저장하지 못했어요" }, { status: 500 });
  }
}
