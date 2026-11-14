import Link from "next/link";

/** Moldura das telas do app: cabeçalho com a marca e conteúdo centralizado. */
export function PageShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="papel-milimetrado flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            Alinhavo
          </Link>
          {aside}
        </header>
        <div className="mt-10 flex-1">{children}</div>
      </div>
    </main>
  );
}

export function NotConfigured() {
  return (
    <div className="rounded-lg border border-linha/40 bg-white/70 p-6">
      <h2 className="font-display text-xl font-semibold">Supabase ainda não configurado</h2>
      <p className="mt-2 text-sm text-tinta-suave">
        Copie <code className="font-mono">apps/web/.env.example</code> para{" "}
        <code className="font-mono">apps/web/.env.local</code>, preencha a URL e a chave publicável do
        projeto e reinicie o servidor.
      </p>
    </div>
  );
}

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <p className="text-sm text-tinta-suave" role="status">
      {label}
    </p>
  );
}
