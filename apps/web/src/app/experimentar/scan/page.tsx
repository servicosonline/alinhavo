import type { Metadata } from "next";
import { DemoHeader } from "@/components/demo-header";
import { PageHeader } from "@/components/page-shell";
import { ScanStudio } from "@/components/scan/scan-studio";
import { TrialNudge } from "@/components/trial-nudge";

export const metadata: Metadata = {
  title: "Experimente o Scan de moldes · Alinhavo",
  description: "Fotografe um molde de papel ao lado da folha de marcadores e baixe a peça em DXF. A foto é lida no navegador; nada é salvo.",
};

export default function ExperimentarScanPage() {
  return (
    <div className="flex flex-1 flex-col bg-papel">
      <DemoHeader current="scan" />
      <main className="papel-milimetrado flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
          <PageHeader
            eyebrow="Do papel para o molde"
            title="Scan de molde de papel"
            description="Imprima a folha de marcadores, fotografe o molde ao lado dela e baixe a peça em DXF para abrir no seu CAD. A foto é lida no seu navegador e nada é salvo."
          />
          <ScanStudio mode={{ kind: "demo" }} />
          <TrialNudge text="Na conta, a peça escaneada vira molde salvo, com versões, Prova 3D e encaixe. Teste 15 dias sem cartão." />
        </div>
      </main>
    </div>
  );
}
