"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleIcon } from "@/components/icons";
import { activeModule, MODULES } from "@/lib/modules";

/** Abas dos módulos. A ativa fica em Linha, com o alinhavo embaixo (marca/README.md, seção 7). */
export function ModuleNav({ orgId }: { orgId: string }) {
  const active = activeModule(usePathname(), orgId);
  return (
    <nav aria-label="Módulos" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max items-stretch gap-1">
        {MODULES.map((m) => {
          const on = m.slug === active;
          return (
            <li key={m.slug}>
              <Link
                href={m.slug ? `/painel/${orgId}/${m.slug}` : `/painel/${orgId}`}
                aria-current={on ? "page" : undefined}
                className={`relative flex h-[3.25rem] items-center gap-2 rounded-md px-3 text-sm transition ${on ? "font-medium text-linha" : "text-tinta-suave hover:text-tinta"}`}
              >
                <ModuleIcon name={m.icon} className="size-[18px]" />
                {m.label}
                {on && <span className="alinhavo absolute inset-x-3 bottom-0 h-[3px]" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
