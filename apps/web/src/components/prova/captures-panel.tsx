"use client";

import { ANGLE_LABEL, MAX_CAPTURES, type Capture } from "@/lib/prova/captures";
import { ui } from "../ui";

type Props = {
  captures: Capture[];
  onCapture: (angles: Capture["angle"][]) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
  /** Aviso curto (ex.: limite atingido). */
  note: string | null;
  /** Ação seguinte com as capturas (no painel: pedir aprovação). */
  children?: React.ReactNode;
};

/** Imagens da Prova para mandar à aprovação: o ângulo da tela ou frente, costas e lado. */
export function CapturesPanel({ captures, onCapture, onRemove, disabled, note, children }: Props) {
  const full = captures.length >= MAX_CAPTURES;
  return (
    <div className={`${ui.card} space-y-3 p-4`} data-captures>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium">Capturas</h2>
        <span className="text-[11px] text-tinta-suave">
          {captures.length} de {MAX_CAPTURES}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={ui.buttonGhost} onClick={() => onCapture(["atual"])} disabled={disabled || full} data-capture="atual">
          Este ângulo
        </button>
        <button
          type="button"
          className={ui.buttonGhost}
          onClick={() => onCapture(["frente", "costas", "lado"])}
          disabled={disabled || full}
          data-capture="tres"
        >
          Frente, costas e lado
        </button>
      </div>
      {captures.length > 0 ? (
        <ul className="grid grid-cols-4 gap-1.5" aria-label="Imagens capturadas">
          {captures.map((c, i) => (
            <li key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL local, sem otimização do Next */}
              <img src={c.dataUrl} alt={ANGLE_LABEL[c.angle]} className="aspect-[3/4] w-full rounded border border-tinta/15 bg-papel object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded bg-white/90 px-1 text-xs leading-5 text-tinta shadow-sm hover:text-linha"
                onClick={() => onRemove(i)}
                aria-label={`Tirar ${ANGLE_LABEL[c.angle]}`}
              >
                ×
              </button>
              <span className="mt-0.5 block truncate text-center text-[10px] text-tinta-suave">{ANGLE_LABEL[c.angle]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-tinta-suave">Gire a roupa até o ângulo que quer mostrar, ou capture frente, costas e lado de uma vez.</p>
      )}
      {note && <p className="text-[11px] text-linha">{note}</p>}
      {children}
    </div>
  );
}
