import Link from "next/link";

export type PageTab = { id: string; label: string; href: string; count?: number | null; alert?: boolean };

/** Abas de uma tela (links: cada aba tem endereço próprio e o voltar do navegador funciona). */
export function PageTabs({ label, tabs, current }: { label: string; tabs: PageTab[]; current: string }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto" data-tabs>
      <ul className="flex min-w-max gap-1 border-b border-tinta/10">
        {tabs.map((t) => {
          const on = t.id === current;
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                scroll={false}
                aria-current={on ? "page" : undefined}
                data-tab={t.id}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition ${on ? "border-linha font-medium text-tinta" : "border-transparent text-tinta-suave hover:text-tinta"}`}
              >
                {t.label}
                {t.count !== undefined && t.count !== null && (
                  <span className={`rounded-full px-1.5 font-mono text-[11px] ${t.alert ? "bg-linha/10 text-linha" : "bg-papel-escuro text-tinta-suave"}`}>{t.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Filtros em pílulas (links), com a contagem de cada um. */
export function FilterChips({ label, items, current }: { label: string; items: PageTab[]; current: string }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto" data-filters>
      <ul className="flex min-w-max gap-2 px-1 py-0.5">
        {items.map((f) => {
          const on = f.id === current;
          const tone = on
            ? "border-tinta bg-tinta text-papel"
            : f.alert
              ? "border-linha/30 bg-white text-linha hover:border-linha"
              : "border-tinta/15 bg-white text-tinta-suave hover:border-tinta/40 hover:text-tinta";
          return (
            <li key={f.id}>
              <Link
                href={f.href}
                scroll={false}
                aria-current={on ? "true" : undefined}
                data-filter={f.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${tone}`}
              >
                {f.label}
                {f.count !== undefined && f.count !== null && <span className="font-mono text-[11px] opacity-80">{f.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
