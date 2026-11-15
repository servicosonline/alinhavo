"use client";

import { useEffect, useRef } from "react";

export interface ViewerPhoto {
  src: string;
  alt: string;
  caption?: string;
  downloadHref?: string | null;
}

/**
 * A foto grande num modal, dentro do app (no lugar de abrir outra aba). Setas na tela e no teclado passam
 * entre as fotos; Esc ou o × fecha; o foco volta para onde estava. `actions` acrescenta botões (ex.: Apagar).
 */
export function PhotoDialog({
  photos,
  index,
  onIndex,
  onClose,
  actions,
}: {
  photos: ViewerPhoto[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  actions?: (i: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null && photos[index] !== undefined;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const photo = open ? photos[index!]! : null;
  const many = photos.length > 1;
  const go = (step: number) => index !== null && onIndex((index + step + photos.length) % photos.length);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Foto de catálogo"
      className="m-auto max-h-[94vh] w-[min(96vw,44rem)] overflow-hidden rounded-2xl border border-tinta/10 bg-tinta p-0 text-papel shadow-[0_40px_90px_-30px_rgb(0_0_0/0.7)] backdrop:bg-tinta/70"
      data-photo-dialog
    >
      {photo && (
        <div className="flex max-h-[94vh] flex-col">
          <div className="relative min-h-0 flex-1 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado do Storage, que vence */}
            <img src={photo.src} alt={photo.alt} className="mx-auto max-h-[78vh] w-auto object-contain" />
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-papel/90 text-xl text-tinta hover:bg-papel"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Próxima foto"
                  className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-papel/90 text-xl text-tinta hover:bg-papel"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-papel/10 px-4 py-3 text-sm">
            <p className="min-w-0 flex-1 truncate text-papel/80">
              {photo.caption}
              {many && <span className="ml-2 font-mono text-xs text-papel/50">{index! + 1} de {photos.length}</span>}
            </p>
            {photo.downloadHref && (
              <a href={photo.downloadHref} className="rounded-[10px] border border-papel/40 px-3 py-1.5 text-sm text-papel transition hover:bg-papel/10">

                Baixar
              </a>
            )}
            {actions?.(index!)}
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xl leading-none text-papel/70 hover:text-papel" aria-label="Fechar">
              ×
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
