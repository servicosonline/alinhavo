import { initials } from "@/lib/account";
import { publicFileUrl } from "./account/avatar";

/**
 * Capa quadrada da organização (bucket público `org-capas`). Sem capa: o papel milimetrado com as
 * iniciais em Fraunces e o alinhavo, na linguagem da marca.
 */
export function OrgCover({ name, path, className = "" }: { name: string; path: string | null | undefined; className?: string }) {
  const url = publicFileUrl("org-capas", path);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- capa do Storage, quadrada e pequena
    return <img src={url} alt="" className={`aspect-square w-full object-cover ${className}`} />;
  }
  return (
    <div aria-hidden="true" className={`papel-milimetrado relative grid aspect-square w-full place-items-center bg-papel ${className}`}>
      <span className="font-display text-[clamp(2.5rem,22cqw,4.5rem)] font-semibold tracking-[-0.03em] text-tinta">{initials(name)}</span>
      <span className="alinhavo absolute bottom-[18%] left-1/2 w-1/3 -translate-x-1/2" />
    </div>
  );
}
