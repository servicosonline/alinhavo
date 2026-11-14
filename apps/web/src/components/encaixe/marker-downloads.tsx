"use client";

import type { MarkerLayout } from "@alinhavo/nesting";
import { useState } from "react";
import { ui } from "@/components/ui";

type Format = "dxf" | "plt";

function download(text: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Baixa o risco salvo em DXF (CAD, plotter) ou PLT/HPGL (plotter e
 * cortadora). Gerado no navegador, sem passar pelo servidor.
 */
export function MarkerDownloads({ layout, fileBase, title }: { layout: MarkerLayout; fileBase: string; title: string }) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (format: Format) => {
    setBusy(format);
    setError(null);
    try {
      if (format === "dxf") {
        const { exportMarkerDxf } = await import("@alinhavo/export/marker-dxf");
        download(exportMarkerDxf(layout, { title }), `${fileBase}.dxf`, "application/dxf");
      } else {
        const { exportMarkerPlt } = await import("@alinhavo/export/marker-plt");
        download(exportMarkerPlt(layout), `${fileBase}.plt`, "application/vnd.hp-hpgl");
      }
    } catch {
      setError("Não foi possível gerar o arquivo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-marker-downloads>
      <button type="button" className={ui.buttonGhost} disabled={busy !== null} onClick={() => run("dxf")} data-download="dxf">
        {busy === "dxf" ? "Gerando…" : "Baixar DXF"}
      </button>
      <button type="button" className={ui.buttonGhost} disabled={busy !== null} onClick={() => run("plt")} data-download="plt">
        {busy === "plt" ? "Gerando…" : "Baixar PLT (plotter)"}
      </button>
      {error && (
        <span className="text-xs text-linha" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
