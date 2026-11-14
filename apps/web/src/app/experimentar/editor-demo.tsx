"use client";

import { useRouter } from "next/navigation";
import { PatternEditor } from "@/components/editor/pattern-editor";
import { saveForProva } from "@/lib/prova/handoff";
import { samplePattern } from "@/lib/sample-pattern";

/** Editor de demonstração com o botão "Provar" (o molde vai para a Prova pela memória da aba). */
export function EditorDemo() {
  const router = useRouter();
  return (
    <PatternEditor
      initialDocument={samplePattern()}
      title="Saia-base"
      subtitle="Exemplo"
      onTryOn={(doc) => {
        saveForProva(doc);
        router.push("/experimentar/prova");
      }}
    />
  );
}
