import { signOut } from "@/app/entrar/actions";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SubmitButton } from "./submit-button";

/** E-mail de quem está logado e botão de sair. Lê a sessão: use dentro de <Suspense>. */
export async function UserMenu() {
  if (!getSupabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden max-w-[16rem] truncate text-sm text-tinta-suave sm:inline">{user.email}</span>
      <SubmitButton variant="ghost" pendingText="Saindo…">
        Sair
      </SubmitButton>
    </form>
  );
}
