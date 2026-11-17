"use client";

import { ImageCropper } from "@/components/account/image-cropper";
import { ProductThumb } from "@/components/product-thumb";
import { ui } from "@/components/ui";
import { PRODUCT_PHOTO_MAX_BYTES, PRODUCT_PHOTO_SIZE } from "@/lib/product-photo";
import { setProductPhoto } from "../photo-actions";

/**
 * Foto do produto na página dele: a imagem que aparece na lista e no quadro da coleção. Quem edita
 * produtos envia uma foto quadrada (bucket privado `produtos`); sem ela, a imagem é automática.
 */
export function ProductPhoto({
  orgId,
  productId,
  photoPath,
  version,
  canEdit,
}: {
  orgId: string;
  productId: string;
  photoPath: string | null;
  version: string;
  canEdit: boolean;
}) {
  return (
    <section className={`${ui.card} flex flex-wrap items-start gap-5`} aria-label="Foto do produto" data-product-photo>
      <ProductThumb orgId={orgId} productId={productId} version={version} size={160} />
      <div className="min-w-0 flex-1 space-y-2">
        <p className={ui.eyebrow}>Foto do produto</p>
        <p className="text-sm text-tinta-suave">
          {photoPath
            ? "Foto enviada pela equipe. É ela que aparece na lista e no quadro da coleção."
            : "Sem foto enviada, entra a última foto de catálogo, a captura da última aprovação ou o desenho técnico da última ficha."}
        </p>
        {canEdit && (
          <ImageCropper
            bucket="produtos"
            folder={`${orgId}/${productId}`}
            onSave={setProductPhoto.bind(null, orgId, productId)}
            hasImage={Boolean(photoPath)}
            size={PRODUCT_PHOTO_SIZE}
            maxBytes={PRODUCT_PHOTO_MAX_BYTES}
            round={false}
            noun="foto"
          />
        )}
      </div>
    </section>
  );
}
