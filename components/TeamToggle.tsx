import { TEAMS } from "@/lib/types";
import styles from "./TeamToggle.module.css";

export function TeamToggle({ value, onChange, disabled = false }: {
  value: number | null;
  onChange: (team: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.toggle} role="group" aria-label="팀 선택">
      {TEAMS.map((team) => (
        <button
          key={team}
          type="button"
          className={styles.team}
          aria-pressed={value === team}
          disabled={disabled}
          onClick={() => onChange(team)}
        >
          {team}팀
        </button>
      ))}
    </div>
  );
}
