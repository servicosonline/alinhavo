"use client";

import { BELLY_RANGE, LIMB_IDS, LIMB_WHOLE, type BodyConditions, type BodyOverrides, type MeasurementKey } from "@alinhavo/cloth";
import { useEffect, useMemo, useState } from "react";
import {
  BODY_GROUPS,
  BODY_TYPES,
  bodyMeasurements,
  bodyRange,
  bodySummary,
  bodyTypeOverrides,
  LIMB_LEVELS,
  LIMB_NAME,
  limbKind,
  limbLevelName,
  naturalBelly,
  setBelly,
  setBodyOverride,
  setLimb,
  suggestedBelly,
  type BodyTypeId,
} from "@/lib/prova/body";
import { applySavedBody, type SavedBodyLibrary } from "@/lib/prova/saved-bodies";
import { formatCm } from "@/lib/units";
import { SavedBodiesSection } from "./saved-bodies-section";
import { ui } from "../ui";

/** Espera entre a última mudança e remontar a Prova (arrastar o controle não remonta a cada passo). */
const APPLY_DELAY_MS = 450;

const smallInput = "w-16 rounded border border-tinta/20 bg-white px-1 py-0.5 text-right text-xs tabular-nums";

type Props = {
  /** Medidas da tabela no tamanho escolhido (nome → mm). */
  table: Record<string, number>;
  overrides: BodyOverrides;
  onChange: (overrides: BodyOverrides) => void;
  /** Membro cortado e gestante (valem em qualquer tamanho). */
  conditions: BodyConditions;
  onConditions: (conditions: BodyConditions) => void;
  /** Salto da tela (mm), que vai junto ao salvar o manequim. */
  heel?: number;
  /** Manequins salvos (só no painel). Carregar entrega tudo de uma vez: medidas, condições e salto. */
  library?: SavedBodyLibrary;
  onLoadSaved?: (loaded: ReturnType<typeof applySavedBody>) => void;
  disabled?: boolean;
};

/** Rascunho que a tela muda na hora e só entrega depois de uma pausa (a Prova remonta a cada entrega). */
function useDraft<T>(value: T, commit: (v: T) => void) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => commit(draft), APPLY_DELAY_MS);
    return () => clearTimeout(t);
  }, [draft, value, commit]);
  return [draft, setDraft] as const;
}

/**
 * Corpo do manequim: tipo de corpo pronto, condições (gestante, membro
 * cortado) e cada medida que o corpo usa, preenchida pela tabela (ou
 * estimada), com controle para trocar. Nada disso muda a tabela de medidas.
 */
export function BodyPanel({ table, overrides, onChange, conditions, onConditions, heel = 0, library, onLoadSaved, disabled }: Props) {
  const [draft, setDraft] = useDraft(overrides, onChange);
  const [cond, setCond] = useDraft(conditions, onConditions);
  const [bodyType, setBodyType] = useState<BodyTypeId | "">("");

  const { table: base, values, estimated } = useMemo(() => bodyMeasurements(table, draft), [table, draft]);
  const summary = bodySummary(draft, cond);
  const changedAny = summary !== bodySummary({}, {});
  const change = (key: MeasurementKey, mm: number) => setDraft((d) => setBodyOverride(d, base, key, mm));

  return (
    <details className={`${ui.card} p-4`} data-body-panel>
      <summary className="cursor-pointer list-none text-xs">
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium">Corpo do manequim</span>
          <span className={changedAny ? "text-linha" : "text-tinta-suave"} data-body-summary={summary}>
            {summary}
          </span>
        </span>
      </summary>
      <div className="mt-3 space-y-4">
        <p className="text-[11px] text-tinta-suave">
          Troque o tipo de corpo, as condições e as medidas para ver o molde em outro corpo. As medidas valem neste tamanho; as condições, em
          todos. A tabela de medidas não muda.
        </p>

        {library && onLoadSaved && (
          <SavedBodiesSection
            library={library}
            values={values}
            conditions={cond}
            heel={heel}
            disabled={disabled}
            onLoad={(saved) => {
              setBodyType("");
              onLoadSaved(applySavedBody(saved, table));
            }}
          />
        )}

        <fieldset className="space-y-2" disabled={disabled}>
          <legend className={`${ui.eyebrow} text-[11px]`}>Tipo de corpo</legend>
          <select
            className={`${ui.input} text-sm`}
            value={bodyType}
            aria-label="Tipo de corpo"
            data-body-type
            onChange={(e) => {
              const id = e.target.value as BodyTypeId | "";
              setBodyType(id);
              const next = id === "" ? {} : bodyTypeOverrides(base, id);
              setDraft(next);
              // A barriga de gestante acompanha o corpo novo (senão some dentro de um corpo mais largo).
              if (cond.belly !== undefined) setCond((c) => setBelly(c, suggestedBelly(bodyMeasurements(table, next).values)));
            }}
          >
            <option value="">Pela tabela</option>
            {BODY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {bodyType && (
            <p className="text-[11px] text-tinta-suave">Ponto de partida aproximado: as medidas abaixo mudaram e cada uma pode ser ajustada.</p>
          )}
        </fieldset>

        <fieldset className="space-y-2" disabled={disabled}>
          <legend className={`${ui.eyebrow} text-[11px]`}>Condição</legend>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cond.belly !== undefined}
              data-body-pregnant
              onChange={(e) => setCond((c) => setBelly(c, e.target.checked ? suggestedBelly(values) : null))}
            />
            Gestante
          </label>
          {cond.belly !== undefined && (
            <div className="space-y-1" data-body-belly>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <label htmlFor="corpo-barriga" title="Volta no ponto mais saliente da barriga">
                  Barriga
                </label>
                <span className="flex items-center gap-1">
                  <input
                    type="number"
                    className={smallInput}
                    min={BELLY_RANGE[0] / 10}
                    max={BELLY_RANGE[1] / 10}
                    step={0.5}
                    value={Math.round(cond.belly) / 10}
                    aria-label="Barriga em cm"
                    data-body-belly-input
                    onChange={(e) => e.target.value !== "" && setCond((c) => setBelly(c, Number(e.target.value) * 10))}
                  />
                  <span className="text-tinta-suave">cm</span>
                </span>
              </div>
              <input
                id="corpo-barriga"
                type="range"
                className="w-full accent-linha"
                min={Math.round(Math.min(naturalBelly(values), cond.belly))}
                max={BELLY_RANGE[1]}
                step={5}
                value={cond.belly}
                onChange={(e) => setCond((c) => setBelly(c, Number(e.target.value)))}
              />
              {cond.belly <= naturalBelly(values) ? (
                <p className="text-[11px] text-linha" data-belly-hidden>
                  Menor que a volta do corpo ali ({formatCm(naturalBelly(values))} cm): a barriga não aparece. Aumente a medida.
                </p>
              ) : (
                <p className="text-[11px] text-tinta-suave">Volta no ponto mais saliente. A barriga cresce para a frente; costas, busto e quadril seguem a tabela.</p>
              )}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2" disabled={disabled}>
          <legend className={`${ui.eyebrow} text-[11px]`}>Membros</legend>
          {LIMB_IDS.map((id) => {
            const value = cond.limbs?.[id] ?? LIMB_WHOLE;
            const levels = LIMB_LEVELS[limbKind(id)];
            const preset = levels.some((l) => Math.abs(l.value - value) < 1e-6);
            return (
              <div key={id} className="space-y-1" data-body-limb={id}>
                <label className="flex items-center justify-between gap-2 text-xs">
                  <span>{LIMB_NAME[id]}</span>
                  <select
                    className="rounded border border-tinta/20 bg-white px-1 py-0.5 text-xs"
                    value={preset ? String(value) : "outro"}
                    data-body-limb-select={id}
                    onChange={(e) => e.target.value !== "outro" && setCond((c) => setLimb(c, id, Number(e.target.value)))}
                  >
                    {levels.map((l) => (
                      <option key={l.value} value={String(l.value)}>
                        {l.name}
                      </option>
                    ))}
                    {!preset && <option value="outro">{limbLevelName(id, value)}</option>}
                  </select>
                </label>
                {value < LIMB_WHOLE && (
                  <input
                    type="range"
                    className="w-full accent-linha"
                    min={0}
                    max={LIMB_WHOLE}
                    step={0.05}
                    value={value}
                    aria-label={`${LIMB_NAME[id]}: até onde vai`}
                    title={limbLevelName(id, value)}
                    onChange={(e) => setCond((c) => setLimb(c, id, Number(e.target.value)))}
                  />
                )}
              </div>
            );
          })}
        </fieldset>

        {BODY_GROUPS.map((group) => (
          <fieldset key={group.name} className="space-y-2" disabled={disabled}>
            <legend className={`${ui.eyebrow} text-[11px]`}>{group.name}</legend>
            {group.fields.map((field) => {
              const [lo, hi] = bodyRange(field.key);
              const value = values[field.key];
              const changed = draft[field.key] !== undefined;
              const guessed = !changed && estimated.includes(field.key);
              const id = `corpo-${field.key}`;
              return (
                <div key={field.key} className="space-y-1" data-body-field={field.key}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <label htmlFor={id} title={field.hint}>
                      {field.name}
                      {guessed && <span className="ml-1 text-[10px] text-tinta-suave">(estimada)</span>}
                    </label>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        className={smallInput}
                        min={lo / 10}
                        max={hi / 10}
                        step={0.5}
                        value={Math.round(value) / 10}
                        aria-label={`${field.name} em cm`}
                        onChange={(e) => e.target.value !== "" && change(field.key, Number(e.target.value) * 10)}
                        data-body-input={field.key}
                      />
                      <span className="text-tinta-suave">cm</span>
                      {changed && (
                        <button
                          type="button"
                          className="px-1 text-linha hover:text-tinta"
                          title={`Voltar a ${formatCm(base[field.key])} cm`}
                          aria-label={`${field.name}: voltar ao valor da tabela`}
                          onClick={() => change(field.key, base[field.key])}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                  <input
                    id={id}
                    type="range"
                    className={`w-full ${changed ? "accent-linha" : "accent-tinta"}`}
                    min={lo}
                    max={hi}
                    step={5}
                    value={value}
                    onChange={(e) => change(field.key, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </fieldset>
        ))}
        <button
          type="button"
          className={`${ui.buttonGhost} w-full`}
          disabled={disabled || !changedAny}
          onClick={() => {
            setDraft({});
            setCond({});
            setBodyType("");
          }}
        >
          Voltar tudo à tabela
        </button>
      </div>
    </details>
  );
}
