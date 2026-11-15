"use client";

import { useState } from "react";
import { PhotoDialog } from "@/components/photo-dialog";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { deleteCatalogPhoto } from "../catalog-actions";

export interface GalleryPhoto {
  id: string;
  src: string | null;
  downloadHref: string | null;
  date: string;
  settings: string;
}

/** As fotos do produto em grade; clicar abre a foto grande no modal (com Baixar, Apagar e as setas). */
export function CatalogGallery({ photos, orgId, productId, canEdit }: { photos: GalleryPhoto[]; orgId: string; productId: string; canEdit: boolean }) {
  const viewable = photos.filter((p) => p.src);
  const [open, setOpen] = useState<number | null>(null);

  const deleteForm = (photoId: string, onDark = false) => (
    <form action={deleteCatalogPhoto}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="photoId" value={photoId} />
      {onDark ? (
        <button type="submit" className="rounded-[10px] border border-linha/60 px-3 py-1.5 text-sm text-papel hover:bg-linha/20">
          Apagar
        </button>
      ) : (
        <SubmitButton variant="ghost" pendingText="Apagando…">
          Apagar
        </SubmitButton>
      )}
    </form>
  );

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-catalog-photos>
        {photos.map((ph) => (
          <li key={ph.id} className="space-y-1 text-xs" data-catalog-photo-item>
            {ph.src ? (
              <button
                type="button"
                onClick={() => setOpen(viewable.findIndex((v) => v.id === ph.id))}
                className="group block w-full overflow-hidden rounded focus-visible:ring-2 focus-visible:ring-costura/50 focus-visible:outline-none"
                aria-label={`Ver a foto de ${ph.date} em tamanho grande`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado do Storage, que vence */}
                <img
                  src={ph.src}
                  alt="Foto de catálogo gerada por IA"
                  loading="lazy"
                  className="aspect-[2/3] w-full rounded border border-tinta/15 bg-papel object-cover transition group-hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded border border-tinta/15 bg-papel text-tinta-suave">Indisponível</div>
            )}
            <p className="text-tinta-suave">
              {ph.date}
              <span className="block">{ph.settings}</span>
            </p>
            <div className="flex gap-1">
              {ph.downloadHref && (
                <a href={ph.downloadHref} className={ui.buttonGhost}>
                  Baixar
                </a>
              )}
              {canEdit && deleteForm(ph.id)}
            </div>
          </li>
        ))}
      </ul>
      <PhotoDialog
        photos={viewable.map((p) => ({ src: p.src!, alt: "Foto de catálogo gerada por IA", caption: [p.date, p.settings].filter(Boolean).join(" · "), downloadHref: p.downloadHref }))}
        index={open}
        onIndex={setOpen}
        onClose={() => setOpen(null)}
        actions={canEdit ? (i) => deleteForm(viewable[i]!.id, true) : undefined}
      />
    </>
  );
}
