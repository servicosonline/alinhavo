import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Convite · Alinhavo", robots: { index: false } };

export default function ConvitePage({ params }: PageProps<"/convite/[token]">) {
  return (
    <PageShell>
      <div className="mx-auto max-w-sm">
        <h1 className={ui.h1}>Você foi convidado</h1>
        <p className={`mt-2 ${ui.muted}`}>
          Alguém da sua equipe chamou você para trabalhar junto no Alinhavo.
        </p>
        <div className={`mt-8 ${ui.card}`}>
          {getSupabaseConfig() ? (
            <Suspense fallback={<Loading />}>
              <Convite params={params} />
            </Suspense>
          ) : (
            <NotConfigured />
          )}
        </div>
      </div>
    </PageShell>
  );
}

async function Convite({ params }: { params: PageProps<"/convite/[token]">["params"] }) {
  const { token } = await params;
  if (!isUuid(token)) notFound();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Entre com o e-mail que recebeu o convite para continuar.</p>
        <Link href={`/entrar?next=${encodeURIComponent(`/convite/${token}`)}`} className={ui.buttonPrimary}>
          Entrar para aceitar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Você está entrando como <strong className="font-medium">{user.email}</strong>. O convite só vale para o e-mail
        em que foi enviado.
      </p>
      <AcceptForm token={token} />
    </div>
  );
}
