import { isUuid } from "./ids";

/**
 * Barra de abas do celular no painel (Lei de Jakob: o desenho do Instagram, TikTok e YouTube).
 * Cinco abas, no máximo: o início à esquerda, criar no meio, o perfil à direita.
 */
export type MobileTab = "inicio" | "colecoes" | "criar" | "moldes" | "perfil";

/** Telas de trabalho em tela cheia (editor, Prova, encaixe, scan) e a conversa do suporte: nada flutua por cima. */
export const FULL_SCREEN = /\/moldes\/[^/]+(\/prova)?$|\/encaixe|\/scan|^\/painel\/(admin\/)?suporte/;

/** A organização do endereço (`/painel/<org>/…`), ou "". */
export function orgFromPath(path: string): string {
  const segment = path.split("/")[2] ?? "";
  return isUuid(segment) ? segment : "";
}

/** A barra não aparece nas telas de tela cheia nem no superadmin (que tem as abas dele). */
export function showMobileNav(path: string): boolean {
  if (!path.startsWith("/painel")) return false;
  if (path.startsWith("/painel/admin")) return false;
  return !FULL_SCREEN.test(path);
}

/** Aba acesa no endereço; null quando nenhuma corresponde (ex.: Medidas, que fica nas abas do topo). */
export function activeTab(path: string): MobileTab | null {
  if (path === "/painel/conta" || path.startsWith("/painel/conta/")) return "perfil";
  const org = orgFromPath(path);
  if (!org) return path === "/painel" ? "inicio" : null;
  const first = path.split("/")[3] ?? "";
  if (first === "") return "inicio";
  if (first === "colecoes" || first === "produtos") return "colecoes";
  if (first === "moldes") return "moldes";
  return null;
}

/** Ação da folha "Criar". */
export type CreateAction = { label: string; detail: string; href: string; icon: "moldes" | "colecoes" | "scan" };

export function createActions(orgId: string): CreateAction[] {
  if (!orgId) return [];
  const base = `/painel/${orgId}`;
  return [
    { label: "Novo molde", detail: "Em branco ou a partir de um exemplo", href: `${base}/moldes#novo-molde`, icon: "moldes" },
    { label: "Escanear molde", detail: "Foto do molde de papel vira molde digital", href: `${base}/moldes/scan`, icon: "scan" },
    { label: "Nova coleção", detail: "Para organizar os produtos e os prazos", href: `${base}/colecoes#nova-colecao`, icon: "colecoes" },
  ];
}

/** Endereços das abas. Sem organização (no `/painel`, na conta), Coleções e Moldes usam a última aberta. */
export function tabHrefs(orgId: string): Record<Exclude<MobileTab, "criar">, string | null> {
  return {
    inicio: orgId ? `/painel/${orgId}` : "/painel",
    colecoes: orgId ? `/painel/${orgId}/colecoes` : null,
    moldes: orgId ? `/painel/${orgId}/moldes` : null,
    perfil: "/painel/conta",
  };
}

/** Distâncias dos gestos (px), valores do iOS: a borda é a faixa onde o voltar do sistema começa. */
export const EDGE_WIDTH = 24;
export const BACK_DISTANCE = 80;
export const PULL_DISTANCE = 72;
/** O indicador anda menos que o dedo (resistência), como nos apps. */
export const PULL_RESISTANCE = 0.5;

type Point = { x: number; y: number };

/** Arrastar da borda esquerda para a direita volta: começou na borda, andou o bastante e mais para o lado que para baixo. */
export function isEdgeSwipeBack(start: Point, end: Point): boolean {
  const dx = end.x - start.x;
  const dy = Math.abs(end.y - start.y);
  return start.x <= EDGE_WIDTH && dx >= BACK_DISTANCE && dy < dx / 2;
}

/** Quanto o indicador de atualizar desce para um puxão de `dy` px (com resistência, até 1,5× o limite). */
export function pullOffset(dy: number): number {
  if (dy <= 0) return 0;
  return Math.min(dy * PULL_RESISTANCE, PULL_DISTANCE * 1.5);
}

/** Soltou com o indicador no limite (o dedo andou `PULL_DISTANCE ÷ PULL_RESISTANCE`): atualiza. */
export function pullReleased(dy: number): boolean {
  return pullOffset(dy) >= PULL_DISTANCE;
}
