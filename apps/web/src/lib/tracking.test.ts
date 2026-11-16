import { describe, expect, it } from "vitest";
import { openedAgo, readShow, readTrackingView, readValidity, whatsappUrl } from "./tracking";

describe("link de acompanhamento", () => {
  it("lê as opções marcadas; nada marcado é recusado", () => {
    const f = new FormData();
    f.set("status", "on");
    f.set("imagens", "on");
    f.set("preco", "on"); // desconhecida: ignorada
    expect(readShow(f)).toEqual({ status: true, prazos: false, cronograma: false, imagens: true, molde: false });
    expect(readShow(new FormData())).toBeNull();
  });

  it("validade: 7, 14, 30 ou sem prazo", () => {
    expect(readValidity("14")).toBe(14);
    expect(readValidity("sem")).toBeNull();
    expect(readValidity("45")).toBeUndefined();
  });

  it("lê a resposta do banco sem confiar no formato", () => {
    const v = readTrackingView({
      kind: "produto",
      org_name: "Ateliê",
      title: "Saia",
      show: { status: true },
      products: [
        { name: "Saia", status: "prova", images: [{ angle: "frente", mime: "image/jpeg", data: "AA" }, { mime: "text/html", data: "x" }] },
        null,
      ],
    })!;
    expect(v.products).toHaveLength(1);
    expect(v.products[0]!.status).toBe("prova");
    expect(v.products[0]!.images).toHaveLength(1); // só JPEG/PNG
    expect(v.milestones).toBeNull();
    expect(readTrackingView(null)).toBeNull();
    expect(readTrackingView({ kind: "outra" })).toBeNull();
  });

  it("texto do WhatsApp e quando foi aberto", () => {
    expect(decodeURIComponent(whatsappUrl("https://x/acompanhar/1", "Saia Lia", "Ateliê Rita"))).toContain('"Saia Lia" com Ateliê Rita: https://x/acompanhar/1');
    const agora = new Date("2026-11-15T12:00:00Z");
    expect(openedAgo(null, agora)).toBeNull();
    expect(openedAgo("2026-11-15T11:58:00Z", agora)).toBe("agora há pouco");
    expect(openedAgo("2026-11-15T09:00:00Z", agora)).toBe("há 3 h");
    expect(openedAgo("2026-11-13T12:00:00Z", agora)).toBe("há 2 dias");
  });
});
