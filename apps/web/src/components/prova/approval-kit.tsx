"use client";

import { useState } from "react";
import { kitMessage, type KitResult } from "@/lib/prova/kit";
import { ui } from "../ui";

type Props = {
  /** Captura frente, costas e lado e grava o vídeo; null se a Prova não estava pronta. */
  build: () => Promise<KitResult | null>;
  /** Kit pronto: leva a pessoa ao "Gerar link". */
  onReady: () => void;
  disabled: boolean;
};

/**
 * Kit de aprovação em um clique: as três capturas e o vídeo 360° de uma vez.
 * Não gera o link sozinho: a pessoa ainda escolhe a validade e confere as imagens.
 */
export function ApprovalKit({ build, onReady, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setNote(null);
    try {
      const r = await build();
      const msg = r ? kitMessage(r) : { ok: false, text: "A Prova ainda está montando. Espere a roupa assentar e tente de novo." };
      setNote(msg);
      if (msg.ok) onReady();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-tinta/10 pt-3" data-approval-kit>
      <button type="button" className={`${ui.buttonAccent} w-full`} onClick={run} disabled={disabled || busy} data-approval-kit-build>
        {busy ? "Montando o kit…" : "Montar kit de aprovação"}
      </button>
      <p className="text-[11px] text-tinta-suave">Captura frente, costas e lado e grava o vídeo 360° de uma vez. As capturas de antes saem.</p>
      {note && (
        <p className={note.ok ? "text-[11px] text-tinta-suave" : "text-[11px] text-linha"} role="status" data-approval-kit-note>
          {note.text}
        </p>
      )}
    </div>
  );
}
