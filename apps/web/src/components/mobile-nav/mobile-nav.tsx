import { Avatar } from "@/components/account/avatar";
import { displayName } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { MobileTabBar } from "./tab-bar";

/** Barra de abas do celular com a foto de quem está logado na aba Perfil. Lê a sessão: use dentro de <Suspense>. */
export async function MobileNav() {
  if (!getSupabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name, avatar_path").eq("user_id", user.id).maybeSingle();
  const name = displayName(profile, user.email);
  return <MobileTabBar avatar={<Avatar name={name} path={profile?.avatar_path} size={26} />} />;
}
