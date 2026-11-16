"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientError } from "@/components/error-reporter";
import { StatusPage } from "@/components/status-page";
import { ui } from "@/components/ui";

/** Erro inesperado numa tela: nunca mostra a mensagem técnica (ver lib/db-error.ts), só o código para o suporte. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  // O superadmin vê o erro (mensagem curta e o código), para agir antes da reclamação.
  useEffect(() => {
    reportClientError(error instanceof Error ? error.message || "Erro na tela" : "Erro na tela", digest ?? undefined);
  }, [error, digest]);
  return (
    <StatusPage
      code="Algo deu errado"
      title="A costura abriu aqui."
      actions={
        <>
          <button type="button" className={ui.buttonPrimary} onClick={() => retry()}>
            Tentar de novo
          </button>
          <Link href="/painel" className={ui.buttonSecondary}>
            Ir para o painel
          </Link>
        </>
      }
    >
      <p>Não conseguimos abrir esta tela agora. Tente de novo em alguns segundos; o que já estava salvo continua salvo.</p>
      {digest && <p className="mt-3 font-mono text-[12px]">código {digest}</p>}
    </StatusPage>
  );
}
