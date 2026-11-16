"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AVATAR_MAX_BYTES, AVATAR_SIZE, ZOOM_MAX, clampCrop, scaleFor, sourceRect, type Crop } from "@/lib/avatar-crop";
import { getBrowserClient } from "@/lib/supabase/client";
import { ui } from "../ui";

const VIEW = 280;
const ACCEPT = "image/jpeg,image/png,image/webp";

/** Desenha o recorte em `size` px e devolve WebP (ou JPEG, se o navegador não gravar WebP). */
async function renderCrop(img: HTMLImageElement, crop: Crop, size: number, maxBytes: number): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem canvas");
  const r = sourceRect(crop, img.naturalWidth, img.naturalHeight, VIEW);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, r.sx, r.sy, r.size, r.size, 0, 0, size, size);
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  for (const q of [0.88, 0.75, 0.6]) {
    const webp = await toBlob("image/webp", q);
    if (webp && webp.type === "image/webp" && webp.size <= maxBytes) return { blob: webp, ext: "webp" };
    const jpg = await toBlob("image/jpeg", q);
    if (jpg && jpg.size <= maxBytes) return { blob: jpg, ext: "jpg" };
  }
  throw new Error("grande demais");
}

/**
 * Trocar uma imagem quadrada (foto de perfil, capa da organização): escolher, arrastar e aproximar dentro
 * do quadrado (mouse, toque, roda ou setas do teclado) e salvar. O navegador envia direto para o Storage
 * (`bucket`, pasta `folder`) e `onSave` (uma Server Action) liga a imagem e apaga a anterior; `null` tira.
 */
export function ImageCropper({
  bucket,
  folder,
  onSave,
  hasImage,
  size = AVATAR_SIZE,
  maxBytes = AVATAR_MAX_BYTES,
  round = true,
  noun = "foto",
}: {
  bucket: string;
  folder: string;
  onSave: (path: string | null) => Promise<{ error?: string }>;
  hasImage: boolean;
  size?: number;
  maxBytes?: number;
  /** Mostra o círculo (foto de perfil); sem ele, o quadrado inteiro (capa). */
  round?: boolean;
  /** "foto" ou "capa", nos botões. */
  noun?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const zoomId = useId();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; start: Crop } | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const update = (c: Crop) => img && setCrop(clampCrop(c, img.naturalWidth, img.naturalHeight, VIEW));

  function pick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) return setError("Use uma foto JPG, PNG ou WebP.");
    if (file.size > 15 * 1024 * 1024) return setError("Foto grande demais (até 15 MB).");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setCrop({ zoom: 1, x: 0, y: 0 });
    };
    image.onerror = () => setError("Não conseguimos abrir essa imagem.");
    image.src = url;
  }

  async function save() {
    if (!img) return;
    const supabase = getBrowserClient();
    if (!supabase) return setError("O Supabase ainda não foi configurado neste ambiente.");
    setBusy(true);
    setError(null);
    try {
      const { blob, ext } = await renderCrop(img, crop, size, maxBytes);
      const path = `${folder}/${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
      const up = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false });
      if (up.error) throw new Error("envio");
      const r = await onSave(path);
      if (r.error) throw new Error(r.error);
      setImg(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message.length > 12 ? e.message : `Não conseguimos salvar a ${noun}. Tente de novo.`);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    const r = await onSave(null);
    setBusy(false);
    if (r.error) setError(r.error);
    else router.refresh();
  }

  if (!img) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={inputId} className={`${ui.buttonGhost} cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-costura/40`}>
            {hasImage ? `Trocar ${noun}` : `Escolher ${noun}`}
            <input id={inputId} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {hasImage && (
            <button type="button" onClick={remove} disabled={busy} className="text-sm text-tinta-suave underline underline-offset-4 hover:text-tinta">
              Tirar {noun}
            </button>
          )}
        </div>
        {error && (
          <p className={ui.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const s = scaleFor(img.naturalWidth, img.naturalHeight, VIEW, crop.zoom);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;

  return (
    <div className="space-y-4">
      <p className="text-sm text-tinta-suave">Arraste para enquadrar e use o controle para aproximar.</p>
      <div
        role="application"
        aria-label="Enquadrar a foto. Setas movem, + e − aproximam."
        tabIndex={0}
        className="relative cursor-grab touch-none overflow-hidden rounded-2xl bg-tinta outline-none select-none focus-visible:ring-2 focus-visible:ring-costura/50 active:cursor-grabbing"
        style={{ width: VIEW, height: VIEW }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, start: crop };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          update({ ...d.start, x: d.start.x + e.clientX - d.x, y: d.start.y + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(e) => update({ ...crop, zoom: crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) })}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 20 : 6;
          const moves: Record<string, Partial<Crop>> = {
            ArrowLeft: { x: crop.x - step },
            ArrowRight: { x: crop.x + step },
            ArrowUp: { y: crop.y - step },
            ArrowDown: { y: crop.y + step },
            "+": { zoom: crop.zoom * 1.1 },
            "=": { zoom: crop.zoom * 1.1 },
            "-": { zoom: crop.zoom / 1.1 },
          };
          const m = moves[e.key];
          if (m) {
            e.preventDefault();
            update({ ...crop, ...m });
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem local (blob) só para enquadrar */}
        <img
          src={img.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{ width: w, height: h, left: (VIEW - w) / 2 + crop.x, top: (VIEW - h) / 2 + crop.y }}
        />
        {/* O círculo mostra como a foto aparece; o arquivo salvo é o quadrado inteiro. */}
        {round ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_closest-side,transparent_99%,rgb(29_27_24/0.5)_100%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-papel/80" />
          </>
        ) : (
          <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-papel/80" />
        )}
      </div>
      <div className="flex max-w-[280px] items-center gap-3">
        <label htmlFor={zoomId} className="text-sm">
          Aproximar
        </label>
        <input
          id={zoomId}
          type="range"
          min={1}
          max={ZOOM_MAX}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => update({ ...crop, zoom: Number(e.target.value) })}
          className="w-full accent-linha"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy} className={ui.buttonPrimary}>
          {busy ? "Salvando…" : `Salvar ${noun}`}
        </button>
        <button type="button" onClick={() => setImg(null)} disabled={busy} className={ui.buttonSecondary}>
          Cancelar
        </button>
      </div>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
