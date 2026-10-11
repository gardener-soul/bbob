"use client";

import { useEffect, useState, type FormEvent } from "react";
import { TEAMS, type Prize, type TeamBoard } from "@/lib/types";
import styles from "./admin.module.css";

const PW_KEY = "saebyeok-admin-pw";

type Message = { kind: "ok" | "error"; text: string } | null;

function readSavedPassword(): string | null {
  try {
    return sessionStorage.getItem(PW_KEY);
  } catch {
    return null;
  }
}

function savePassword(pw: string | null) {
  try {
    if (pw === null) sessionStorage.removeItem(PW_KEY);
    else sessionStorage.setItem(PW_KEY, pw);
  } catch {
    // 시크릿 창 등에서 저장이 막혀도 이번 화면에서는 계속 쓸 수 있다
  }
}

const isCount = (n: number) => Number.isInteger(n) && n >= 0;

class AdminError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// 비밀번호는 한글도 쓸 수 있게 인코딩해서 헤더로 보낸다
async function callAdmin(pw: string, init?: RequestInit): Promise<TeamBoard[]> {
  const res = await fetch("/api/admin/prizes", {
    ...init,
    headers: { "content-type": "application/json", "x-admin-password": encodeURIComponent(pw) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(data.error ?? "요청에 실패했어요", res.status);
  return data as TeamBoard[];
}

const sum = (prizes: Prize[], key: "stock" | "initialStock") =>
  prizes.reduce((s, p) => s + (isCount(p[key]) ? p[key] : 0), 0);

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [boards, setBoards] = useState<TeamBoard[] | null>(null);
  const [team, setTeam] = useState(1);
  // 저장 안 한 팀 — 팀을 오가며 고친 것도 저장 한 번에 모두 보낸다
  const [dirty, setDirty] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function fail(err: unknown) {
    if (err instanceof AdminError && err.status === 401) {
      savePassword(null);
      setAuthed(false);
      setBoards(null);
    }
    setMessage({ kind: "error", text: (err as Error).message });
  }

  async function load(pw: string) {
    setBusy(true);
    setMessage(null);
    try {
      setBoards(await callAdmin(pw));
      setDirty([]);
      setPassword(pw);
      setAuthed(true);
      savePassword(pw);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // 이번 탭에서 이미 들어온 적이 있으면 바로 불러온다
    const saved = readSavedPassword();
    if (!saved) return;
    let cancelled = false;
    callAdmin(saved)
      .then((data) => {
        if (cancelled) return;
        setBoards(data);
        setPassword(saved);
        setAuthed(true);
      })
      .catch(() => {
        // 저장된 비밀번호가 바뀌었으면 로그인 화면에 그대로 둔다
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!boards) return;
    const targets = boards.filter((b) => dirty.includes(b.team));
    if (targets.length === 0) {
      setMessage({ kind: "ok", text: "바뀐 내용이 없어요" });
      return;
    }
    for (const b of targets) {
      const invalid = b.prizes.find((r) => !r.name.trim() || !isCount(r.stock) || !isCount(r.initialStock));
      if (invalid) {
        setTeam(b.team);
        setMessage({ kind: "error", text: `${b.team}팀 ${invalid.rank}등 입력값을 확인해주세요` });
        return;
      }
    }
    setBusy(true);
    setMessage(null);
    try {
      let latest = boards;
      for (const b of targets) {
        latest = await callAdmin(password, {
          method: "PUT",
          body: JSON.stringify({ team: b.team, prizes: b.prizes }),
        });
      }
      setBoards(latest);
      setDirty([]);
      setMessage({ kind: "ok", text: `${targets.map((b) => `${b.team}팀`).join(", ")} 저장했어요` });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  /** 상품명은 모든 팀 공통이라 전 팀에 반영, 수량은 지금 팀에만 */
  function edit(rank: number, patch: Partial<Prize>) {
    setBoards((prev) =>
      prev?.map((b) => ({
        ...b,
        prizes: b.prizes.map((r) => {
          if (r.rank !== rank) return r;
          if (b.team === team) return { ...r, ...patch };
          return patch.name !== undefined ? { ...r, name: patch.name } : r;
        }),
      })) ?? null,
    );
    setDirty((prev) => (prev.includes(team) ? prev : [...prev, team]));
  }

  if (!authed || !boards) {
    return (
      <main className={styles.screen}>
        <h1 className={styles.title}>재고 관리</h1>
        <form
          className={styles.login}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (password) void load(password);
          }}
        >
          <label htmlFor="pw" className={styles.label}>관리자 비밀번호</label>
          <input
            id="pw"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit" className={styles.primary} disabled={busy || !password}>
            {busy ? "확인 중…" : "들어가기"}
          </button>
          {message && <p className={styles.error} role="alert">{message.text}</p>}
        </form>
      </main>
    );
  }

  const all = boards.flatMap((b) => b.prizes);
  const totalStock = sum(all, "stock");
  const totalInitial = sum(all, "initialStock");
  const rows = boards.find((b) => b.team === team)?.prizes ?? [];
  const teamStock = sum(rows, "stock");

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>재고 관리</h1>

      <div className={styles.stats}>
        <div>
          <div className={styles.statValue}>{totalStock}<span> / {totalInitial}</span></div>
          <div className={styles.statLabel}>전체 남은 개수</div>
        </div>
        <div>
          <div className={styles.statValue}>{Math.max(0, totalInitial - totalStock)}</div>
          <div className={styles.statLabel}>지금까지 나간 개수</div>
        </div>
      </div>

      <div className={styles.teams} role="group" aria-label="팀 선택">
        {TEAMS.map((t) => {
          const prizes = boards.find((b) => b.team === t)?.prizes ?? [];
          return (
            <button
              key={t}
              type="button"
              className={styles.teamTab}
              aria-pressed={team === t}
              onClick={() => setTeam(t)}
            >
              <span className={styles.teamName}>{t}팀{dirty.includes(t) && <span className={styles.dirty} aria-label="저장 안 함">•</span>}</span>
              <span className={styles.teamCount}>{sum(prizes, "stock")}/{sum(prizes, "initialStock")}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.note}>{team}팀 재고예요. 상품명은 모든 팀 공통이에요.</p>

      <ul className={styles.list}>
        {rows.map((r) => {
          const prob = teamStock > 0 && isCount(r.stock) ? (r.stock / teamStock) * 100 : 0;
          return (
            <li key={r.rank} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rank}>{r.rank}등</span>
                <label className={styles.srOnly} htmlFor={`name-${r.rank}`}>{r.rank}등 상품명(모든 팀 공통)</label>
                <input
                  id={`name-${r.rank}`}
                  className={styles.input}
                  value={r.name}
                  onChange={(e) => edit(r.rank, { name: e.target.value })}
                />
              </div>
              <div className={styles.rowNums}>
                <label className={styles.num}>
                  <span>남은 수량</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className={styles.input}
                    value={Number.isNaN(r.stock) ? "" : r.stock}
                    onChange={(e) => edit(r.rank, { stock: e.target.valueAsNumber })}
                  />
                </label>
                <label className={styles.num}>
                  <span>처음 수량</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className={styles.input}
                    value={Number.isNaN(r.initialStock) ? "" : r.initialStock}
                    onChange={(e) => edit(r.rank, { initialStock: e.target.valueAsNumber })}
                  />
                </label>
                <div className={styles.num}>
                  <span>지금 확률</span>
                  <output className={styles.prob}>{prob.toFixed(1)}%</output>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {message && (
        <p className={message.kind === "ok" ? styles.ok : styles.error} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={() => load(password)} disabled={busy}>
          새로고침
        </button>
        <button type="button" className={styles.primary} onClick={save} disabled={busy}>
          {busy ? "처리 중…" : "저장"}
        </button>
      </div>
    </main>
  );
}
