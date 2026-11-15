"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ProvaSaveMode } from "@/components/prova/adjust-panel";
import { ProvaStudio } from "@/components/prova/prova-studio";
import { lookExamples } from "@/lib/examples";
import { demoMeasurements } from "@/lib/prova/demo-measurements";
import { loadForProva, storedForProva } from "@/lib/prova/handoff";
import { samplePattern } from "@/lib/sample-pattern";

const noSubscribe = () => () => {};
/** Sem login não há onde salvar: o ajuste vale só na tela. */
const LOCAL: ProvaSaveMode = { kind: "local" };

/** Prova de demonstração: o molde que veio do editor (nesta aba) ou a saia de exemplo. */
export function ProvaDemo() {
  // Lido só no navegador; no servidor, o exemplo.
  const stored = useSyncExternalStore(noSubscribe, () => storedForProva("demo"), () => null);
  const fromEditor = useMemo(() => (stored ? loadForProva("demo") : null), [stored]);
  const doc = useMemo(() => fromEditor ?? samplePattern(), [fromEditor]);
  const measurements = useMemo(() => demoMeasurements(doc), [doc]);
  // Roupas de exemplo para vestir junto (look).
  const lookOptions = useMemo(() => lookExamples(), []);
  return (
    <>
      <p className="mb-3 text-xs text-tinta-suave">
        {fromEditor ? "Provando o molde do editor." : "Provando a saia de exemplo."} Tabela de medidas de demonstração.
      </p>
      <ProvaStudio doc={doc} measurementsBySize={measurements} saveMode={LOCAL} lookOptions={lookOptions} />
    </>
  );
}
