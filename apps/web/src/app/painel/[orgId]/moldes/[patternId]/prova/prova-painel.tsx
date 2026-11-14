"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { ProvaSaveMode } from "@/components/prova/adjust-panel";
import type { ApprovalRequester } from "@/components/prova/approval-request";
import { ProvaStudio } from "@/components/prova/prova-studio";
import { loadForProva, storedForProva } from "@/lib/prova/handoff";
import type { LookOption } from "@/lib/prova/look";
import { savePatternVersion } from "../../actions";
import { requestApproval } from "./actions";

const noSubscribe = () => () => {};

/**
 * Prova do molde no painel: as alterações ainda não salvas que vieram do
 * editor nesta aba (se partiram da versão atual) ou a versão salva. Um
 * ajuste na Prova grava a versão seguinte, com origem "prova".
 */
export function ProvaPainel({
  orgId,
  patternId,
  version: initialVersion,
  savedDoc: initialDoc,
  measurementsBySize,
  canEdit,
  lookOptions,
}: {
  orgId: string;
  patternId: string;
  version: number;
  savedDoc: PatternDocument;
  measurementsBySize: Record<string, Record<string, number>>;
  canEdit: boolean;
  /** Outros moldes da organização para o look (versão atual de cada um). */
  lookOptions: LookOption[];
}) {
  const [saved, setSaved] = useState({ version: initialVersion, doc: initialDoc });
  const stored = useSyncExternalStore(noSubscribe, () => storedForProva(patternId), () => null);
  // A cópia do editor só vale para a versão de onde partiu: depois de salvar, some.
  const unsaved = useMemo(() => (stored ? loadForProva(patternId, saved.version) : null), [stored, patternId, saved.version]);
  const doc = unsaved ?? saved.doc;

  const saveMode = useMemo<ProvaSaveMode>(
    () =>
      canEdit
        ? {
            kind: "save",
            nextVersion: saved.version + 1,
            unsaved: !!unsaved,
            onSave: async (next, message) => {
              const result = await savePatternVersion(orgId, patternId, saved.version, next, message, "prova");
              if (result.ok) setSaved({ version: result.version, doc: next });
              return result;
            },
          }
        : { kind: "readonly" },
    [canEdit, saved.version, unsaved, orgId, patternId],
  );

  // A aprovação aponta para uma versão salva: com alterações do editor por salvar, não dá.
  const approval = useMemo<ApprovalRequester | undefined>(
    () =>
      canEdit
        ? {
            blocked: unsaved ? "Salve as alterações do editor (ou ajuste e salve aqui) antes de pedir aprovação." : null,
            request: (settings, captures, days) => requestApproval(orgId, patternId, saved.version, settings, captures, days),
          }
        : undefined,
    [canEdit, unsaved, orgId, patternId, saved.version],
  );

  return (
    <>
      <p className="text-xs text-tinta-suave" role="status">
        {unsaved ? "Provando as alterações ainda não salvas do editor." : `Provando a versão ${saved.version}.`}
      </p>
      <ProvaStudio doc={doc} measurementsBySize={measurementsBySize} saveMode={saveMode} approval={approval} lookOptions={lookOptions} />
    </>
  );
}
