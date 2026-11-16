import type { Metadata } from "next";
import { Suspense } from "react";
import { Announcement } from "@/components/announcement";
import { Container, EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Novidades · Alinhavo" };

export default function NovidadesPage() {
  return (
    <Container size="narrow">
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando as novidades…" />}>
          <Novidades />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

/** O que há de novo no Alinhavo: textos, imagens e vídeos publicados pela equipe da plataforma. */
async function Novidades() {
  await requireUser("/painel/novidades");
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, image_path, video_url, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader title="Novidades" description="O que mudou no Alinhavo e como aproveitar." />
      {items.length === 0 ? (
        <EmptyState icon="inicio" title="Nenhuma novidade ainda">
          Quando a plataforma ganhar recurso novo, ele aparece aqui.
        </EmptyState>
      ) : (
        <div className="space-y-10 divide-y divide-tinta/10">
          {items.map((a) => (
            <div key={a.id} className="pt-10 first:pt-0">
              <Announcement a={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
