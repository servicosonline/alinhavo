import "server-only";
import type { ExistingLink } from "@/components/tracking-share";
import { getOrigin } from "@/lib/origin";
import type { createClient } from "@/lib/supabase/server";
import { openedAgo, type TrackingShow } from "@/lib/tracking";

/** Links de acompanhamento ativos (não cancelados nem vencidos) de um produto ou coleção. A RLS filtra a organização. */
export async function activeTrackingLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "produto" | "colecao",
  targetId: string,
): Promise<ExistingLink[]> {
  const column = kind === "produto" ? "product_id" : "collection_id";
  const [{ data }, origin] = await Promise.all([
    supabase
      .from("tracking_links")
      .select("id, token, show, expires_at, last_opened_at, open_count")
      .eq(column, targetId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    getOrigin(),
  ]);
  const now = Date.now();
  return (data ?? [])
    .filter((l) => !l.expires_at || new Date(l.expires_at).getTime() > now)
    .map((l) => ({
      id: l.id,
      url: `${origin}/acompanhar/${l.token}`,
      show: l.show as TrackingShow,
      expiresAt: l.expires_at,
      lastOpenedAt: l.last_opened_at,
      openedLabel: openedAgo(l.last_opened_at),
      openCount: l.open_count,
    }));
}
