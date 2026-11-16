import { describe, expect, it } from "vitest";
import {
  activeTab,
  BACK_DISTANCE,
  createActions,
  EDGE_WIDTH,
  isEdgeSwipeBack,
  orgFromPath,
  PULL_DISTANCE,
  PULL_RESISTANCE,
  pullOffset,
  pullReleased,
  showMobileNav,
  tabHrefs,
} from "./mobile-nav";

const org = "00000000-0000-4000-8000-000000000001";

describe("barra de abas do celular", () => {
  it("lê a organização do endereço", () => {
    expect(orgFromPath(`/painel/${org}/moldes`)).toBe(org);
    expect(orgFromPath("/painel/conta")).toBe("");
    expect(orgFromPath("/painel")).toBe("");
  });

  it("some nas telas de tela cheia, no superadmin e fora do painel", () => {
    expect(showMobileNav("/painel")).toBe(true);
    expect(showMobileNav(`/painel/${org}/colecoes`)).toBe(true);
    expect(showMobileNav(`/painel/${org}/moldes`)).toBe(true);
    expect(showMobileNav(`/painel/${org}/moldes/abc`)).toBe(false);
    expect(showMobileNav(`/painel/${org}/moldes/abc/prova`)).toBe(false);
    expect(showMobileNav(`/painel/${org}/moldes/scan`)).toBe(false);
    expect(showMobileNav(`/painel/${org}/produtos/abc/encaixe`)).toBe(false);
    expect(showMobileNav("/painel/suporte/1")).toBe(false);
    expect(showMobileNav("/painel/admin")).toBe(false);
    expect(showMobileNav("/experimentar")).toBe(false);
  });

  it("acende a aba do endereço", () => {
    expect(activeTab("/painel")).toBe("inicio");
    expect(activeTab(`/painel/${org}`)).toBe("inicio");
    expect(activeTab(`/painel/${org}/colecoes/x`)).toBe("colecoes");
    expect(activeTab(`/painel/${org}/produtos/x`)).toBe("colecoes");
    expect(activeTab(`/painel/${org}/moldes`)).toBe("moldes");
    expect(activeTab("/painel/conta")).toBe("perfil");
    expect(activeTab(`/painel/${org}/medidas`)).toBeNull();
    expect(activeTab("/painel/notificacoes")).toBeNull();
  });

  it("tem no máximo cinco abas, com início à esquerda e perfil à direita", () => {
    const tabs = Object.keys(tabHrefs(org));
    expect(tabs[0]).toBe("inicio");
    expect(tabs.at(-1)).toBe("perfil");
    expect(tabs.length + 1).toBeLessThanOrEqual(5); // + Criar, no meio
  });

  it("sem organização, Coleções e Moldes ficam sem endereço e não há o que criar", () => {
    expect(tabHrefs("")).toEqual({ inicio: "/painel", colecoes: null, moldes: null, perfil: "/painel/conta" });
    expect(createActions("")).toEqual([]);
    expect(createActions(org).map((a) => a.href.startsWith(`/painel/${org}/`))).toEqual([true, true, true]);
  });
});

describe("gestos do app instalado", () => {
  it("voltar só começa na borda esquerda e precisa ir para o lado", () => {
    expect(isEdgeSwipeBack({ x: 5, y: 300 }, { x: 5 + BACK_DISTANCE, y: 310 })).toBe(true);
    expect(isEdgeSwipeBack({ x: EDGE_WIDTH + 1, y: 300 }, { x: 300, y: 300 })).toBe(false);
    expect(isEdgeSwipeBack({ x: 5, y: 300 }, { x: 5 + BACK_DISTANCE - 1, y: 300 })).toBe(false);
    expect(isEdgeSwipeBack({ x: 5, y: 300 }, { x: 105, y: 400 })).toBe(false); // mais para baixo que para o lado
  });

  it("puxar para atualizar tem resistência e um limite", () => {
    expect(pullOffset(-20)).toBe(0);
    expect(pullOffset(100)).toBe(100 * PULL_RESISTANCE);
    expect(pullOffset(10_000)).toBe(PULL_DISTANCE * 1.5);
    expect(pullReleased(PULL_DISTANCE / PULL_RESISTANCE - 1)).toBe(false);
    expect(pullReleased(PULL_DISTANCE / PULL_RESISTANCE)).toBe(true);
  });
});
