import type { Metadata } from "next";
import Link from "next/link";
import { ProvaDemo } from "./prova-demo";

export const metadata: Metadata = {
  title: "Prova 3D · Alinhavo",
  description: "Veja o molde costurado e vestido num manequim, simulado no seu navegador. Nada é salvo.",
};

export default function ProvaPage() {
  return (
    <main className="flex flex-1 flex-col bg-papel">
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-display text-xl font-semibold tracking-tight">
              Alinhavo
            </Link>
            <h1 className="text-sm text-tinta-suave">Prova 3D</h1>
          </div>
          <Link href="/experimentar" className="text-sm text-tinta-suave hover:text-tinta">
            ← Voltar ao editor
          </Link>
        </header>
        <ProvaDemo />
      </div>
    </main>
  );
}
