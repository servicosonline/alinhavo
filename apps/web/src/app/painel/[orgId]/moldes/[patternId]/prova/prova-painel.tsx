"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useMemo, useSyncExternalStore } from "react";
import { ProvaStudio } from "@/components/prova/prova-studio";
import { loadForProva, storedForProva } from "@/lib/prova/handoff";

const noSubscribe = () => () => {};

/**
 * Prova do molde no painel: as alterações ainda não salvas que vieram do
 * editor nesta aba (se partiram da versão atual) ou a versão salva.
 */
export function ProvaPainel({
  patternId,
  version,
  savedDoc,
  measurementsBySize,
}: {
  patternId: string;
  version: number;
  savedDoc: PatternDocument;
  measurementsBySize: Record<string, Record<string, number>>;
}) {
  const stored = useSyncExternalStore(noSubscribe, () => storedForProva(patternId), () => null);
  const unsaved = useMemo(() => (stored ? loadForProva(patternId, version) : null), [stored, patternId, version]);
  const doc = unsaved ?? savedDoc;
  return (
    <>
      <p className="text-xs text-tinta-suave" role="status">
        {unsaved ? "Provando as alterações ainda não salvas do editor." : `Provando a versão ${version}.`}
      </p>
      <ProvaStudio doc={doc} measurementsBySize={measurementsBySize} />
    </>
  );
}
