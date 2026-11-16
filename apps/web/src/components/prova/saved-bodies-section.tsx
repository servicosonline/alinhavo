"use client";

import type { BodyConditions, BodyMeasurements } from "@alinhavo/cloth";
import { useState, useTransition } from "react";
import {
  isSavedBodyActive,
  SAVED_BODIES_MAX,
  SAVED_BODY_NAME_MAX,
  savedBodyPayload,
  type SavedBody,
  type SavedBodyLibrary,
} from "@/lib/prova/saved-bodies";
import { ui } from "../ui";

type Props = {
  library: SavedBodyLibrary;
  /** O corpo que está na tela agora (medidas que vestem, condições e salto). */
  values: BodyMeasurements;
  conditions: BodyConditions;
  heel: number;
  onLoad: (saved: SavedBody) => void;
  disabled?: boolean;
};

/**
 * Manequins salvos da organização: carregar um no corpo da Prova e, para quem
 * edita moldes, salvar o corpo da tela com um nome (o mesmo nome atualiza) ou
 * apagar o escolhido.
 */
export function SavedBodiesSection({ library, values, conditions, heel, onLoad, disabled }: Props) {
  const [list, setList] = useState(library.initial);
  const [chosen, setChosen] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const active = list.find((b) => isSavedBodyActive(b, values, conditions, heel));
  const selected = list.find((b) => b.id === chosen) ?? null;
  const trimmed = name.replace(/\s+/g, " ").trim();
  const replaces = list.find((b) => b.name === trimmed);
  const full = !replaces && list.length >= SAVED_BODIES_MAX;

  const save = () =>
    start(async () => {
      setMessage(null);
      const r = await library.save(trimmed, savedBodyPayload(values, conditions, heel));
      if (!r.ok) return setMessage({ kind: "error", text: r.error });
      setList(r.list);
      if (r.savedId) setChosen(r.savedId);
      setName("");
      setMessage({ kind: "ok", text: replaces ? `"${trimmed}" atualizado.` : `"${trimmed}" salvo.` });
    });

  const remove = () => {
    if (!selected || !window.confirm(`Apagar o manequim "${selected.name}"? Os moldes não mudam.`)) return;
    start(async () => {
      setMessage(null);
      const r = await library.remove(selected.id);
      if (!r.ok) return setMessage({ kind: "error", text: r.error });
      setList(r.list);
      setChosen("");
      setMessage({ kind: "ok", text: `"${selected.name}" apagado.` });
    });
  };

  return (
    <fieldset className="space-y-2" disabled={disabled || pending} data-saved-bodies>
      <legend className={`${ui.eyebrow} text-[11px]`}>Manequins salvos</legend>
      {list.length === 0 ? (
        <p className="text-[11px] text-tinta-suave">
          {library.canEdit
            ? "Nenhum ainda. Ajuste o corpo abaixo e salve com um nome (ex.: o da cliente) para usar em qualquer molde."
            : "Nenhum manequim salvo na organização."}
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            className={`${ui.input} min-w-0 flex-1 text-sm`}
            aria-label="Manequim salvo"
            value={chosen}
            data-saved-body-select
            onChange={(e) => {
              const id = e.target.value;
              setChosen(id);
              setMessage(null);
              const body = list.find((b) => b.id === id);
              if (body) onLoad(body);
            }}
          >
            <option value="">Carregar um manequim…</option>
            {list.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {library.canEdit && selected && (
            <button type="button" className={ui.buttonGhost} onClick={remove} aria-label={`Apagar ${selected.name}`}>
              Apagar
            </button>
          )}
        </div>
      )}
      {active && (
        <p className="text-[11px] text-tinta-suave" data-saved-body-active>
          Vestindo: <strong className="text-tinta">{active.name}</strong>
        </p>
      )}
      {library.canEdit && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed && !full) save();
          }}
        >
          <input
            className={`${ui.input} min-w-0 flex-1 text-sm`}
            placeholder="Nome (ex.: Maria, 42)"
            aria-label="Nome do manequim"
            maxLength={SAVED_BODY_NAME_MAX}
            value={name}
            list="manequins-salvos"
            onChange={(e) => setName(e.target.value)}
            data-saved-body-name
          />
          <datalist id="manequins-salvos">
            {list.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
          <button type="submit" className={ui.buttonGhost} disabled={!trimmed || full}>
            {pending ? "Salvando…" : replaces ? "Atualizar" : "Salvar"}
          </button>
        </form>
      )}
      {full && <p className="text-[11px] text-tinta-suave">Limite de {SAVED_BODIES_MAX} manequins. Apague um para salvar outro.</p>}
      {message && (
        <p className={message.kind === "error" ? ui.error : "text-[11px] text-tinta-suave"} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </fieldset>
  );
}
