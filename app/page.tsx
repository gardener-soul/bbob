"use client";

import { useEffect, useRef, useState } from "react";
import { CAPSULE_COLORS, ClosedCapsule, MiniCapsule, OpenedCapsule } from "@/components/Capsule";
import { Machine } from "@/components/Machine";
import { pickVerse, type Verse } from "@/lib/verses";
import styles from "./page.module.css";

type Phase = "idle" | "spinning" | "capsule" | "result" | "soldout";
type Won = { rank: number; name: string; color: string; verse: Verse };

const MIN_SPIN_MS = 1200;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HEADINGS: Record<Exclude<Phase, "result">, [string, string]> = {
  idle: ["레버를 돌려볼까요?", "캡슐 속 선물과 말씀을 함께 드려요"],
  spinning: ["레버를 돌려볼까요?", "캡슐 속 선물과 말씀을 함께 드려요"],
  capsule: ["캡슐이 나왔어요!", "캡슐을 눌러 열어보세요"],
  soldout: ["선물이 모두 나갔어요", "함께해주셔서 감사합니다.\n오늘도 평안하세요!"],
};

export default function DrawPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [won, setWon] = useState<Won | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 연타 방지: 다시 그려지기 전에 들어온 클릭은 phase 로는 못 막는다
  const drawing = useRef(false);

  function showToast(message: string) {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  async function spin() {
    if (phase !== "idle" || drawing.current) return;
    drawing.current = true;
    setPhase("spinning");
    const color = CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];
    try {
      const [res] = await Promise.all([fetch("/api/draw", { method: "POST" }), wait(MIN_SPIN_MS)]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.soldOut) {
        setPhase("soldout");
        return;
      }
      setWon({ rank: data.rank, name: data.name, color, verse: pickVerse(Math.random()) });
      setPhase("capsule");
    } catch {
      setPhase("idle");
      showToast("다시 돌려주세요");
    } finally {
      drawing.current = false;
    }
  }

  function next() {
    setWon(null);
    setPhase("idle");
  }

  if (phase === "result" && won) {
    return <ResultView won={won} onNext={next} />;
  }

  const [title, sub] = HEADINGS[phase === "result" ? "idle" : phase];

  return (
    <main className={styles.screen}>
      <Decorations />

      <header className={styles.header}>
        <div className={styles.chip}>수원제일교회 새벽이슬청년부</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{sub}</p>
      </header>

      <div className={styles.stage}>
        <Machine spinning={phase === "spinning"} />
        {phase === "capsule" && won && (
          <button
            type="button"
            className={styles.capsule}
            onClick={() => setPhase("result")}
            aria-label="캡슐 열기"
          >
            <ClosedCapsule color={won.color} />
          </button>
        )}
      </div>

      {phase === "capsule" ? (
        <button type="button" className={styles.primary} onClick={() => setPhase("result")}>
          캡슐 열기
        </button>
      ) : (
        <button
          type="button"
          className={styles.primary}
          onClick={spin}
          disabled={phase !== "idle"}
          aria-busy={phase === "spinning"}
        >
          {phase === "spinning" ? "돌리는 중…" : "레버 돌리기"}
        </button>
      )}

      <footer className={styles.footer}>
        <div>새벽 이슬 같은 주의 청년들이 주께 나오는도다</div>
        <div>시편 110:3</div>
      </footer>

      <div className={styles.toast} role="status" aria-live="polite" data-show={toast !== null}>
        {toast}
      </div>
    </main>
  );
}

function ResultView({ won, onNext }: { won: Won; onNext: () => void }) {
  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#FF6B57", "#3B82F6", "#20C09E", "#FFC531", "#1B2559"];
      const base = { colors, disableForReducedMotion: true, origin: { y: 0.3 } };
      if (won.rank <= 2) {
        confetti({ ...base, particleCount: 160, spread: 100, startVelocity: 45 });
        setTimeout(() => {
          if (cancelled) return;
          confetti({ ...base, particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.5 } });
          confetti({ ...base, particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.5 } });
        }, 300);
      } else {
        confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 30 });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [won.rank]);

  const len = won.verse.text.length;
  const verseSize = len <= 30 ? styles.verseL : len <= 60 ? styles.verseM : styles.verseS;

  return (
    <main className={`${styles.screen} ${styles.result}`}>
      <div className={styles.resultLeft}>
        <OpenedCapsule color={won.color} />

        <div className={styles.prize}>
          <div className={styles.congrats}>축하해요!</div>
          <div className={styles.rank}>{won.rank}등</div>
          <div className={styles.prizeName}>{won.name}</div>
        </div>
      </div>

      <div className={styles.resultRight}>
        <section className={styles.verseCard} aria-label="오늘의 말씀">
          <div className={styles.verseLabel}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 C15 7 18 10 18 14 A6 6 0 0 1 6 14 C6 10 9 7 12 3 Z" />
            </svg>
            오늘의 말씀
          </div>
          <p className={`${styles.verseText} ${verseSize}`}>{won.verse.text}</p>
          <div className={styles.verseRef}>{won.verse.ref}</div>
        </section>

        {/* 긴 말씀으로 화면이 넘쳐도 버튼은 항상 화면 아래에 보이게 */}
        <div className={styles.resultFooter}>
          <button type="button" className={styles.secondary} onClick={onNext}>
            다음 분 뽑기
          </button>
        </div>
      </div>
    </main>
  );
}

/** 배경에 흩어진 캡슐 — 근거: 시안 A Main.dc.html */
function Decorations() {
  return (
    <>
      <svg viewBox="-30 -30 60 60" className={`${styles.deco} ${styles.deco1}`} aria-hidden="true">
        <MiniCapsule x={0} y={0} rotate={-30} color="#FF6B57" />
      </svg>
      <svg viewBox="-30 -30 60 60" className={`${styles.deco} ${styles.deco2}`} aria-hidden="true">
        <MiniCapsule x={0} y={0} rotate={50} color="#20C09E" />
      </svg>
      <svg viewBox="-30 -30 60 60" className={`${styles.deco} ${styles.deco3}`} aria-hidden="true">
        <MiniCapsule x={0} y={0} rotate={140} color="#FFC531" />
      </svg>
    </>
  );
}
