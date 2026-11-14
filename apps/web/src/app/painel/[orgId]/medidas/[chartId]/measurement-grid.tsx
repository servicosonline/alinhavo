"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CmField } from "@/components/fields";
import { ui } from "@/components/ui";
import { removeMeasurementRow, saveMeasurement } from "../actions";

type Size = { id: string; label: string };

/** Medidas que toda tabela de roupa costuma ter (só sugestão). */
const SUGESTOES = [
  "busto",
  "cintura",
  "quadril",
  "altura do quadril",
  "ombro",
  "largura das costas",
  "comprimento do braço",
  "punho",
  "gancho",
  "entrepernas",
  "comprimento da saia",
  "altura",
];

export function MeasurementGrid({
  orgId,
  chartId,
  sizes,
  values,
  canEdit,
}: {
  orgId: string;
  chartId: string;
  sizes: Size[];
  /** nome da medida → id do tamanho → mm */
  values: Record<string, Record<string, number>>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [extraRows, setExtraRows] = useState<string[]>([]);
  const [newRow, setNewRow] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = [...Object.keys(values), ...extraRows.filter((r) => !(r in values))];

  function commit(sizeId: string, name: string, mm: number | null) {
    setError(null);
    startTransition(async () => {
      const r = await saveMeasurement(orgId, chartId, sizeId, name, mm);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  }

  if (sizes.length === 0) return <p className={ui.muted}>Inclua tamanhos para preencher as medidas.</p>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-tinta/15 bg-white/70">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-tinta/10 text-left">
              <th className="px-3 py-2 font-medium">Medida (cm)</th>
              {sizes.map((s) => (
                <th key={s.id} className="px-2 py-2 text-center font-medium">
                  {s.label}
                </th>
              ))}
              {canEdit && <th className="px-2 py-2" aria-label="Ações" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={sizes.length + 2} className="px-3 py-4 text-tinta-suave">
                  Nenhuma medida ainda. Inclua a primeira abaixo.
                </td>
              </tr>
            )}
            {rows.map((name) => (
              <tr key={name} className="border-b border-tinta/5 last:border-0">
                <th scope="row" className="px-3 py-1.5 text-left font-normal capitalize">
                  {name}
                </th>
                {sizes.map((s) => {
                  const mm = values[name]?.[s.id] ?? null;
                  return (
                    <td key={s.id} className="w-24 px-1 py-1">
                      <CmField
                        key={`${name}-${s.id}-${mm}`}
                        label={`${name}, ${s.label}`}
                        hideLabel
                        valueMm={mm}
                        allowEmpty
                        min={1}
                        max={4999}
                        disabled={!canEdit}
                        onCommit={(v) => commit(s.id, name, v)}
                      />
                    </td>
                  );
                })}
                {canEdit && (
                  <td className="px-2">
                    {name in values ? (
                      <form action={removeMeasurementRow}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="chartId" value={chartId} />
                        <input type="hidden" name="name" value={name} />
                        <button type="submit" className="text-xs text-tinta-suave hover:text-linha" aria-label={`Apagar a medida ${name}`}>
                          apagar
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-tinta-suave hover:text-linha"
                        onClick={() => setExtraRows((r) => r.filter((x) => x !== name))}
                      >
                        tirar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newRow.trim().toLowerCase();
            if (!name || name.length > 60 || rows.includes(name)) return;
            setExtraRows((r) => [...r, name]);
            setNewRow("");
          }}
        >
          <label className="block text-xs">
            <span className="font-medium">Nova medida</span>
            <input
              className={`${ui.input} w-56 text-sm`}
              list="sugestoes-medidas"
              value={newRow}
              maxLength={60}
              placeholder="Ex.: cintura"
              onChange={(e) => setNewRow(e.target.value)}
            />
            <datalist id="sugestoes-medidas">
              {SUGESTOES.filter((s) => !rows.includes(s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <button type="submit" className={ui.buttonGhost}>
            Incluir linha
          </button>
          <span className="text-xs text-tinta-suave">A linha é salva quando você preencher o primeiro valor.</span>
        </form>
      )}

      {pending && (
        <p className="text-xs text-tinta-suave" role="status">
          Salvando…
        </p>
      )}
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
