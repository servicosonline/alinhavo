import { useId } from "react";

/**
 * O símbolo do Alinhavo (marca/README.md): duas partes do molde unidas por uma costura curva,
 * com os piques casando e o alinhavo vermelho no meio. `pieces` e `stitch` trocam as cores
 * (ex.: símbolo claro sobre fundo escuro).
 */
export function BrandSymbol({
  className = "size-8",
  pieces = "var(--tinta)",
  stitch = "var(--linha)",
}: {
  className?: string;
  pieces?: string;
  stitch?: string;
}) {
  const mask = `corte-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d="M38 0 C36 34 66 52 62 100" fill="none" stroke="#000" strokeWidth="8" />
          <path d="M46.6 42.4 L40.3 49.5 L49.9 50.1 Z M51.6 39.4 L61.2 40.0 L54.9 47.1 Z" fill="#000" />
        </mask>
      </defs>
      <rect x="6" y="6" width="88" height="88" rx="22" fill={pieces} mask={`url(#${mask})`} />
      <path
        d="M39.04 14.38 C43.32 35.54 58.43 52.25 61.73 80.27"
        pathLength={100}
        fill="none"
        stroke={stitch}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeDasharray="9.52 8.57"
      />
    </svg>
  );
}

/** Logo horizontal: símbolo + "alinhavo" em minúsculas na Fraunces macia. */
export function BrandLogo({
  className = "",
  light = false,
  size = "md",
}: {
  className?: string;
  light?: boolean;
  /** md: página inicial; sm: barra do app. */
  size?: "sm" | "md";
}) {
  return (
    <span className={`flex items-center ${size === "sm" ? "gap-2" : "gap-2.5"} ${className}`} aria-label="Alinhavo" role="img">
      <BrandSymbol className={size === "sm" ? "size-7" : "size-8"} pieces={light ? "var(--papel)" : "var(--tinta)"} />
      <span
        aria-hidden="true"
        className={`font-display leading-none font-semibold tracking-[-0.035em] ${size === "sm" ? "text-[1.45rem]" : "text-[1.7rem]"} ${light ? "text-papel" : ""}`}
      >
        alinhavo
      </span>
    </span>
  );
}
