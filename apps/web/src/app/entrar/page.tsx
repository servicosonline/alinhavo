import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pique } from "@/components/icons";
import { Container, Loading, NotConfigured, PageShell } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Alinhavo" };

const ERROS: Record<string, string> = {
  link: "Esse link de acesso não vale mais. Entre com a senha ou peça um novo link.",
};

const PONTOS = [
  "1 molde grátis para sempre, sem cartão",
  "Molde, Prova 3D e encaixe no mesmo arquivo",
  "O cliente aprova por link, sem criar conta",
  "Nada para instalar: roda no navegador",
];

export default function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <PageShell>
      <Container size="medium" className="grid items-center gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-16">
        <div className="order-last lg:order-none">
          <p className="font-mono text-[12px] tracking-[0.14em] text-linha uppercase">Molde · Prova 3D · Encaixe</p>
          <p className="mt-4 font-display text-5xl leading-[0.98] font-semibold tracking-[-0.03em] sm:text-6xl">
            Prove antes
            <br />
            de cortar.
          </p>
          <span className="alinhavo mt-6 w-36" aria-hidden="true" />
          <ul className="mt-7 space-y-3 text-[15px]">
            {PONTOS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <Pique />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-tinta-suave">
            Quer ver antes?{" "}
            <Link href="/experimentar" className={ui.link}>
              Experimente sem cadastro
            </Link>
          </p>
        </div>
        <div>
          <h1 className={ui.h1}>Entrar</h1>
          <p className={`mt-2 ${ui.muted}`}>Com e-mail e senha. Primeira vez? Use a aba Criar conta.</p>
          <div className={`mt-6 ${ui.card} shadow-[0_24px_50px_-32px_rgb(29_27_24/0.35)]`}>
            {getSupabaseConfig() ? (
              <Suspense fallback={<Loading label="Abrindo…" />}>
                <Formulario searchParams={searchParams} />
              </Suspense>
            ) : (
              <NotConfigured />
            )}
          </div>
        </div>
      </Container>
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
      <LoginForm next={next} initialMode={params.modo === "criar" ? "criar" : "entrar"} />
    </div>
  );
}
