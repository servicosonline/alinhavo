import { initials } from "@/lib/account";
import { getSupabaseConfig } from "@/lib/supabase/config";

/** Endereço de um arquivo num bucket público (`avatars`, `org-capas`; o nome do arquivo é aleatório). */
export function publicFileUrl(bucket: "avatars" | "org-capas", path: string | null | undefined): string | null {
  const config = getSupabaseConfig();
  if (!path || !config) return null;
  return `${config.url}/storage/v1/object/public/${bucket}/${path}`;
}

export const avatarUrl = (path: string | null | undefined) => publicFileUrl("avatars", path);

/** Foto redonda da pessoa, ou as iniciais sobre o papel quando não há foto. */
export function Avatar({ name, path, size = 32, className = "" }: { name: string; path: string | null | undefined; size?: number; className?: string }) {
  const url = avatarUrl(path);
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.38) };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- foto do Storage, tamanho fixo e pequeno
    return <img src={url} alt="" width={size} height={size} style={style} className={`shrink-0 rounded-full object-cover ring-1 ring-tinta/10 ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-tinta font-mono font-medium text-papel ${className}`}
    >
      {initials(name)}
    </span>
  );
}
