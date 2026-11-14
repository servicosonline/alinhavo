"use client";

import { flattenOutline, type Piece } from "@alinhavo/geometry";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ui } from "@/components/ui";
import { createPatternFromScan } from "@/app/painel/[orgId]/moldes/actions";
import { fileSlug } from "@/lib/file-slug";
import { MAX_SCANNED_PIECES, photoSize, scannedDocument, type ScannedPiece } from "@/lib/scan/document";
import type { ScanReply, ScanRequest } from "@/lib/scan/protocol";
import { formatCm, parseCmToMm } from "@/lib/units";

type Mode = { kind: "panel"; orgId: string } | { kind: "demo" };
type Done = Extract<ScanReply, { type: "done" }>;
type Status = { kind: "idle" } | { kind: "reading" } | { kind: "error"; message: string } | { kind: "done"; result: Done };

function download(data: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function pieceSize(piece: Piece) {
  const pts = flattenOutline(piece).polygon;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** Foto endireitada com o contorno achado por cima (em pixels da prévia). */
function Review({ result }: { result: Done }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { preview: pv } = result;
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(pv.width, pv.height);
    pv.gray.forEach((v, i) => {
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(img, 0, 0);
  }, [pv]);
  const toPx = (x: number, y: number) => `${(x + result.offsetMm.x - pv.originX) / pv.mmPerPx},${(y + result.offsetMm.y - pv.originY) / pv.mmPerPx}`;
  const outline = flattenOutline(result.piece).polygon.map((p) => toPx(p.x, p.y)).join(" ");
  const piques = Object.entries(result.piece.points).filter(([id]) => id.startsWith("pique"));
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-tinta/15 bg-tinta" data-scan-review>
      <canvas ref={canvasRef} width={pv.width} height={pv.height} className="block h-auto w-full" />
      <svg viewBox={`0 0 ${pv.width} ${pv.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <polygon points={outline} fill="rgba(196, 72, 48, 0.18)" stroke="#c44830" strokeWidth={Math.max(1.5, pv.width / 400)} />
        {piques.map(([id, p]) => {
          const [cx, cy] = toPx(p.x, p.y).split(",").map(Number);
          return <circle key={id} cx={cx} cy={cy} r={Math.max(4, pv.width / 150)} fill="#1f6f8b" />;
        })}
      </svg>
    </div>
  );
}

/**
 * Tela do Scan: folha de marcadores, foto, revisão e as peças achadas. No
 * painel vira um molde novo; no /experimentar, baixa o DXF (nada é salvo).
 */
export function ScanStudio({ mode }: { mode: Mode }) {
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pieceName, setPieceName] = useState("");
  const [pieces, setPieces] = useState<ScannedPiece[]>([]);
  const [seam, setSeam] = useState("0");
  const [patternName, setPatternName] = useState("");
  const [message, setMessage] = useState<{ error?: string } | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    const w = new Worker(new URL("../../lib/scan/scan.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<ScanReply>) => {
      if (e.data.id !== seq.current) return;
      if (e.data.type === "failed") setStatus({ kind: "error", message: e.data.error });
      else setStatus({ kind: "done", result: e.data });
    };
    w.onerror = () => setStatus({ kind: "error", message: "O Scan parou com um erro. Tente outra foto." });
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const read = async (file: File) => {
    setStatus({ kind: "reading" });
    setMessage(null);
    try {
      const bitmap = await createImageBitmap(file);
      const size = photoSize(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);
      bitmap.close();
      const { data } = ctx.getImageData(0, 0, size.width, size.height);
      const id = ++seq.current;
      workerRef.current?.postMessage({ type: "scan", id, width: size.width, height: size.height, data: data.buffer } satisfies ScanRequest, [data.buffer]);
    } catch {
      setStatus({ kind: "error", message: "Não foi possível abrir essa imagem. Use uma foto JPG ou PNG." });
    }
  };

  const seamMm = useMemo(() => parseCmToMm(seam.trim() === "" ? "0" : seam), [seam]);
  const seamOk = seamMm !== null && seamMm >= 0 && seamMm <= 50;
  const doc = useMemo(() => (pieces.length && seamOk ? scannedDocument(pieces, seamMm!) : null), [pieces, seamOk, seamMm]);

  const keep = () => {
    if (status.kind !== "done" || pieces.length >= MAX_SCANNED_PIECES) return;
    setPieces((list) => [...list, { name: pieceName.trim() || `Peça ${list.length + 1}`, piece: status.result.piece }]);
    setPieceName("");
    setStatus({ kind: "idle" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = () => {
    if (!doc || mode.kind !== "panel") return;
    startSaving(async () => {
      const r = await createPatternFromScan(mode.orgId, patternName, doc);
      if (r?.error) setMessage({ error: r.error });
    });
  };

  const downloadSheet = async () => {
    const [{ exportScanSheetPdf }, { A4_SHEET }] = await Promise.all([import("@alinhavo/export/scan-sheet-pdf"), import("@alinhavo/scan")]);
    download((await exportScanSheetPdf(A4_SHEET)) as BlobPart, "application/pdf", "alinhavo-folha-de-marcadores.pdf");
  };

  const downloadDxf = async () => {
    if (!doc) return;
    const { exportDxfAama } = await import("@alinhavo/export/dxf");
    const title = patternName.trim() || "Molde escaneado";
    download(exportDxfAama(doc, { styleName: title, sizes: [doc.baseSize] }), "application/dxf", `${fileSlug(title)}.dxf`);
  };

  const result = status.kind === "done" ? status.result : null;
  const size = result ? pieceSize(result.piece) : null;

  return (
    <div className="space-y-6">
      <section className={`${ui.card} space-y-2`} aria-labelledby="folha">
        <h2 id="folha" className={ui.h2}>
          1. Folha de marcadores
        </h2>
        <p className={ui.muted}>
          Imprima em tamanho real (100%) e confira o quadrado de 50 mm com a régua. Ponha o molde de papel ao lado da folha, sem encostar, sobre um fundo
          bem contrastante, e fotografe de cima com os dois inteiros na foto.
        </p>
        <button type="button" className={ui.buttonGhost} onClick={downloadSheet} data-download-sheet>
          Baixar a folha (PDF A4)
        </button>
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="foto">
        <h2 id="foto" className={ui.h2}>
          2. Foto do molde
        </h2>
        <label className="block">
          <span className={ui.label}>Foto (do celular ou do computador)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1 block w-full text-sm"
            disabled={status.kind === "reading"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void read(f);
            }}
            data-scan-input
          />
        </label>
        {status.kind === "reading" && (
          <p className={ui.muted} role="status">
            Lendo a foto…
          </p>
        )}
        {status.kind === "error" && (
          <p className={ui.error} role="alert">
            {status.message}
          </p>
        )}
        {result && size && (
          <div className="space-y-3" data-scan-result>
            <Review result={result} />
            <p className="text-sm" data-scan-summary>
              {formatCm(size.w)} × {formatCm(size.h)} cm · {result.corners} {result.corners === 1 ? "canto" : "cantos"} · {result.piques}{" "}
              {result.piques === 1 ? "pique" : "piques"}
            </p>
            {result.warnings.map((w) => (
              <p key={w} className={`${ui.error} text-sm`}>
                {w}
              </p>
            ))}
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className={ui.label}>Nome da peça</span>
                <input value={pieceName} onChange={(e) => setPieceName(e.target.value)} maxLength={80} placeholder={`Peça ${pieces.length + 1}`} className={ui.input} />
              </label>
              <button type="button" className={ui.buttonPrimary} onClick={keep} disabled={pieces.length >= MAX_SCANNED_PIECES} data-keep>
                Usar esta peça
              </button>
              <button
                type="button"
                className={ui.buttonGhost}
                onClick={() => {
                  setStatus({ kind: "idle" });
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Descartar
              </button>
            </div>
            <p className="text-xs text-tinta-suave">Confira no editor depois de salvar: o fio fica sem marcar e os piques viram pontos &quot;pique&quot; no contorno.</p>
          </div>
        )}
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="pecas" data-section="pecas">
        <h2 id="pecas" className={ui.h2}>
          3. Peças do molde
        </h2>
        {pieces.length === 0 ? (
          <p className={ui.muted}>Nenhuma peça ainda. Fotografe uma peça por vez.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 text-sm" data-scanned-pieces>
            {pieces.map((p, i) => {
              const s = pieceSize(p.piece);
              return (
                <li key={i} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {p.name} · {formatCm(s.w)} × {formatCm(s.h)} cm
                  </span>
                  <button type="button" className={ui.buttonGhost} onClick={() => setPieces((list) => list.filter((_, k) => k !== i))}>
                    Tirar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={ui.label}>Margem de costura a acrescentar (cm)</span>
            <input value={seam} onChange={(e) => setSeam(e.target.value)} inputMode="decimal" className={ui.input} />
            <span className="mt-1 block text-xs text-tinta-suave">0 se o papel já tem a margem.</span>
          </label>
          <label className="block">
            <span className={ui.label}>Nome do molde</span>
            <input value={patternName} onChange={(e) => setPatternName(e.target.value)} maxLength={120} placeholder="Ex.: Saia lápis" className={ui.input} />
          </label>
        </div>
        {!seamOk && (
          <p className={ui.error} role="alert">
            Margem: de 0 a 5 cm.
          </p>
        )}
        {message?.error && (
          <p className={ui.error} role="alert">
            {message.error}
          </p>
        )}
        {mode.kind === "panel" ? (
          <button type="button" className={ui.buttonPrimary} disabled={!doc || saving} onClick={save} data-create-pattern>
            {saving ? "Criando…" : "Criar molde"}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={ui.buttonPrimary} disabled={!doc} onClick={downloadDxf} data-download-dxf>
              Baixar DXF
            </button>
            <Link href="/entrar" className="text-sm text-tinta-suave underline">
              Entrar para salvar como molde
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
