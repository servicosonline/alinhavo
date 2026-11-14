"use client";

import { useState } from "react";
import { addToLook, LOOK_MAX, moveInLook, removeFromLook, setLookFabric, type LookItem, type LookOption } from "@/lib/prova/look";
import { FABRIC_COLOR } from "@/lib/prova/paint";
import type { FabricId } from "@/lib/prova/protocol";
import { lookShade } from "@/lib/prova/look";
import { ui } from "../ui";

export const FABRIC_NAME: Record<FabricId, string> = { planoLeve: "Plano leve", malha: "Malha", jeans: "Jeans" };
const FABRIC_IDS = Object.keys(FABRIC_NAME) as FabricId[];

type Props = {
  look: LookItem[];
  options: LookOption[];
  /** Tecido do molde em prova (escolhido acima, em Tecido). */
  mainFabric: FabricId;
  onChange: (look: LookItem[]) => void;
  disabled?: boolean;
};

/**
 * Look: outras roupas no mesmo corpo, de dentro para fora. Cada uma com o seu
 * tecido; as setas trocam a camada. O ajuste continua só no molde em prova.
 */
export function LookPanel({ look, options, mainFabric, onChange, disabled }: Props) {
  const [choice, setChoice] = useState(options[0]?.id ?? "");
  const option = options.find((o) => o.id === choice) ?? options[0];
  const full = look.length >= LOOK_MAX;
  return (
    <div className={`${ui.card} space-y-3 p-4`} data-look-panel>
      <div>
        <p className="text-xs font-medium">Look</p>
        <p className="text-[11px] text-tinta-suave">Outras roupas no mesmo corpo. De dentro para fora:</p>
      </div>
      <ol className="space-y-1.5">
        {look.map((item, k) => {
          const fabric = item.main ? mainFabric : item.fabric;
          return (
            <li key={item.key} className="flex items-center gap-1.5 text-xs" data-look-item={item.main ? "main" : item.optionId}>
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-tinta/20"
                style={{ background: lookShade(FABRIC_COLOR[fabric], k) }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate" title={item.name}>
                {item.main ? <strong className="font-medium">Este molde</strong> : item.name}
              </span>
              {item.main ? (
                <span className="text-tinta-suave">{FABRIC_NAME[fabric]}</span>
              ) : (
                <select
                  className="rounded border border-tinta/20 bg-white px-1 py-0.5 text-xs"
                  value={item.fabric}
                  aria-label={`Tecido de ${item.name}`}
                  disabled={disabled}
                  onChange={(e) => onChange(setLookFabric(look, item.key, e.target.value as FabricId))}
                >
                  {FABRIC_IDS.map((f) => (
                    <option key={f} value={f}>
                      {FABRIC_NAME[f]}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="rounded px-1 text-tinta-suave hover:bg-papel-escuro disabled:opacity-30"
                aria-label={`${item.main ? "Este molde" : item.name}: uma camada para dentro`}
                title="Para dentro"
                disabled={disabled || k === 0}
                onClick={() => onChange(moveInLook(look, item.key, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded px-1 text-tinta-suave hover:bg-papel-escuro disabled:opacity-30"
                aria-label={`${item.main ? "Este molde" : item.name}: uma camada para fora`}
                title="Para fora"
                disabled={disabled || k === look.length - 1}
                onClick={() => onChange(moveInLook(look, item.key, 1))}
              >
                ↓
              </button>
              {!item.main && (
                <button
                  type="button"
                  className="rounded px-1 text-linha hover:bg-linha/10 disabled:opacity-30"
                  aria-label={`Tirar ${item.name} do look`}
                  title="Tirar do look"
                  disabled={disabled}
                  onClick={() => onChange(removeFromLook(look, item.key))}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {options.length > 0 && (
        <div className="flex gap-1.5">
          <select
            className={`${ui.input} mt-0 min-w-0 flex-1 py-1 text-xs`}
            value={option?.id ?? ""}
            aria-label="Roupa para pôr no look"
            disabled={disabled || full}
            onChange={(e) => setChoice(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={ui.buttonGhost}
            disabled={disabled || full || !option}
            data-look-add
            onClick={() => option && onChange(addToLook(look, option, mainFabric))}
          >
            Pôr por fora
          </button>
        </div>
      )}
      {full && <p className="text-[11px] text-tinta-suave">Até {LOOK_MAX} roupas no look.</p>}
    </div>
  );
}
