import { Suspense } from "react";
import { Container } from "@/components/page-shell";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

/** Moldura da área do superadmin: abas (só para admin) e a coluna de conteúdo. Cada página confere o papel de novo (requirePlatform). */
export default function AdminLayout({ children }: LayoutProps<"/painel/admin">) {
  return (
    <Container>
      {getSupabaseConfig() && (
        <Suspense fallback={<div className="mb-8 h-[2.6rem]" />}>
          <AdminNavIfAdmin />
        </Suspense>
      )}
      {children}
    </Container>
  );
}

async function AdminNavIfAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_platform_role");
  return data === "dono" || data === "suporte" ? <AdminNav /> : null;
}
