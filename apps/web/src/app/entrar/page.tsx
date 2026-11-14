import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Alinhavo" };

const ERROS: Record<string, string> = {
  link: "Esse link de acesso não vale mais. Peça um novo abaixo.",
};

export default function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <PageShell>
      <div className="mx-auto max-w-sm">
        <h1 className={ui.h1}>Entrar</h1>
        <p className={`mt-2 ${ui.muted}`}>
          Sem senha: mandamos um link para o seu e-mail. Se for a primeira vez, a conta é criada na hora.
        </p>
        <div className={`mt-8 ${ui.card}`}>
          {getSupabaseConfig() ? (
            <Suspense fallback={<Loading />}>
              <Formulario searchParams={searchParams} />
            </Suspense>
          ) : (
            <NotConfigured />
          )}
        </div>
      </div>
    </PageShell>
  );
}

async function Formulario({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const erro = typeof params.erro === "string" ? ERROS[params.erro] : undefined;
  return (
    <div className="space-y-4">
      {erro && (
        <p className={ui.error} role="alert">
          {erro}
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
