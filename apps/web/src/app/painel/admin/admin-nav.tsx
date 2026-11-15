"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/painel/admin", label: "Clientes", match: (p: string) => p === "/painel/admin" || p.startsWith("/painel/admin/clientes") },
  { href: "/painel/admin/tempo", label: "Tempo de produção", match: (p: string) => p.startsWith("/painel/admin/tempo") },
  { href: "/painel/admin/notificacoes", label: "Notificações", match: (p: string) => p.startsWith("/painel/admin/notificacoes") },
  { href: "/painel/admin/suporte", label: "Suporte", match: (p: string) => p.startsWith("/painel/admin/suporte") },
  { href: "/painel/admin/novidades", label: "Novidades", match: (p: string) => p.startsWith("/painel/admin/novidades") },
  { href: "/painel/admin/erros", label: "Erros", match: (p: string) => p.startsWith("/painel/admin/erros") },
  { href: "/painel/admin/auditoria", label: "Auditoria", match: (p: string) => p.startsWith("/painel/admin/auditoria") },
  { href: "/painel/admin/equipe", label: "Equipe", match: (p: string) => p.startsWith("/painel/admin/equipe") },
];

/** Abas da área do superadmin. A conferência de quem entra fica em cada página (requirePlatform). */
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Superadmin" className="-mx-1 mb-8 overflow-x-auto">
      <div className="flex min-w-max items-center gap-4 border-b border-tinta/10">
        <span className="rounded-full bg-tinta px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-papel uppercase">Plataforma</span>
        <ul className="flex gap-1">
          {TABS.map((t) => {
            const on = t.match(path);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`-mb-px block border-b-2 px-3.5 py-2.5 text-sm transition ${on ? "border-linha font-medium text-tinta" : "border-transparent text-tinta-suave hover:text-tinta"}`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
