import { getCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { NotificationBellClient } from "./notification-bell-client";

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** O sino de notificações da barra (lê a sessão: use dentro de <Suspense>). */
export async function NotificationBell() {
  if (!getSupabaseConfig()) return null;
  if (!(await getCurrentUser())) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_notifications", { p_limit: 30 });
  const all = data ?? [];
  const unread = all.filter((n) => !n.read).length;
  const items = all.slice(0, 8).map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, when: quando.format(new Date(n.created_at)), read: n.read }));
  return <NotificationBellClient items={items} unread={unread} />;
}
