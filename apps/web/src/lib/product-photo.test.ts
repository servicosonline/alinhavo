import { describe, expect, it } from "vitest";
import type { FlatSketch } from "@alinhavo/export/flat-sketch";
import { byteaToBytes, imageMime, isProductPhotoPath, initialsSvg, pickApprovalImage, productInitials, productThumbUrl } from "./product-photo";
import { sketchThumbnailSvg } from "./product-sketch-thumb";

describe("foto do produto", () => {
  it("iniciais: duas letras do nome, em maiúscula; sem nome, a referência", () => {
    expect(productInitials("Calça pantalona")).toBe("CP");
    expect(productInitials("vestido")).toBe("V");
    expect(productInitials("  ", "CAL-001")).toBe("C");
    expect(productInitials("", null)).toBe("?");
  });

  it("o quadro das iniciais escapa o texto (é um SVG servido como imagem)", () => {
    const svg = initialsSvg("<b> & x");
    expect(svg).toContain("&lt;&amp;");
    expect(svg).not.toContain("<b>");
  });

  it("endereço da miniatura, com a versão quando a foto muda", () => {
    expect(productThumbUrl("o", "p")).toBe("/painel/o/produtos/p/miniatura");
    expect(productThumbUrl("o", "p", "o/p/a b.webp")).toBe("/painel/o/produtos/p/miniatura?v=o%2Fp%2Fa%20b.webp");
  });

  it("aprovação: a mais recente com imagem, de frente antes das outras", () => {
    const imgs = [
      { id: "1", approval_id: "velha", angle: "frente", position: 0 },
      { id: "2", approval_id: "nova", angle: "costas", position: 0 },
      { id: "3", approval_id: "nova", angle: "frente", position: 2 },
      { id: "4", approval_id: "nova", angle: "lado", position: 1 },
    ];
    expect(pickApprovalImage(["vazia", "nova", "velha"], imgs)?.id).toBe("3");
    expect(pickApprovalImage(["vazia"], imgs)).toBeNull();
    expect(pickApprovalImage(["nova"], imgs.filter((i) => i.angle !== "frente"))?.id).toBe("4");
  });

  it("bytea do PostgREST vira bytes; outra coisa, null", () => {
    expect(Array.from(byteaToBytes("\\xffd8ff00")!)).toEqual([255, 216, 255, 0]);
    expect(byteaToBytes("ffd8")).toBeNull();
    expect(byteaToBytes("\\xzz")).toBeNull();
    expect(byteaToBytes(null)).toBeNull();
  });

  it("tipo pela extensão", () => {
    expect(imageMime("a/b/c.png")).toBe("image/png");
    expect(imageMime("a/b/c.webp")).toBe("image/webp");
    expect(imageMime("a/b/c.jpg")).toBe("image/jpeg");
  });

  it("desenho técnico: a vista de frente num quadrado; sem contorno, null", () => {
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }, { x: 0, y: 300 }];
    const view = (side: "frente" | "costas") => ({ side, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 300 }, outline: [square], pieces: [square], marks: [] });
    const sketch = { views: [view("costas"), view("frente")], skipped: [] } as unknown as FlatSketch;
    const svg = sketchThumbnailSvg(sketch)!;
    expect(svg).toMatch(/^<svg [^>]*viewBox="-124 -24 348 348"/);
    expect(svg.match(/<path/g)).toHaveLength(2);
    expect(sketchThumbnailSvg({ views: [{ ...view("frente"), outline: [] }], skipped: [] } as unknown as FlatSketch)).toBeNull();
  });

  it("caminho da foto enviada: só a pasta do próprio produto, nome e extensão válidos", () => {
    const org = "11111111-1111-4111-8111-111111111111";
    const prod = "22222222-2222-4222-8222-222222222222";
    expect(isProductPhotoPath(`${org}/${prod}/abc123.webp`, org, prod)).toBe(true);
    expect(isProductPhotoPath(`${org}/${prod}/abc.gif`, org, prod)).toBe(false);
    expect(isProductPhotoPath(`${org}/${prod}/../x.webp`, org, prod)).toBe(false);
    expect(isProductPhotoPath(`${prod}/${org}/abc.webp`, org, prod)).toBe(false);
    expect(isProductPhotoPath(`${org}/abc.webp`, org, prod)).toBe(false);
  });
});
