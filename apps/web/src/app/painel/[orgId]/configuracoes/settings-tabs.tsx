import Link from "next/link";

export type SettingsTab = "geral" | "equipe" | "convidar" | "api";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "equipe", label: "Equipe" },
  { id: "convidar", label: "Convidar" },
  { id: "api", label: "API" },
];

/** Abas das configurações da organização (links: cada aba tem endereço próprio). A API mora em /api. */
export function SettingsTabs({ orgId, current }: { orgId: string; current: SettingsTab }) {
  return (
    <nav aria-label="Configurações da organização" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-tinta/10">
        {TABS.map((t) => {
          const href = t.id === "api" ? `/painel/${orgId}/api` : `/painel/${orgId}/configuracoes${t.id === "geral" ? "" : `?aba=${t.id}`}`;
          const on = t.id === current;
          return (
            <li key={t.id}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`-mb-px block border-b-2 px-4 py-2.5 text-sm transition ${on ? "border-linha font-medium text-tinta" : "border-transparent text-tinta-suave hover:text-tinta"}`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
