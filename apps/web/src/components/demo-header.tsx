import Link from "next/link";
import { BrandLogo } from "./brand-mark";
import { ModuleIcon, type ModuleIconName } from "./icons";
import { ui } from "./ui";

const DEMOS: { id: "editor" | "prova" | "scan"; href: string; label: string; icon: ModuleIconName }[] = [
  { id: "editor", href: "/experimentar", label: "Molde", icon: "moldes" },
  { id: "prova", href: "/experimentar/prova", label: "Prova 3D", icon: "prova" },
  { id: "scan", href: "/experimentar/scan", label: "Scan", icon: "scan" },
];

/**
 * Barra do /experimentar: o logo, os três módulos que dá para testar sem conta e o convite para criar
 * a conta (o mesmo "Criar conta grátis" da página inicial). Embaixo, a faixa que lembra que nada é salvo.
 */
export function DemoHeader({ current }: { current: "editor" | "prova" | "scan" }) {
  return (
    <header className="border-b border-tinta/10 bg-papel">
      <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Alinhavo, página inicial" className="rounded-md">
          <BrandLogo size="sm" />
        </Link>
        <nav aria-label="Experimentar" className="order-last -mx-1 w-full overflow-x-auto sm:order-none sm:w-auto">
          <ul className="flex min-w-max items-center gap-1">
            {DEMOS.map((d) => {
              const on = d.id === current;
              return (
                <li key={d.id}>
                  <Link
                    href={d.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${on ? "bg-white font-medium text-linha shadow-[inset_0_0_0_1px_rgb(29_27_24/0.1)]" : "text-tinta-suave hover:text-tinta"}`}
                  >
                    <ModuleIcon name={d.icon} className="size-[18px]" />
                    {d.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/entrar" className="hidden rounded-lg px-3 py-1.5 text-sm text-tinta-suave hover:text-tinta sm:inline-flex">
            Entrar
          </Link>
          <Link href="/entrar?modo=criar" className={`${ui.buttonAccentSm}`}>
            Criar conta grátis
          </Link>
        </div>
      </div>
      <p className="bg-tinta px-4 py-1.5 text-center font-mono text-[11px] tracking-[0.12em] text-papel/85 uppercase">
        Demonstração · nada é salvo<span className="hidden sm:inline"> · crie a conta para guardar seus moldes</span>
      </p>
    </header>
  );
}
