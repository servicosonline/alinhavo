"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ModuleIcon } from "@/components/icons";
import { isUuid } from "@/lib/ids";
import { activeTab, createActions, orgFromPath, showMobileNav, tabHrefs } from "@/lib/mobile-nav";

const LAST_ORG = "alinhavo:ultima-org";
const noSubscribe = () => () => {};

/** Última organização aberta (no navegador), para Coleções e Moldes valerem no `/painel` e na conta. */
function useLastOrg(current: string): string {
  useEffect(() => {
    if (current) localStorage.setItem(LAST_ORG, current);
  }, [current]);
  const stored = useSyncExternalStore(
    noSubscribe,
    () => localStorage.getItem(LAST_ORG) ?? "",
    () => "",
  );
  return current || (isUuid(stored) ? stored : "");
}

/**
 * Barra de abas fixa no rodapé do painel, só no celular (abaixo do md). O desenho que todo mundo já conhece
 * dos apps (Lei de Jakob): Início à esquerda, Criar no meio, o perfil (a foto) à direita, cinco abas.
 */
export function MobileTabBar({ avatar }: { avatar: React.ReactNode }) {
  const path = usePathname();
  const org = useLastOrg(orgFromPath(path));
  const sheet = useRef<HTMLDialogElement>(null);
  if (!showMobileNav(path)) return null;

  const active = activeTab(path);
  const hrefs = tabHrefs(org);
  const actions = createActions(org);

  return (
    <>
      <nav
        aria-label="Navegação principal"
        data-mobile-nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-tinta/10 bg-papel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          <Tab href={hrefs.inicio} label="Início" on={active === "inicio"} icon={<ModuleIcon name="inicio" className="size-6" />} />
          <Tab href={hrefs.colecoes} label="Coleções" on={active === "colecoes"} icon={<ModuleIcon name="colecoes" className="size-6" />} />
          <li className="grid place-items-center">
            <button
              type="button"
              onClick={() => sheet.current?.showModal()}
              disabled={actions.length === 0}
              aria-haspopup="dialog"
              className="grid size-12 place-items-center rounded-2xl bg-tinta text-papel transition active:scale-95 disabled:opacity-40"
              title={actions.length === 0 ? "Abra uma organização para criar" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="sr-only">Criar</span>
            </button>
          </li>
          <Tab href={hrefs.moldes} label="Moldes" on={active === "moldes"} icon={<ModuleIcon name="moldes" className="size-6" />} />
          <Tab href={hrefs.perfil} label="Perfil" on={active === "perfil"} icon={avatar} />
        </ul>
      </nav>

      <dialog
        ref={sheet}
        aria-label="Criar"
        className="folha-sobe fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-3xl border-t border-tinta/10 bg-white p-0 pb-[env(safe-area-inset-bottom)] text-tinta backdrop:bg-tinta/40 md:hidden"
        // Toque fora da folha (no fundo escuro) fecha, como nos apps.
        onClick={(e) => e.target === e.currentTarget && sheet.current?.close()}
      >
        <div className="px-5 pt-3 pb-5">
          <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-tinta/15" />
          <p className="mt-4 font-display text-xl font-semibold">Criar</p>
          <ul className="mt-3 grid gap-1">
            {actions.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  onClick={() => sheet.current?.close()}
                  className="flex min-h-14 items-center gap-4 rounded-xl px-3 py-2.5 hover:bg-papel focus-visible:bg-papel"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel text-linha">
                    <ModuleIcon name={a.icon} className="size-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{a.label}</span>
                    <span className="block text-sm text-tinta-suave">{a.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => sheet.current?.close()} className="mt-3 min-h-12 w-full rounded-xl text-sm text-tinta-suave hover:bg-papel">
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}

function Tab({ href, label, on, icon }: { href: string | null; label: string; on: boolean; icon: React.ReactNode }) {
  const cls = `flex h-full flex-col items-center justify-center gap-1 text-[11px] transition ${on ? "text-linha" : "text-tinta-suave"}`;
  const body = (
    <>
      <span className={`grid size-7 place-items-center ${on ? "[&_img]:ring-2 [&_img]:ring-linha [&>span]:ring-2 [&>span]:ring-linha" : ""}`}>{icon}</span>
      <span className={on ? "font-medium" : ""}>{label}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} aria-current={on ? "page" : undefined} className={cls}>
          {body}
        </Link>
      ) : (
        <span aria-disabled="true" title="Abra uma organização primeiro" className={`${cls} opacity-40`}>
          {body}
        </span>
      )}
    </li>
  );
}
