import styles from "./Capsule.module.css";

/** 반반 캡슐의 색 쪽. 등수와 무관하게 무작위로 고른다(열기 전엔 결과를 모르게) */
export const CAPSULE_COLORS = ["#FF6B57", "#3B82F6", "#20C09E", "#FFC531"];

/** 시안 A 의 작은 반반 캡슐(머신 안·배경 장식) */
export function MiniCapsule({ x, y, rotate, color, r = 24 }: {
  x: number; y: number; rotate: number; color: string; r?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <circle r={r} fill="#FFFFFF" stroke="#D3DFF3" strokeWidth={2} />
      <path d={`M-${r} 0 A${r} ${r} 0 0 1 ${r} 0 Z`} fill={color} />
    </g>
  );
}

/** 머신에서 굴러 나온 닫힌 캡슐 */
export function ClosedCapsule({ color }: { color: string }) {
  return (
    <svg viewBox="-60 -60 120 120" className={styles.closed} aria-hidden="true">
      <g transform="rotate(-20)">
        <circle r={54} fill="#FFFFFF" stroke="#D3DFF3" strokeWidth={3} />
        <path d="M-54 0 A54 54 0 0 1 54 0 Z" fill={color} />
        <rect x={-56} y={-4} width={112} height={8} rx={4} fill="#1B2559" opacity={0.12} />
        <ellipse cx={-24} cy={-30} rx={10} ry={5} transform="rotate(-35 -24 -30)" fill="#FFFFFF" opacity={0.6} />
      </g>
    </svg>
  );
}

/** 결과 화면의 열린 캡슐 — 근거: 시안 A-Result.dc.html */
export function OpenedCapsule({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 300 190" className={styles.opened} aria-hidden="true">
      <g transform="translate(150 112)" stroke="#1B2559" strokeWidth={4} strokeLinecap="round" opacity={0.18}>
        {[-70, -40, -10, 20, 50, 80].map((deg) => (
          <line key={deg} x1={0} y1={-78} x2={0} y2={-100} transform={`rotate(${deg})`} />
        ))}
      </g>
      <g className={styles.bits}>
        <rect x={34} y={40} width={12} height={6} rx={2} transform="rotate(-30 40 43)" fill="#FF6B57" />
        <rect x={252} y={52} width={12} height={6} rx={2} transform="rotate(40 258 55)" fill="#FFC531" />
        <rect x={62} y={150} width={10} height={5} rx={2} transform="rotate(60 67 152)" fill="#20C09E" />
        <rect x={236} y={150} width={12} height={6} rx={2} transform="rotate(-20 242 153)" fill="#3B82F6" />
        <circle cx={214} cy={22} r={4} fill="#FF6B57" />
        <circle cx={80} cy={16} r={3.5} fill="#3B82F6" />
        <circle cx={276} cy={110} r={3.5} fill="#20C09E" />
        <circle cx={22} cy={104} r={4} fill="#FFC531" />
      </g>
      <g transform="translate(168 136) rotate(10)">
        <g className={styles.bottomHalf}>
          <path d="M-56 0 A56 56 0 0 0 56 0 Z" fill="#FFFFFF" stroke="#D3DFF3" strokeWidth={2} />
          <rect x={-58} y={-4} width={116} height={8} rx={4} fill="#DDE7F7" />
        </g>
      </g>
      <g transform="translate(120 82) rotate(-22)">
        <g className={styles.topHalf}>
          <path d="M-56 0 A56 56 0 0 1 56 0 Z" fill={color} />
          <rect x={-58} y={-4} width={116} height={8} rx={4} fill="#1B2559" opacity={0.2} />
        </g>
      </g>
      <path transform="translate(246 86)" d="M0 -14 C6 -6 10 -1 10 5 A10 10 0 0 1 -10 5 C-10 -1 -6 -6 0 -14 Z" fill="#9CC3FF" />
    </svg>
  );
}
