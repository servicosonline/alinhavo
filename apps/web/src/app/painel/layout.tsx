import { Suspense } from "react";
import { ErrorReporter } from "@/components/error-reporter";
import { PageShell } from "@/components/page-shell";
import { UserMenu } from "@/components/user-menu";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <PageShell
      homeHref="/painel"
      aside={
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      }
    >
      {/* Erros que escapam na tela vão para o superadmin (sem dado pessoal). */}
      <ErrorReporter />
      {children}
    </PageShell>
  );
}
