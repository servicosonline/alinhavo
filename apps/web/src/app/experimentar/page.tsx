import type { Metadata } from "next";
import { DemoHeader } from "@/components/demo-header";
import { EditorDemo } from "./editor-demo";

export const metadata: Metadata = {
  title: "Experimente o editor de moldes · Alinhavo",
  description: "Edite uma saia, uma calça ou um conjunto calça + top no navegador e prove em 3D. Nada é salvo.",
};

export default function ExperimentarPage() {
  return (
    <div className="flex flex-1 flex-col bg-papel">
      <DemoHeader current="editor" />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-5 sm:px-6">
        <EditorDemo />
        <p className="mt-4 text-xs text-tinta-suave">
          Arraste pontos e partes; clique num segmento para ver o comprimento, virar curva ou inserir ponto. Roda do mouse
          aproxima; arraste o fundo para mover a vista. Ctrl+Z desfaz.
        </p>
      </main>
    </div>
  );
}
