import type { Metadata } from "next";
import Link from "next/link";
import { DemoHeader } from "@/components/demo-header";
import { Trail } from "@/components/page-shell";
import { TrialNudge } from "@/components/trial-nudge";
import { ProvaDemo } from "./prova-demo";

export const metadata: Metadata = {
  title: "Prova 3D · Alinhavo",
  description: "Veja o molde costurado e vestido num manequim, simulado no seu navegador. Nada é salvo.",
};

export default function ProvaPage() {
  return (
    <div className="flex flex-1 flex-col bg-papel">
      <DemoHeader current="prova" />
      <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <Trail items={[{ label: "Molde", href: "/experimentar" }, { label: "Prova 3D" }]} />
            <h1 className="font-display text-2xl font-semibold tracking-tight">Prova 3D</h1>
          </div>
          <Link href="/experimentar" className="text-sm text-tinta-suave hover:text-tinta">
            Voltar ao editor
          </Link>
        </div>
        <TrialNudge text="Crie a conta e teste 15 dias com os seus moldes e a sua tabela de medidas, sem cartão." />
        <ProvaDemo />
      </main>
    </div>
  );
}
