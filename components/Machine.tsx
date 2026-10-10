import { MiniCapsule } from "./Capsule";
import styles from "./Machine.module.css";

const C = { coral: "#FF6B57", blue: "#3B82F6", mint: "#20C09E", yellow: "#FFC531" };

// 근거: 시안 A Main.dc.html — 위 줄부터 그려서 아래 줄이 앞에 보이게
const PILE: [x: number, y: number, rotate: number, color: string][] = [
  [62, 122, 30, C.mint], [154, 118, -45, C.coral], [222, 126, 120, C.blue],
  [39, 162, 100, C.coral], [85, 162, -10, C.yellow], [131, 162, 35, C.mint],
  [177, 162, -130, C.blue], [223, 162, 60, C.yellow], [269, 162, 0, C.mint],
  [62, 204, -20, C.blue], [108, 204, 45, C.mint], [154, 204, 160, C.coral],
  [200, 204, -60, C.yellow], [246, 204, 10, C.coral],
  [85, 246, 20, C.yellow], [131, 246, -35, C.coral], [177, 246, 70, C.blue],
  [223, 246, 150, C.mint],
];

const DEW = "M0 -14 C6 -6 10 -1 10 5 A10 10 0 0 1 -10 5 C-10 -1 -6 -6 0 -14 Z";

export function Machine({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 300 400"
      className={`${styles.machine} ${spinning ? styles.spinning : ""}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="globeClip">
          <circle cx={150} cy={150} r={118} />
        </clipPath>
      </defs>
      <ellipse cx={150} cy={392} rx={112} ry={7} fill="#1B2559" opacity={0.12} />
      <rect x={118} y={8} width={64} height={22} rx={8} fill="#1B2559" />
      <circle cx={150} cy={150} r={124} fill="#FFFFFF" stroke="#CFE0FA" strokeWidth={6} />
      <g clipPath="url(#globeClip)">
        <g className={styles.pile}>
          {PILE.map(([x, y, rotate, color], i) => (
            <MiniCapsule key={i} x={x} y={y} rotate={rotate} color={color} />
          ))}
        </g>
      </g>
      <g transform="translate(222 64)">
        <path d="M0 -16 C7 -7 12 -1 12 6 A12 12 0 0 1 -12 6 C-12 -1 -7 -7 0 -16 Z" fill="#9CC3FF" />
        <ellipse cx={-4} cy={4} rx={2.5} ry={4} fill="#FFFFFF" />
      </g>
      <rect x={70} y={262} width={160} height={24} rx={8} fill="#1B2559" />
      <path
        d="M52 284 H248 Q262 284 264 298 L276 372 Q278 388 262 388 H38 Q22 388 24 372 L36 298 Q38 284 52 284 Z"
        fill="#1B2559"
      />
      <path transform="translate(86 326)" d={DEW} fill="#9CC3FF" />
      <text x={86} y={362} className={styles.label}>새벽이슬</text>
      <g className={styles.knob}>
        <circle cx={150} cy={324} r={32} fill="#FFD23F" />
        <rect x={143} y={298} width={14} height={52} rx={7} transform="rotate(20 150 324)" fill="#1B2559" />
      </g>
      <rect x={196} y={338} width={58} height={36} rx={10} fill="#0E1440" />
      <rect x={201} y={343} width={48} height={12} rx={4} fill="#2A3570" />
    </svg>
  );
}
