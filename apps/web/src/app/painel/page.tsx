import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ROLE_LABEL, ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "./create-org-form";

export const metadata: Metadata = { title: "Painel · Alinhavo" };

export default function PainelPage() {
  return (
    <Container size="narrow">
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando suas organizações…" />}>
          <Organizacoes />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

async function Organizacoes() {
  const user = await requireUser("/painel");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("role, orgs(id, name)")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    return (
      <p className={ui.error} role="alert">
        Não foi possível carregar suas organizações.
      </p>
    );
  }

  const orgs = data ?? [];

  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader
          eyebrow="Primeiro passo"
          title="Boas-vindas ao Alinhavo"
          description="Crie a sua confecção ou o seu ateliê. Depois você convida a equipe. Se alguém já te convidou, abra o link do convite."
        />
        <div className={`mt-8 ${ui.card}`}>
          <CreateOrgForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Suas organizações" description="Escolha onde trabalhar agora." />
      <ul className={ui.list}>
        {orgs.map((m) => (
          <li key={m.orgs.id}>
            <Link
              href={`/painel/${m.orgs.id}`}
              className={`group ${ui.row}`}
            >
              <span className="font-display text-xl font-semibold">{m.orgs.name}</span>
              <span className="flex items-center gap-3">
                <span className={ui.tag}>{ROLE_LABEL[m.role] ?? m.role}</span>
                <span aria-hidden className="text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-linha">
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <details className={ui.card}>
        <summary className="cursor-pointer text-sm font-medium">Criar outra organização</summary>
        <div className="mt-4">
          <CreateOrgForm />
        </div>
      </details>
    </div>
  );
}
