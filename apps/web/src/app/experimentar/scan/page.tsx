import type { Metadata } from "next";
import Link from "next/link";
import { ScanStudio } from "@/components/scan/scan-studio";
import { ui } from "@/components/ui";

export const metadata: Metadata = {
  title: "Experimente o Scan de moldes · Alinhavo",
  description: "Fotografe um molde de papel ao lado da folha de marcadores e baixe a peça em DXF. A foto é lida no navegador; nada é salvo.",
};

export default function ExperimentarScanPage() {
  return (
    <main className="flex flex-1 flex-col bg-papel">
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-4 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/experimentar" className="font-display text-xl font-semibold tracking-tight">
            Alinhavo
          </Link>
          <Link href="/entrar" className="text-sm text-tinta-suave hover:text-tinta">
            Entrar para salvar →
          </Link>
        </header>
        <div>
          <h1 className={ui.h1}>Scan de molde de papel</h1>
          <p className={`mt-1 ${ui.muted}`}>A foto é lida no seu navegador e nada é salvo. Baixe a peça em DXF para abrir no seu CAD.</p>
        </div>
        <ScanStudio mode={{ kind: "demo" }} />
      </div>
    </main>
  );
}
