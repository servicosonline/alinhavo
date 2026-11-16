import { Suspense } from "react";
import { ErrorReporter } from "@/components/error-reporter";
import { NotificationBell } from "@/components/notification-bell";
import { HelpButton } from "@/components/support/help-button";
import { PageShell } from "@/components/page-shell";
import { UserMenu } from "@/components/user-menu";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <PageShell
      homeHref="/painel"
      aside={
        <Suspense fallback={null}>
          <NotificationBell />
          <UserMenu />
        </Suspense>
      }
    >
      {/* Erros que escapam na tela vão para o superadmin (sem dado pessoal). */}
      <ErrorReporter />
      <Suspense fallback={null}>
        <HelpButton />
      </Suspense>
      {children}
    </PageShell>
  );
}
