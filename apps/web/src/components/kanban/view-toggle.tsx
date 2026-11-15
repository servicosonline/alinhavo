"use client";

import { useSyncExternalStore } from "react";

export type View = "lista" | "quadro";

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("alinhavo:vista:") && fn();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** A vista escolhida (Lista | Quadro), guardada no navegador por tela (`alinhavo:vista:<chave>`). */
export function useView(key: string, fallback: View = "lista"): [View, (v: View) => void] {
  const storageKey = `alinhavo:vista:${key}`;
  const view = useSyncExternalStore(
    subscribe,
    () => (localStorage.getItem(storageKey) as View | null) ?? fallback,
    () => fallback,
  );
  const set = (v: View) => {
    localStorage.setItem(storageKey, v);
    listeners.forEach((l) => l());
  };
  return [view === "quadro" ? "quadro" : "lista", set];
}

/** A chave Lista | Quadro. */
export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex rounded-[10px] bg-papel-escuro p-1" role="radiogroup" aria-label="Como mostrar">
      {(["lista", "quadro"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={view === v}
          onClick={() => onChange(v)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${view === v ? "bg-white font-medium text-tinta shadow-sm" : "text-tinta-suave hover:text-tinta"}`}
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {v === "lista" ? <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" /> : <path d="M2.5 2.5h3v11h-3zM6.5 2.5h3v7h-3zM10.5 2.5h3v9h-3z" />}
          </svg>
          {v === "lista" ? "Lista" : "Quadro"}
        </button>
      ))}
    </div>
  );
}
