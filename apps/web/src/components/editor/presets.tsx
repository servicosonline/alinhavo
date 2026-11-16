"use client";

import { GRADE_STEP_PRESETS, SEAM_PRESETS, presetStep, type Piece, type Point } from "@alinhavo/geometry";
import { formatCm } from "@/lib/units";

const chip =
  "rounded-full border px-2.5 py-0.5 text-[11px] transition disabled:cursor-not-allowed disabled:opacity-60";
const chipOff = `${chip} border-tinta/20 text-tinta-suave hover:border-tinta hover:text-tinta`;
const chipOn = `${chip} border-tinta bg-tinta text-papel`;

/** Atalhos de margem por tipo de costura: um clique preenche o campo de margem. */
export function SeamPresetChips({
  valueMm,
  disabled,
  onPick,
}: {
  valueMm: number | undefined;
  disabled: boolean;
  onPick: (mm: number) => void;
}) {
  if (disabled) return null;
  return (
    <div className="-mt-2 flex flex-wrap gap-1.5" data-seam-presets>
      {SEAM_PRESETS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={valueMm === s.mm ? chipOn : chipOff}
          title={`${s.hint} (${formatCm(s.mm)} cm)`}
          onClick={() => onPick(s.mm)}
          data-seam-preset={s.id}
        >
          {s.name} {formatCm(s.mm)}
        </button>
      ))}
    </div>
  );
}

/** Passos de gradação prontos para o ponto escolhido (cada um troca só o seu eixo). */
export function GradePresetChips({
  piece,
  pointId,
  step,
  onStep,
}: {
  piece: Piece;
  pointId: string;
  /** Passo atual; null = gradação irregular (o preset parte do zero). */
  step: Point | null;
  onStep: (step: Point) => void;
}) {
  const current = step ?? { x: 0, y: 0 };
  return (
    <div className="flex flex-wrap gap-1.5" data-grade-presets>
      {GRADE_STEP_PRESETS.map((g) => {
        const next = presetStep(piece, pointId, g, current);
        const moves = g.axis === "x" ? next.x !== 0 : next.y !== 0;
        const on = moves && step !== null && next.x === step.x && next.y === step.y;
        return (
          <button
            key={g.id}
            type="button"
            className={on ? chipOn : chipOff}
            title={g.hint}
            onClick={() => onStep(next)}
            data-grade-preset={g.id}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}
