"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useState } from "react";
import { fileSlug } from "@/lib/file-slug";
import { ui } from "../ui";

type Format = "pdf" | "dxf";

function download(data: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ExportMenu({ doc, title, disabledReason }: { doc: PatternDocument; title: string; disabledReason: string | null }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("pdf");
  const [size, setSize] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = size && (size === "*" || doc.sizes.includes(size)) ? size : doc.baseSize;
  const pdfSize = chosen === "*" ? doc.baseSize : chosen;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const slug = fileSlug(title);
      if (format === "pdf") {
        const { exportPdf } = await import("@alinhavo/export/pdf");
        const bytes = await exportPdf(doc, { title, size: pdfSize });
        download(bytes as BlobPart, "application/pdf", `${slug}-${fileSlug(pdfSize)}.pdf`);
      } else {
        const { exportDxfAama } = await import("@alinhavo/export/dxf");
        const sizes = chosen === "*" ? doc.sizes : [chosen];
        const text = exportDxfAama(doc, { styleName: title, sizes });
        download(text, "application/dxf", `${slug}${chosen === "*" ? "" : `-${fileSlug(chosen)}`}.dxf`);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível exportar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={ui.buttonGhost}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        disabled={!!disabledReason}
        title={disabledReason ?? undefined}
      >
        Exportar
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Exportar molde"
          className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-lg border border-tinta/15 bg-white p-4 text-sm shadow-lg"
        >
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium">Formato</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="formato" checked={format === "pdf"} onChange={() => setFormat("pdf")} />
              <span>
                PDF em folhas A4
                <span className="block text-xs text-tinta-suave">Escala real, para imprimir em casa e emendar.</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="formato" checked={format === "dxf"} onChange={() => setFormat("dxf")} />
              <span>
                DXF-AAMA
                <span className="block text-xs text-tinta-suave">Para plotter, corte e outros CADs de moda.</span>
              </span>
            </label>
          </fieldset>
          <label className="block text-xs">
            <span className="font-medium">Tamanho</span>
            <select className={`${ui.input} text-sm`} value={chosen} onChange={(e) => setSize(e.target.value)}>
              {format === "dxf" && <option value="*">Todos ({doc.sizes.join(", ")})</option>}
              {doc.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {s === doc.baseSize ? " (base)" : ""}
                </option>
              ))}
            </select>
          </label>
          {format === "pdf" && chosen === "*" && (
            <p className="text-xs text-tinta-suave">O PDF sai um tamanho por vez: vai o {doc.baseSize}.</p>
          )}
          {error && (
            <p className={ui.error} role="alert">
              {error}
            </p>
          )}
          <button type="button" className={`${ui.buttonPrimary} w-full`} onClick={run} disabled={busy}>
            {busy ? "Gerando…" : "Baixar arquivo"}
          </button>
        </div>
      )}
    </div>
  );
}
