"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PatternEditor } from "@/components/editor/pattern-editor";
import { ui } from "@/components/ui";
import { EXAMPLES, exampleDocument, isExampleId, type ExampleId } from "@/lib/examples";
import type { SideProva } from "@/components/editor/prova-side";
import { demoMeasurements } from "@/lib/prova/demo-measurements";
import { saveForProva } from "@/lib/prova/handoff";

/** Prova ao lado com a tabela de demonstração (a mesma do /experimentar/prova). */
const DEMO_PROVA: SideProva = { measurementsFor: demoMeasurements };

/**
 * Editor de demonstração com os moldes de exemplo e o botão "Provar" (o
 * molde vai para a Prova pela memória da aba). Trocar o exemplo recomeça o
 * editor (nada é salvo).
 */
export function EditorDemo() {
  const router = useRouter();
  const [example, setExample] = useState<ExampleId>("saia");
  const doc = useMemo(() => exampleDocument(example), [example]);
  const current = EXAMPLES.find((e) => e.id === example)!;
  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-tinta-suave">Exemplo</span>
        <select
          className={ui.select}
          value={example}
          onChange={(e) => isExampleId(e.target.value) && setExample(e.target.value)}
          data-example
        >
          {EXAMPLES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-tinta-suave">{current.description} Trocar de exemplo descarta as alterações.</span>
      </label>
      <PatternEditor
        key={example}
        initialDocument={doc}
        title={current.name}
        subtitle="Exemplo"
        trail={<span>Demonstração › Molde</span>}
        rail={[
          { icon: "moldes", label: "Molde", active: true },
          { icon: "prova", label: "Prova 3D", href: "/experimentar/prova" },
          { icon: "scan", label: "Scan", href: "/experimentar/scan" },
        ]}
        sideProva={DEMO_PROVA}
        onTryOn={(d) => {
          saveForProva(d);
          router.push("/experimentar/prova");
        }}
      />
    </div>
  );
}
