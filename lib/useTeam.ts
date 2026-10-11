"use client";

import { useSyncExternalStore } from "react";
import { TEAM_COUNT } from "./types";

const KEY = "saebyeok-team";
const EVENT = "saebyeok-team-change";
// 시크릿 창 등에서 localStorage 가 막혀도 이번 화면에서는 계속 쓸 수 있게
let fallback: number | null = null;

function read(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (Number.isInteger(v) && v >= 1 && v <= TEAM_COUNT) return v;
  } catch {
    // 아래 fallback 사용
  }
  return fallback;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 이 기기가 맡은 팀. 한 번 고르면 기기에 기억된다(팀마다 iPad 한 대) */
export function useTeam(): [number | null, (team: number) => void] {
  const team = useSyncExternalStore(subscribe, read, () => null);
  const setTeam = (next: number) => {
    fallback = next;
    try {
      localStorage.setItem(KEY, String(next));
    } catch {
      // fallback 에 남아 있다
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [team, setTeam];
}
