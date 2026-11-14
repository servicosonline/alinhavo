"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ProvaStudio } from "@/components/prova/prova-studio";
import { demoMeasurements } from "@/lib/prova/demo-measurements";
import { loadForProva } from "@/lib/prova/handoff";
import { samplePattern } from "@/lib/sample-pattern";

const noSubscribe = () => () => {};

/** Prova de demonstração: o molde que veio do editor (nesta aba) ou a saia de exemplo. */
export function ProvaDemo() {
  // Lido só no navegador; no servidor, o exemplo.
  const stored = useSyncExternalStore(noSubscribe, () => sessionStorageSnapshot(), () => null);
  const doc = useMemo(() => (stored ? (loadForProva() ?? samplePattern()) : samplePattern()), [stored]);
  const measurements = useMemo(() => demoMeasurements(doc), [doc]);
  return (
    <>
      <p className="mb-3 text-xs text-tinta-suave">
        {stored ? "Provando o molde do editor." : "Provando a saia de exemplo."} Tabela de medidas de demonstração.
      </p>
      <ProvaStudio doc={doc} measurementsBySize={measurements} />
    </>
  );
}

function sessionStorageSnapshot(): string | null {
  try {
    return sessionStorage.getItem("alinhavo:prova:molde");
  } catch {
    return null;
  }
}
