import Link from "next/link";
import { signOut } from "@/app/entrar/actions";
import { displayName } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "./account/avatar";

/**
 * Foto e nome de quem está logado, abrindo um menu com Minha conta e Sair (um <details>: funciona sem
 * JavaScript e com teclado). Lê a sessão: use dentro de <Suspense>.
 */
export async function UserMenu() {
  if (!getSupabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: platformRole }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, avatar_path").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("my_platform_role"),
  ]);
  const name = displayName(profile, user.email);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition hover:bg-papel-escuro [&::-webkit-details-marker]:hidden">
        <Avatar name={name} path={profile?.avatar_path} size={32} />
        <span className="hidden max-w-[12rem] truncate text-sm sm:inline">{name}</span>
        <span aria-hidden className="text-xs text-tinta-suave transition group-open:rotate-180">
          ▾
        </span>
        <span className="sr-only">Abrir o menu da conta</span>
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-tinta/10 bg-white shadow-[0_18px_40px_-20px_rgb(29_27_24/0.45)]">
        <div className="border-b border-tinta/10 px-4 py-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-tinta-suave">{user.email}</p>
        </div>
        <Link href="/painel/conta" className="block px-4 py-2.5 text-sm hover:bg-papel">
          Minha conta
        </Link>
        <Link href="/painel" className="block px-4 py-2.5 text-sm hover:bg-papel">
          Minhas organizações
        </Link>
        {(platformRole === "dono" || platformRole === "suporte") && (
          <Link href="/painel/admin" className="block border-t border-tinta/10 px-4 py-2.5 text-sm font-medium hover:bg-papel">
            Superadmin <span className="ml-1 font-mono text-[11px] text-tinta-suave">{platformRole === "dono" ? "dono" : "suporte"}</span>
          </Link>
        )}
        <form action={signOut} className="border-t border-tinta/10">
          <button type="submit" className="w-full px-4 py-2.5 text-left text-sm text-linha hover:bg-papel">
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}
