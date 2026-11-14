import type { Metadata } from "next";
import Link from "next/link";
import { EditorDemo } from "./editor-demo";

export const metadata: Metadata = {
  title: "Experimente o editor de moldes · Alinhavo",
  description: "Edite uma saia, uma calça ou um conjunto calça + top no navegador e prove em 3D. Nada é salvo.",
};

export default function ExperimentarPage() {
  return (
    <main className="flex flex-1 flex-col bg-papel">
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6">
        <header className="mb-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Alinhavo
          </Link>
          <Link href="/entrar" className="text-sm text-tinta-suave hover:text-tinta">
            Entrar para salvar →
          </Link>
        </header>
        <EditorDemo />
        <p className="mt-4 text-xs text-tinta-suave">
          Arraste pontos e partes; clique num segmento para ver o comprimento, virar curva ou inserir ponto. Roda do mouse
          aproxima; arraste o fundo para mover a vista. Ctrl+Z desfaz.
        </p>
      </div>
    </main>
  );
}
