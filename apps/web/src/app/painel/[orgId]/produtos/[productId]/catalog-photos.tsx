import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { AI_PHOTO_MONTHLY_LIMIT, BODY_TYPES, SCENES, SKIN_TONES } from "@/lib/ai/catalog-photo";
import { formatDate } from "@/lib/prova/approval";
import type { createClient } from "@/lib/supabase/server";
import { deleteCatalogPhoto } from "../catalog-actions";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Fotos mostradas no produto (as mais recentes). */
export const CATALOG_GALLERY_MAX = 12;
const URL_SECONDS = 3600;

function settingsLine(settings: unknown): string {
  const s = (settings ?? {}) as Record<string, unknown>;
  const find = (list: readonly { id: string; label: string }[], id: unknown) => list.find((x) => x.id === id)?.label;
  return [find(SKIN_TONES, s.skin), find(BODY_TYPES, s.body), find(SCENES, s.scene)].filter(Boolean).join(" · ");
}

/** Galeria das fotos de catálogo do produto (geradas na Prova), com endereços assinados de 1 h. */
export async function CatalogPhotos({
  supabase,
  orgId,
  productId,
  provaHref,
  canEdit,
  usedThisMonth,
}: {
  supabase: Supabase;
  orgId: string;
  productId: string;
  /** Prova do molde ligado (onde as fotos nascem); null sem molde com versão. */
  provaHref: string | null;
  canEdit: boolean;
  usedThisMonth: number;
}) {
  const { data } = await supabase
    .from("catalog_photos")
    .select("id, path, settings, created_at")
    .eq("product_id", productId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(CATALOG_GALLERY_MAX);
  const photos = data ?? [];
  const paths = photos.map((p) => p.path);
  const bucket = supabase.storage.from("catalogo");
  const [view, download] = paths.length
    ? await Promise.all([bucket.createSignedUrls(paths, URL_SECONDS), bucket.createSignedUrls(paths, URL_SECONDS, { download: true })])
    : [{ data: [] }, { data: [] }];
  const urlOf = (list: { path: string | null; signedUrl: string | null }[] | null, path: string) =>
    list?.find((u) => u.path === path)?.signedUrl ?? null;

  return (
    <section className={`${ui.card} space-y-3`} aria-labelledby="fotos" data-section="fotos">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="fotos" className={ui.h2}>
          Fotos de catálogo
        </h2>
        {provaHref && canEdit && (
          <Link href={provaHref} className={ui.buttonGhost}>
            Gerar na Prova
          </Link>
        )}
      </div>
      <p className="text-xs text-tinta-suave">
        Geradas por IA a partir de uma captura da Prova: o manequim vira um modelo. A IA pode mudar detalhes da roupa; confira antes de publicar e
        informe que a imagem foi gerada por IA. {usedThisMonth} de {AI_PHOTO_MONTHLY_LIMIT} fotos usadas neste mês pela equipe.
      </p>
      {photos.length === 0 ? (
        <p className={ui.muted}>
          {provaHref
            ? "Nenhuma foto ainda. Capture uma imagem na Prova e peça a foto."
            : "Ligue um molde com versão salva para gerar fotos na Prova."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-catalog-photos>
          {photos.map((ph) => {
            const src = urlOf(view.data, ph.path);
            const dl = urlOf(download.data, ph.path);
            return (
              <li key={ph.id} className="space-y-1 text-xs" data-catalog-photo-item>
                {src ? (
                  <a href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado do Storage, que vence */}
                    <img
                      src={src}
                      alt="Foto de catálogo gerada por IA"
                      loading="lazy"
                      className="aspect-[2/3] w-full rounded border border-tinta/15 bg-papel object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center rounded border border-tinta/15 bg-papel text-tinta-suave">
                    Indisponível
                  </div>
                )}
                <p className="text-tinta-suave">
                  {formatDate(ph.created_at)}
                  <span className="block">{settingsLine(ph.settings)}</span>
                </p>
                <div className="flex gap-1">
                  {dl && (
                    <a href={dl} className={ui.buttonGhost}>
                      Baixar
                    </a>
                  )}
                  {canEdit && (
                    <form action={deleteCatalogPhoto}>
                      <input type="hidden" name="orgId" value={orgId} />
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="photoId" value={ph.id} />
                      <SubmitButton variant="ghost" pendingText="Apagando…">
                        Apagar
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
