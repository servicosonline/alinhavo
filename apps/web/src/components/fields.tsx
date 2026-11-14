"use client";

import { useState } from "react";
import { formatCm, parseCmToMm } from "@/lib/units";
import { ui } from "./ui";

/**
 * Campo em cm que guarda mm. Aplica ao sair do campo ou com Enter; Esc desfaz.
 * `allowEmpty`: vazio vira null (ex.: "usar a margem padrão").
 */
export function CmField({
  label,
  valueMm,
  onCommit,
  disabled,
  allowEmpty,
  min,
  max,
  placeholder,
  hideLabel,
}: {
  label: string;
  valueMm: number | null;
  onCommit: (mm: number | null) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Rótulo só para leitor de tela (ex.: células de tabela). */
  hideLabel?: boolean;
}) {
  const shown = valueMm === null ? "" : formatCm(valueMm);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (text === "") {
      if (allowEmpty) onCommit(null);
      setError(null);
      return;
    }
    const mm = parseCmToMm(text);
    if (mm === null) return setError("Digite um número, como 12,5");
    if ((min !== undefined && mm < min) || (max !== undefined && mm > max)) {
      return setError(`Entre ${formatCm(min ?? 0)} e ${formatCm(max ?? 0)} cm`);
    }
    setError(null);
    if (mm !== valueMm) onCommit(mm);
  }

  return (
    <label className="block text-xs">
      <span className={hideLabel ? "sr-only" : "font-medium text-tinta"}>{label}</span>
      <span className={`relative block ${hideLabel ? "" : "mt-1"}`}>
        <input
          inputMode="decimal"
          className={`${ui.input} mt-0 pr-9 font-mono text-sm`}
          value={draft ?? shown}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(null);
              setError(null);
              e.currentTarget.blur();
            }
          }}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-tinta-suave">cm</span>
      </span>
      {error && <span className="mt-1 block text-linha">{error}</span>}
    </label>
  );
}

export function TextField({
  label,
  value,
  onCommit,
  disabled,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="block text-xs">
      <span className="font-medium text-tinta">{label}</span>
      <input
        className={`${ui.input} text-sm`}
        value={draft ?? value}
        disabled={disabled}
        maxLength={120}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && draft.trim() && draft.trim() !== value) onCommit(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
