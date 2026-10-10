"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Prize } from "@/lib/types";
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
async function callAdmin(pw: string, init?: RequestInit): Promise<Prize[]> {
  const res = await fetch("/api/admin/prizes", {
    ...init,
    headers: { "content-type": "application/json", "x-admin-password": encodeURIComponent(pw) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(data.error ?? "요청에 실패했어요", res.status);
  return data as Prize[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Prize[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function fail(err: unknown) {
    if (err instanceof AdminError && err.status === 401) {
      savePassword(null);
      setAuthed(false);
      setRows(null);
    }
    setMessage({ kind: "error", text: (err as Error).message });
  }

  async function load(pw: string) {
    setBusy(true);
    setMessage(null);
    try {
      setRows(await callAdmin(pw));
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
        setRows(data);
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
    if (!rows) return;
    const invalid = rows.find((r) => !r.name.trim() || !isCount(r.stock) || !isCount(r.initialStock));
    if (invalid) {
      setMessage({ kind: "error", text: `${invalid.rank}등 입력값을 확인해주세요` });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      setRows(await callAdmin(password, { method: "PUT", body: JSON.stringify(rows) }));
      setMessage({ kind: "ok", text: "저장했어요" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  function edit(rank: number, patch: Partial<Prize>) {
    setRows((prev) => prev?.map((r) => (r.rank === rank ? { ...r, ...patch } : r)) ?? null);
  }

  if (!authed || !rows) {
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

  const totalStock = rows.reduce((s, r) => s + (isCount(r.stock) ? r.stock : 0), 0);
  const totalInitial = rows.reduce((s, r) => s + (isCount(r.initialStock) ? r.initialStock : 0), 0);
  const given = rows.reduce((s, r) => s + Math.max(0, r.initialStock - r.stock || 0), 0);

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>재고 관리</h1>

      <div className={styles.stats}>
        <div>
          <div className={styles.statValue}>{totalStock}<span> / {totalInitial}</span></div>
          <div className={styles.statLabel}>남은 개수</div>
        </div>
        <div>
          <div className={styles.statValue}>{given}</div>
          <div className={styles.statLabel}>지금까지 나간 개수</div>
        </div>
      </div>

      <ul className={styles.list}>
        {rows.map((r) => {
          const prob = totalStock > 0 && isCount(r.stock) ? (r.stock / totalStock) * 100 : 0;
          return (
            <li key={r.rank} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rank}>{r.rank}등</span>
                <label className={styles.srOnly} htmlFor={`name-${r.rank}`}>{r.rank}등 상품명</label>
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
