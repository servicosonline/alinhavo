import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { UserMenu } from "@/components/user-menu";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <PageShell
      aside={
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      }
    >
      {children}
    </PageShell>
  );
}
