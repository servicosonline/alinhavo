import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { isUuid } from "@/lib/ids";
import { formatDate, readSettings, settingsLabel, STATUS_LABEL } from "@/lib/prova/approval";
import { ANGLE_LABEL, type CaptureAngle } from "@/lib/prova/captures";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { PublicApproval } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { DecisionForm } from "./decision-form";

// O link é privado de quem recebeu: fora de buscadores.
export const metadata: Metadata = { title: "Aprovação · Alinhavo", robots: { index: false, follow: false } };

/** Página pública: o cliente da confecção vê as imagens da Prova e responde, sem conta. */
export default function AprovarPage({ params }: PageProps<"/aprovar/[token]">) {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        {getSupabaseConfig() ? (
          <Suspense fallback={<Loading label="Abrindo a aprovação…" />}>
            <Aprovacao params={params} />
          </Suspense>
        ) : (
          <NotConfigured />
        )}
      </div>
    </PageShell>
  );
}

function Invalido() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className={ui.h1}>Link indisponível</h1>
      <p className={`mt-2 ${ui.muted}`}>
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

  const details = settingsLabel(readSettings(a.settings));
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-tinta-suave">Aprovação de protótipo</p>
        <h1 className={`${ui.h1} mt-1`}>{a.pattern_name}</h1>
        <p className={`mt-1 ${ui.muted}`} data-approval-details>
          Versão {a.version}
          {details && ` · ${details}`} · vale até {formatDate(a.expires_at)}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Imagens da prova virtual">
        {a.images.map((img, i) => (
          <li key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem vinda do banco como data URL (JPEG/PNG conferido lá) */}
            <img
              src={`data:${img.mime === "image/png" ? "image/png" : "image/jpeg"};base64,${img.data}`}
              alt={`Prova virtual: ${ANGLE_LABEL[img.angle as CaptureAngle] ?? "vista"}`}
              className="aspect-[3/4] w-full rounded-lg border border-tinta/15 bg-papel object-cover"
            />
            <span className="mt-1 block text-center text-xs text-tinta-suave">{ANGLE_LABEL[img.angle as CaptureAngle] ?? ""}</span>
          </li>
        ))}
      </ul>

      <div className={ui.card} data-approval-status={a.status}>
        {a.status === "pendente" ? (
          <DecisionForm token={token} />
        ) : (
          <div className="space-y-1">
            <p className="font-medium">{STATUS_LABEL[a.status]}</p>
            <p className={ui.muted}>
              Respondido por {a.reviewer_name}
              {a.decided_at && ` em ${formatDate(a.decided_at)}`}.
            </p>
            {a.reviewer_comment && <p className="whitespace-pre-line text-sm">“{a.reviewer_comment}”</p>}
          </div>
        )}
      </div>
    </div>
  );
}
