/**
 * Ícones dos módulos (marca/README.md, seção 7): traço 1,6, cantos redondos, grade 24.
 * Desenhados aqui, sem biblioteca: cada um é um objeto do ofício (cabide, molde, fita, rolo…).
 */
export type ModuleIconName = "inicio" | "colecoes" | "moldes" | "medidas" | "tecidos" | "encaixes" | "prova" | "scan";

const PATHS: Record<ModuleIconName, React.ReactNode> = {
  // Mesa de corte: a casa da organização.
  inicio: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9v10.5h12V9" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  // Cabide: a coleção.
  colecoes: (
    <>
      <path d="M10 6.2a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v1" />
      <path d="M12 10 3.6 16.3c-.6.5-.3 1.4.5 1.4h15.8c.8 0 1.1-.9.5-1.4Z" />
    </>
  ),
  // Parte do molde com a cava curva e um pique.
  moldes: (
    <>
      <path d="M6 3.5h7c.3 3.2 2.4 5.3 5 6v11H6Z" />
      <path d="M6 12h2" />
      <path d="M11 15.5v2" strokeDasharray="1.6 1.6" />
    </>
  ),
  // Fita métrica.
  medidas: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M10 8v2M13 8v3M16 8v2M19 8v3" />
    </>
  ),
  // Rolo de tecido.
  tecidos: (
    <>
      <ellipse cx="7" cy="12" rx="3" ry="7" />
      <path d="M7 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7" />
      <ellipse cx="7" cy="12" rx="0.9" ry="2" />
    </>
  ),
  // Risco: peças encaixadas no tecido.
  encaixes: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M6 8h4.5l-1.5 8H6Z" />
      <path d="M12.5 8H18v8h-7Z" />
    </>
  ),
  // Manequim de costura.
  prova: (
    <>
      <path d="M9 3.5h6" />
      <path d="M9 3.5c0 2.5-2.5 4-2.5 7.5 0 2.6 2 3.6 2 6h7c0-2.4 2-3.4 2-6 0-3.5-2.5-5-2.5-7.5" />
      <path d="M12 17v3.5M9 20.5h6" />
    </>
  ),
  // Visor sobre um molde de papel.
  scan: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M9 8h4.5l1.5 8H9Z" />
    </>
  ),
};

export function ModuleIcon({ name, className = "size-5" }: { name: ModuleIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** O pique: pequeno entalhe triangular que marca início de seção ou item (marca/README.md, seção 7). */
export function Pique({ className = "size-2.5 text-linha" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={`shrink-0 ${className}`} fill="currentColor" aria-hidden="true">
      <path d="M0 0h10L5 7Z" />
    </svg>
  );
}
