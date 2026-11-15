import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandSymbol } from "@/components/brand-mark";
import { Container, Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { formatDay, PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, productDueState, todayInBrazil } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { ANGLE_LABEL, type CaptureAngle } from "@/lib/prova/captures";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { readTrackingView, type TrackingProduct } from "@/lib/tracking";

// O link é privado de quem recebeu: fora de buscadores.
export const metadata: Metadata = {
  title: "Acompanhamento · Alinhavo",
  description: "Veja em que pé está a sua peça ou coleção, sem criar conta.",
  robots: { index: false, follow: false },
};

/**
 * Página pública do acompanhamento: a cliente da confecção vê, sem conta, só o que a equipe marcou no link
 * (o banco monta a resposta em public_tracking). Abrir marca quando foi aberto (touch_tracking).
 */
export default function AcompanharPage({ params }: PageProps<"/acompanhar/[token]">) {
  return (
    <PageShell>
      <Container size="medium">
        {getSupabaseConfig() ? (
          <Suspense fallback={<Loading label="Abrindo o acompanhamento…" />}>
            <Acompanhamento params={params} />
          </Suspense>
        ) : (
          <NotConfigured />
        )}
      </Container>
    </PageShell>
  );
}

function Invalido() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <BrandSymbol className="mx-auto size-14" />
      <h1 className={`${ui.h1} mt-6`}>Link indisponível</h1>
      <p className={`mt-3 ${ui.muted}`}>Este link de acompanhamento venceu, foi cancelado ou não existe. Peça um novo para quem enviou.</p>
    </div>
  );
}

const dataLonga = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

async function Acompanhamento({ params }: { params: PageProps<"/acompanhar/[token]">["params"] }) {
  const { token } = await params;
  if (!isUuid(token)) return <Invalido />;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_tracking", { p_token: token });
  const view = readTrackingView(data);
  if (!view) return <Invalido />;
  // Marca a abertura; falhar aqui não pode tirar a página da cliente.
  await supabase.rpc("touch_tracking", { p_token: token }).then(
    () => null,
    () => null,
  );
  const today = todayInBrazil();
  const single = view.kind === "produto";

  return (
    <div className="space-y-10 py-2">
      <header className="space-y-3">
        <p className={ui.eyebrow}>Acompanhamento{view.orgName && ` · ${view.orgName}`}</p>
        <h1 className={ui.h1}>{view.title}</h1>
        <span className="alinhavo block w-28" aria-hidden="true" />
        <p className="text-[15px] text-tinta-suave">
          {single && view.collectionName && <>Coleção {view.collectionName}. </>}
          {!single && `${view.products.length} ${view.products.length === 1 ? "peça" : "peças"}. `}
          {view.launchOn && <>Lançamento previsto para {dataLonga.format(new Date(`${view.launchOn}T12:00:00`))}.</>}
        </p>
      </header>

      {single ? (
        view.products[0] && <ProductDetail p={view.products[0]} today={today} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2" data-pecas>
          {view.products.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <ProductCard p={p} today={today} />
            </li>
          ))}
        </ul>
      )}

      {view.milestones && view.milestones.length > 0 && (
        <section aria-labelledby="cronograma" className="space-y-4">
          <h2 id="cronograma" className={ui.h2}>
            Cronograma
          </h2>
          <ol className="relative space-y-4 border-l-2 border-dashed border-tinta/15 pl-6">
            {view.milestones.map((m, i) => (
              <li key={`${m.title}-${i}`} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 -left-[33px] grid size-4 place-items-center rounded-full border-2 ${m.done ? "border-tinta bg-tinta text-[9px] text-papel" : "border-tinta/30 bg-papel"}`}
                >
                  {m.done ? "✓" : ""}
                </span>
                <p className={m.done ? "text-tinta-suave line-through" : "font-medium"}>{m.title}</p>
                <p className="font-mono text-xs text-tinta-suave">
                  {formatDay(m.dueOn)}
                  {m.done ? " · feito" : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/10 pt-5 text-sm text-tinta-suave">
        <span>
          {view.expiresAt ? `Este link vale até ${dataLonga.format(new Date(view.expiresAt))}.` : "Este link fica ativo até quem enviou cancelar."} As informações se
          atualizam sozinhas.
        </span>
        <Link href="/" className="font-mono text-xs hover:text-tinta">
          feito com alinhavo
        </Link>
      </footer>
    </div>
  );
}

/** Do pedido à produção: os cinco status em linha, o atual marcado. */
function StatusSteps({ status }: { status: TrackingProduct["status"] }) {
  if (!status) return null;
  const at = PRODUCT_STATUSES.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={`Status: ${PRODUCT_STATUS_LABEL[status]}`}>
      {PRODUCT_STATUSES.map((s, i) => (
        <li key={s} className="space-y-1.5">
          <span aria-hidden="true" className={`block h-1.5 rounded-full ${i <= at ? "bg-linha" : "bg-tinta/10"}`} />
          <span className={`block text-[11px] leading-tight ${i === at ? "font-medium text-tinta" : "text-tinta-suave"}`}>{PRODUCT_STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

function Due({ p, today }: { p: TrackingProduct; today: string }) {
  if (!p.dueOn) return null;
  const state = p.status ? productDueState(p.dueOn, p.status, today) : null;
  return (
    <p className={`font-mono text-xs ${state === "atrasada" ? "text-linha" : "text-tinta-suave"}`}>
      Entrega prevista: {formatDay(p.dueOn)}
      {state === "concluida" && " · entregue"}
    </p>
  );
}

const img = (i: { mime: string; data: string }) => `data:${i.mime};base64,${i.data}`;

function ProductDetail({ p, today }: { p: TrackingProduct; today: string }) {
  return (
    <section className="space-y-6" aria-label={p.name}>
      <div className="space-y-3 rounded-2xl border border-tinta/10 bg-white p-5 sm:p-6">
        {p.reference && <p className="font-mono text-xs text-tinta-suave">{p.reference}</p>}
        <StatusSteps status={p.status} />
        <Due p={p} today={today} />
        {p.pattern && (
          <p className="text-sm text-tinta-suave">
            Molde {p.pattern.name}, versão {p.pattern.version}
          </p>
        )}
      </div>
      {p.images.length > 0 && (
        <div className="space-y-2">
          <h2 className={ui.eyebrow}>Prova virtual mais recente</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.images.map((i, k) => (
              <li key={k}>
                <figure className="overflow-hidden rounded-xl border border-tinta/10 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem da aprovação, vinda do banco em base64 */}
                  <img src={img(i)} alt={`${p.name}, ${ANGLE_LABEL[i.angle as CaptureAngle] ?? i.angle}`} className="aspect-[3/4] w-full object-cover" />
                  <figcaption className="px-2 py-1.5 text-center font-mono text-[11px] text-tinta-suave">{ANGLE_LABEL[i.angle as CaptureAngle] ?? i.angle}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ProductCard({ p, today }: { p: TrackingProduct; today: string }) {
  const cover = p.images[0];
  return (
    <article className="flex h-full gap-4 rounded-2xl border border-tinta/10 bg-white p-4">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem da aprovação, vinda do banco em base64
        <img src={img(cover)} alt="" className="aspect-[3/4] w-20 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="font-display text-lg leading-tight font-semibold">
          {p.name}
          {p.reference && <span className="ml-1.5 font-mono text-xs font-normal text-tinta-suave">{p.reference}</span>}
        </p>
        <StatusSteps status={p.status} />
        <Due p={p} today={today} />
      </div>
    </article>
  );
}
