import type { ModuleIconName } from "@/components/icons";

/** Módulos do painel, na ordem do trabalho: coleção → molde → medidas → tecido → encaixe. */
export const MODULES: { slug: string; label: string; icon: ModuleIconName; also?: string[] }[] = [
  { slug: "", label: "Início", icon: "inicio" },
  // O produto (e o encaixe dele) mora dentro da coleção.
  { slug: "colecoes", label: "Coleções", icon: "colecoes", also: ["produtos"] },
  { slug: "moldes", label: "Moldes", icon: "moldes" },
  { slug: "medidas", label: "Medidas", icon: "medidas" },
  { slug: "tecidos", label: "Tecidos", icon: "tecidos" },
  { slug: "encaixes", label: "Fila de encaixes", icon: "encaixes" },
];

/** O módulo de uma rota do painel ("" = início da organização). */
export function activeModule(pathname: string, orgId: string): string {
  const base = `/painel/${orgId}`;
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return "";
  const first = pathname.slice(base.length).split("/")[1] ?? "";
  return MODULES.find((m) => m.slug === first || m.also?.includes(first))?.slug ?? "";
}
