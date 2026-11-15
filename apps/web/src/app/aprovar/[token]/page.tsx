import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandSymbol } from "@/components/brand-mark";
import { Container, Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { isUuid } from "@/lib/ids";
import { formatDate, readSettings, settingsLabel, STATUS_LABEL } from "@/lib/prova/approval";
import { fetchApprovalVideoUrl } from "@/lib/prova/approval-video";
import { ANGLE_LABEL, type CaptureAngle } from "@/lib/prova/captures";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { PublicApproval } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { DecisionForm } from "./decision-form";

// O link é privado de quem recebeu: fora de buscadores.
export const metadata: Metadata = {
  title: "Aprovação de protótipo · Alinhavo",
  description: "Veja a peça vestida na prova virtual e responda: aprovar ou pedir ajustes. Sem criar conta.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Uma peça espera a sua aprovação",
    description: "Veja a prova virtual em 3D e responda em um minuto, sem criar conta.",
    siteName: "Alinhavo",
    locale: "pt_BR",
    type: "website",
  },
};

/**
 * Página pública: o cliente da confecção vê a Prova e responde, sem conta.
 * É a vitrine da marca (marca/README.md, seção 2): todo link de aprovação é o primeiro contato com o Alinhavo.
 */
export default function AprovarPage({ params }: PageProps<"/aprovar/[token]">) {
  return (
    <PageShell>
      <Container size="medium">
        {getSupabaseConfig() ? (
          <Suspense fallback={<Loading label="Abrindo a aprovação…" />}>
            <Aprovacao params={params} />
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
      <p className={`mt-3 ${ui.muted}`}>
        Este link de aprovação venceu ou não existe. Peça um novo para quem enviou.
      </p>
    </div>
  );
}

async function Aprovacao({ params }: { params: PageProps<"/aprovar/[token]">["params"] }) {
  const { token } = await params;
  if (!isUuid(token)) return <Invalido />;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_approval", { p_token: token });
  const a = data as PublicApproval | null;
  if (!a) return <Invalido />;
  // Vídeo 360°: endereço assinado (curta duração) pela Edge Function; sem ele, a página segue com as imagens.
  const config = getSupabaseConfig();
  const videoUrl = a.has_video && config ? await fetchApprovalVideoUrl(config, token) : null;

  const details = settingsLabel(readSettings(a.settings));
  const pending = a.status === "pendente";
  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[12px] tracking-[0.14em] text-linha uppercase">Aprovação de protótipo</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.02] font-semibold tracking-[-0.03em] break-words sm:text-5xl">
          {a.pattern_name}
        </h1>
        <span className="alinhavo mt-5 w-28" aria-hidden="true" />
        <p className="mt-4 font-mono text-[13px] text-tinta-suave" data-approval-details>
          Versão {a.version}
          {details && ` · ${details}`} · vale até {formatDate(a.expires_at)}
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <section aria-label="Prova virtual" className="space-y-4">
          <p className="max-w-xl text-[15px] leading-relaxed text-tinta-suave">
            É a peça vestida num corpo com as medidas da tabela, simulada em 3D antes de cortar o piloto.
            {videoUrl ? " Dê play para ver a volta inteira." : ""}
          </p>
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              loop
              playsInline
              preload="metadata"
              className="mx-auto aspect-[3/4] w-full max-w-md rounded-2xl border border-tinta/10 bg-white"
              aria-label="Vídeo 360° da prova virtual"
              data-approval-video
            />
          )}
          <ul className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Imagens da prova virtual">
            {a.images.map((img, i) => (
              <li key={i} className="overflow-hidden rounded-2xl border border-tinta/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem vinda do banco como data URL (JPEG/PNG conferido lá) */}
                <img
                  src={`data:${img.mime === "image/png" ? "image/png" : "image/jpeg"};base64,${img.data}`}
                  alt={`Prova virtual: ${ANGLE_LABEL[img.angle as CaptureAngle] ?? "vista"}`}
                  className="aspect-[3/4] w-full bg-papel object-cover"
                />
                <span className="block border-t border-tinta/10 px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
                  {ANGLE_LABEL[img.angle as CaptureAngle] ?? "Vista"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-6">
          <div className={`${ui.card} shadow-[0_24px_50px_-32px_rgb(29_27_24/0.35)]`} data-approval-status={a.status}>
            {pending ? (
              <>
                <h2 className={ui.h2}>A peça está pronta para cortar?</h2>
                <p className={`mt-1 mb-5 ${ui.muted}`}>Aprove ou diga o que mudar. Não precisa criar conta.</p>
                <DecisionForm token={token} />
              </>
            ) : (
              <Decidido status={a.status} name={a.reviewer_name} when={a.decided_at} comment={a.reviewer_comment} />
            )}
          </div>
        </aside>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-tinta/10 pt-6 text-sm text-tinta-suave">
        <BrandSymbol className="size-5" />
        Prova feita no Alinhavo: molde, prova 3D e encaixe no navegador.
        <Link href="/" className={ui.link}>
          Conhecer
        </Link>
      </p>
    </div>
  );
}

function Decidido({
  status,
  name,
  when,
  comment,
}: {
  status: PublicApproval["status"];
  name: string | null;
  when: string | null;
  comment: string | null;
}) {
  const approved = status === "aprovado";
  return (
    <div className="space-y-3">
      <span className={approved ? "inline-flex rounded-full bg-tinta px-3 py-1 font-mono text-[11px] tracking-wide text-papel uppercase" : ui.tagAlert}>
        {STATUS_LABEL[status]}
      </span>
      <p className="font-display text-2xl font-semibold">{approved ? "Pode cortar o piloto." : "Os ajustes foram enviados."}</p>
      <p className={ui.muted}>
        Respondido por {name}
        {when && ` em ${formatDate(when)}`}.
      </p>
      {comment && <p className="rounded-lg bg-papel px-3 py-2 text-sm whitespace-pre-line">“{comment}”</p>}
    </div>
  );
}
