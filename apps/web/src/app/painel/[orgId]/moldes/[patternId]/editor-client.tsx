"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useState } from "react";
import { PatternEditor, type ChartGrade } from "@/components/editor/pattern-editor";
import { savePatternVersion } from "../actions";

/** Liga o editor ao servidor e acompanha a versão atual (para detectar conflito ao salvar). */
export function EditorClient({
  orgId,
  patternId,
  name,
  initialVersion,
  initialDocument,
  readOnly,
  chartGrade,
}: {
  orgId: string;
  patternId: string;
  name: string;
  initialVersion: number;
  initialDocument: PatternDocument;
  readOnly: boolean;
  chartGrade: ChartGrade | null;
}) {
  const [version, setVersion] = useState(initialVersion);
  return (
    <PatternEditor
      initialDocument={initialDocument}
      title={name}
      subtitle={version === 0 ? "Ainda sem versão salva" : `Versão ${version}`}
      readOnly={readOnly}
      chartGrade={chartGrade}
      onSave={async (doc, message) => {
        const result = await savePatternVersion(orgId, patternId, version, doc, message);
        if (result.ok) setVersion(result.version);
        return result;
      }}
    />
  );
}
