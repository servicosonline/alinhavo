import type { Metadata } from "next";
import { Suspense } from "react";
import { Announcement } from "@/components/announcement";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { adminDeleteAnnouncement } from "../actions";
import { AnnouncementForm } from "../notification-forms";

export const metadata: Metadata = { title: "Novidades · Superadmin · Alinhavo" };

export default function AdminNovidadesPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando as novidades…" />}>
      <Novidades />
    </Suspense>
  );
}

/** Publicar novidades (texto, imagem e vídeo) que aparecem no painel de todos os clientes. */
async function Novidades() {
  const { supabase } = await requirePlatform("/painel/admin/novidades");
  const { data } = await supabase.from("announcements").select("id, title, body, image_path, video_url, published, created_at").order("created_at", { ascending: false }).limit(50);
  const items = data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Superadmin" title="Novidades" description="Aparecem no cartão Novidades do painel e na página de novidades de todos os clientes." />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <section className={`${ui.card} space-y-4`} aria-labelledby="nova">
          <h2 id="nova" className={ui.eyebrow}>
            Nova novidade
          </h2>
          <AnnouncementForm />
        </section>
        <section className="space-y-4" aria-labelledby="publicadas">
          <h2 id="publicadas" className={ui.eyebrow}>
            Publicadas e rascunhos
          </h2>
          {items.length === 0 ? (
            <p className={ui.muted}>Nenhuma novidade ainda.</p>
          ) : (
            items.map((a) => (
              <div key={a.id} className={`${ui.card} space-y-3`}>
                {!a.published && <span className={ui.tag}>Rascunho</span>}
                <Announcement a={a} compact />
                <form action={adminDeleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-xs text-linha underline underline-offset-4">
                    Apagar
                  </button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
