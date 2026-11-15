import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { ui } from "@/components/ui";

export const metadata: Metadata = { title: "Página não encontrada · Alinhavo" };

export default function NotFound() {
  return (
    <StatusPage
      code="Erro 404"
      title="Essa parte não está no molde."
      actions={
        <>
          <Link href="/painel" className={ui.buttonPrimary}>
            Ir para o painel
          </Link>
          <Link href="/" className={ui.buttonSecondary}>
            Página inicial
          </Link>
        </>
      }
    >
      <p>O endereço não existe, mudou ou é de uma organização em que você não está.</p>
    </StatusPage>
  );
}
