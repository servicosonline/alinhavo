"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { ProvaSaveMode } from "../prova/adjust-panel";

/** A Prova (three, Worker) só carrega quando a tela dividida abre. */
const ProvaStudio = dynamic(() => import("../prova/prova-studio").then((m) => m.ProvaStudio), {
  ssr: false,
  loading: () => <SideMessage>Abrindo a Prova…</SideMessage>,
});

/** Espera depois da última edição para remontar a Prova (arrastar um ponto não remonta a cada passo). */
const RESEW_DELAY_MS = 600;

/** O que o editor precisa para mostrar a Prova ao lado. */
export type SideProva = {
  /** Medidas por tamanho para o molde como está na tela (a grade pode mudar no editor). */
  measurementsFor: (doc: PatternDocument) => Record<string, Record<string, number>>;
};

type Props = {
  doc: PatternDocument;
  /** O molde pode ir para a Prova (sem erros e com alguma parte com lado do corpo). */
  ready: boolean;
  /** Por que não pode, quando não pode. */
  notReady: string;
  readOnly: boolean;
  prova: SideProva;
  /** Painel lateral do editor, onde ficam os controles da Prova. */
  controlsTarget: HTMLElement | null;
  /** Ajuste feito na Prova, levado ao editor como uma edição. */
  onApply: (doc: PatternDocument) => void;
};

function SideMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[60vh] min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-tinta/20 bg-papel p-6 text-center text-sm text-tinta-suave lg:h-[calc(100vh-15rem)]">
      <p>{children}</p>
    </div>
  );
}

/**
 * Prova 3D ao lado do editor: veste o molde como está na tela (sem salvar) e
 * remonta depois de uma pausa nas edições. Enquanto o molde tem erro, fica a
 * última versão que deu para provar, com o aviso.
 */
export function ProvaSide({ doc, ready, notReady, readOnly, prova, controlsTarget, onApply }: Props) {
  const [shown, setShown] = useState<PatternDocument | null>(ready ? doc : null);
  useEffect(() => {
    if (!ready || doc === shown) return;
    const t = setTimeout(() => setShown(doc), shown ? RESEW_DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [doc, ready, shown]);

  const { measurementsFor } = prova;
  const measurements = useMemo(() => (shown ? measurementsFor(shown) : {}), [shown, measurementsFor]);
  const saveMode = useMemo<ProvaSaveMode>(
    () => (readOnly ? { kind: "readonly" } : { kind: "editor", onApply: (next) => onApply(next) }),
    [readOnly, onApply],
  );

  if (!shown) return <SideMessage>{notReady}</SideMessage>;
  return (
    <div className="relative min-w-0" data-prova-side>
      {(!ready || doc !== shown) && (
        <p
          className="absolute inset-x-3 bottom-3 z-10 rounded-md bg-white/90 px-3 py-1.5 text-center text-xs text-tinta-suave shadow-sm"
          role="status"
          data-prova-side-state={ready ? "pending" : "blocked"}
        >
          {ready ? "Costurando a alteração…" : `Mostrando a última versão que deu para provar. ${notReady}`}
        </p>
      )}
      <ProvaStudio doc={shown} measurementsBySize={measurements} saveMode={saveMode} controlsTarget={controlsTarget} />
    </div>
  );
}
