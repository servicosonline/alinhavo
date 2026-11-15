"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { pickVideoType, VIDEO_SECONDS } from "@/lib/prova/video";
import { ui } from "../ui";

type Props = {
  /** Grava a volta e devolve o vídeo (a cena faz o trabalho; `type` é o formato escolhido). */
  record: (type: string, onProgress: (fraction: number) => void) => Promise<Blob>;
  /** Nome do arquivo para baixar, pelo formato gravado. */
  fileName: (type: string) => string;
  disabled: boolean;
  /** Avisa o vídeo pronto (ou null ao começar de novo), para ir junto no pedido de aprovação. */
  onChange?: (video: Blob | null) => void;
};

const noSubscribe = () => () => {};
/** O formato que este navegador grava (null no servidor ou sem gravação). */
function useVideoType(): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => (typeof MediaRecorder === "undefined" ? null : pickVideoType((t) => MediaRecorder.isTypeSupported(t))),
    () => null,
  );
}

type State =
  | { kind: "idle" }
  | { kind: "recording"; progress: number }
  | { kind: "done"; url: string; type: string; size: number }
  | { kind: "error"; message: string };

/**
 * Vídeo 360° da Prova: grava uma volta da câmera em torno do corpo e deixa
 * assistir e baixar. Fica só no navegador (não vai para o servidor).
 */
export function VideoPanel({ record, fileName, disabled, onChange }: Props) {
  const type = useVideoType();
  const [state, setState] = useState<State>({ kind: "idle" });

  // O vídeo é um endereço local (blob:): libera ao trocar ou sair.
  useEffect(() => {
    if (state.kind !== "done") return;
    return () => URL.revokeObjectURL(state.url);
  }, [state]);

  async function start() {
    if (!type) return;
    setState({ kind: "recording", progress: 0 });
    onChange?.(null);
    try {
      const blob = await record(type, (progress) => setState({ kind: "recording", progress }));
      setState({ kind: "done", url: URL.createObjectURL(blob), type: blob.type || type, size: blob.size });
      onChange?.(blob);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "A gravação falhou." });
    }
  }

  const recording = state.kind === "recording";
  return (
    <div className={`${ui.card} space-y-3 p-4`} data-video-panel>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium">Vídeo 360°</h2>
        <span className="text-[11px] text-tinta-suave">{VIDEO_SECONDS} s, uma volta</span>
      </div>
      {!type ? (
        <p className="text-[11px] text-tinta-suave">Este navegador não grava vídeo da tela. Use o Chrome, o Edge ou o Firefox.</p>
      ) : (
        <button type="button" className={`${ui.buttonGhost} w-full`} onClick={start} disabled={disabled || recording} data-video-record>
          {recording ? `Gravando… ${Math.round(state.progress * 100)}%` : state.kind === "done" ? "Gravar de novo" : "Gravar vídeo 360°"}
        </button>
      )}
      {recording && (
        <div className="h-1.5 overflow-hidden rounded-full bg-tinta/10" aria-hidden>
          <div className="h-full bg-tinta transition-[width]" style={{ width: `${Math.round(state.progress * 100)}%` }} />
        </div>
      )}
      {state.kind === "done" && (
        <div className="space-y-2">
          <video src={state.url} controls loop playsInline className="aspect-[3/4] w-full rounded border border-tinta/15 bg-papel" data-video />
          <a href={state.url} download={fileName(state.type)} className={`${ui.buttonPrimary} w-full`} data-video-download>
            Baixar ({(state.size / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB)
          </a>
        </div>
      )}
      {state.kind === "error" && (
        <p className="text-[11px] text-linha" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
