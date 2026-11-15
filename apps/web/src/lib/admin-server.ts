import "server-only";
import { notFound } from "next/navigation";
import type { PlatformRole } from "./admin";
import { requireUser } from "./auth";
import { createClient } from "./supabase/server";

/**
 * Entrada das telas do superadmin: confere o login e o papel na plataforma. Quem não é admin recebe 404
 * (a área não existe para ele). A permissão de verdade fica nas funções platform_* do banco.
 */
export async function requirePlatform(next: string): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; role: PlatformRole }> {
  await requireUser(next);
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_platform_role");
  if (data !== "dono" && data !== "suporte") notFound();
  return { supabase, role: data };
}
