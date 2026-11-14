"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ProvaStudio } from "@/components/prova/prova-studio";
import { demoMeasurements } from "@/lib/prova/demo-measurements";
import { loadForProva, storedForProva } from "@/lib/prova/handoff";
import { samplePattern } from "@/lib/sample-pattern";

const noSubscribe = () => () => {};

/** Prova de demonstração: o molde que veio do editor (nesta aba) ou a saia de exemplo. */
export function ProvaDemo() {
  // Lido só no navegador; no servidor, o exemplo.
  const stored = useSyncExternalStore(noSubscribe, () => storedForProva("demo"), () => null);
  const fromEditor = useMemo(() => (stored ? loadForProva("demo") : null), [stored]);
  const doc = useMemo(() => fromEditor ?? samplePattern(), [fromEditor]);
  const measurements = useMemo(() => demoMeasurements(doc), [doc]);
  return (
    <>
      <p className="mb-3 text-xs text-tinta-suave">
        {fromEditor ? "Provando o molde do editor." : "Provando a saia de exemplo."} Tabela de medidas de demonstração.
      </p>
      <ProvaStudio doc={doc} measurementsBySize={measurements} />
    </>
  );
}
