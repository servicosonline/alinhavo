"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SideProva } from "@/components/editor/prova-side";
import { saveForProva } from "@/lib/prova/handoff";
import { measurementsBySize, type ChartSizeRow, type MeasurementRow } from "@/lib/prova/measurements";
import { PatternEditor, type ChartGrade, type EditorRailItem } from "@/components/editor/pattern-editor";
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
  trail,
  rail,
  approvalHref,
  chartMeasurements,
  fabricComposition,
  exportLocked = null,
}: {
  orgId: string;
  patternId: string;
  name: string;
  initialVersion: number;
  initialDocument: PatternDocument;
  readOnly: boolean;
  chartGrade: ChartGrade | null;
  trail?: React.ReactNode;
  rail?: EditorRailItem[];
  approvalHref?: string;
  /** Tamanhos e medidas da tabela ligada (vazios sem tabela: o corpo estima). */
  chartMeasurements: { sizes: ChartSizeRow[]; rows: MeasurementRow[] };
  /** Composição do tecido do produto ligado ao molde (null sem produto ou sem tecido). */
  fabricComposition: string | null;
  /** Exportar fora do plano (aviso no menu). */
  exportLocked?: string | null;
}) {
  const [version, setVersion] = useState(initialVersion);
  // Prova ao lado: as medidas casam com a grade do molde como está na tela.
  const sideProva = useMemo<SideProva>(
    () => ({ measurementsFor: (doc) => measurementsBySize(doc.sizes, chartMeasurements.sizes, chartMeasurements.rows).bySize }),
    [chartMeasurements],
  );
  const router = useRouter();
  return (
    <PatternEditor
      initialDocument={initialDocument}
      title={name}
      subtitle={version === 0 ? "Ainda sem versão salva" : `Versão ${version}`}
      readOnly={readOnly}
      chartGrade={chartGrade}
      trail={trail}
      rail={rail}
      approvalHref={version === 0 ? undefined : approvalHref}
      sideProva={sideProva}
      fabricComposition={fabricComposition}
      exportLocked={exportLocked}
      onTryOn={
        version === 0
          ? undefined // a Prova do painel parte de uma versão salva
          : (doc) => {
              // O que está na tela, mesmo sem salvar; vale só para esta versão.
              saveForProva(doc, patternId, version);
              router.push(`/painel/${orgId}/moldes/${patternId}/prova`);
            }
      }
      onSave={async (doc, message) => {
        const result = await savePatternVersion(orgId, patternId, version, doc, message);
        if (result.ok) setVersion(result.version);
        return result;
      }}
    />
  );
}
