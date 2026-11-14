import { emptyDocument, flattenOutline, validatePattern, type Point } from "@alinhavo/geometry";
import { describe, expect, it } from "vitest";
import { traceOuterBoundary } from "./contour";
import { applyHomography, fitHomography, invertHomography } from "./homography";
import { paperIsBright, scanPhoto, type ScanSuccess } from "./scan";
import { outlineToPiece } from "./shape";
import { A4_SHEET } from "./sheet";
import { cubicPoints, linePoints, renderPhoto } from "./synthetic";

const segDist = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const toPolyline = (p: Point, poly: Point[]) => Math.min(...poly.map((a, i) => segDist(p, a, poly[(i + 1) % poly.length]!)));
/** Maior distância entre os dois contornos (nos dois sentidos). */
const hausdorff = (a: Point[], b: Point[]) => Math.max(Math.max(...a.map((p) => toPolyline(p, b))), Math.max(...b.map((p) => toPolyline(p, a))));

/** Molde de teste: topo reto com pique, lateral curva, barra reta, lateral reta com pique. */
function molde(withNotches: boolean): Point[] {
  const top = withNotches
    ? [...linePoints({ x: 300, y: 0 }, { x: 467.5, y: 0 }, 60), ...linePoints({ x: 467.5, y: 0 }, { x: 470, y: 6 }, 6), ...linePoints({ x: 470, y: 6 }, { x: 472.5, y: 0 }, 6), ...linePoints({ x: 472.5, y: 0 }, { x: 650, y: 0 }, 60)]
    : linePoints({ x: 300, y: 0 }, { x: 650, y: 0 }, 120);
  const right = cubicPoints({ x: 650, y: 0 }, { x: 680, y: 150 }, { x: 705, y: 350 }, { x: 700, y: 520 }, 200);
  const bottom = linePoints({ x: 700, y: 520 }, { x: 300, y: 540 }, 120);
  const left = withNotches
    ? [...linePoints({ x: 300, y: 540 }, { x: 300, y: 272.5 }, 80), ...linePoints({ x: 300, y: 272.5 }, { x: 306, y: 270 }, 6), ...linePoints({ x: 306, y: 270 }, { x: 300, y: 267.5 }, 6), ...linePoints({ x: 300, y: 267.5 }, { x: 300, y: 0 }, 80)]
    : linePoints({ x: 300, y: 540 }, { x: 300, y: 0 }, 160);
  return [...top, ...right, ...bottom, ...left];
}
const TRUE_CORNERS = [
  { x: 300, y: 0 },
  { x: 650, y: 0 },
  { x: 700, y: 520 },
  { x: 300, y: 540 },
];
const TRUE_PIQUES = [
  { x: 470, y: 0 },
  { x: 300, y: 270 },
];

/** Câmera: a cena (mm) vista em perspectiva numa foto de 1800 × 1400. */
function camera(rotationDeg = 0) {
  const scene = [
    { x: -40, y: -60 },
    { x: 800, y: -60 },
    { x: 800, y: 620 },
    { x: -40, y: 620 },
  ];
  const photo = [
    { x: 60, y: 40 },
    { x: 1740, y: 90 },
    { x: 1700, y: 1370 },
    { x: 100, y: 1340 },
  ];
  const a = (rotationDeg * Math.PI) / 180;
  const rot = photo.map((p) => ({ x: 900 + (p.x - 900) * Math.cos(a) * 0.8 - (p.y - 700) * Math.sin(a) * 0.8, y: 700 + (p.x - 900) * Math.sin(a) * 0.8 + (p.y - 700) * Math.cos(a) * 0.8 }));
  return fitHomography(scene, rot);
}

const scanned = (r: ScanSuccess) => flattenOutline(r.piece).polygon.map((p) => ({ x: p.x + r.offsetMm.x, y: p.y + r.offsetMm.y }));
const nearest = (p: Point, list: Point[]) => Math.min(...list.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));

describe("homografia", () => {
  it("acha a perspectiva certa e a inversa volta ao ponto", () => {
    const H = camera(12);
    const pts = [
      { x: 0, y: 0 },
      { x: 500, y: 30 },
      { x: 120, y: 400 },
      { x: 700, y: 600 },
      { x: 333, y: 222 },
    ];
    const fitted = fitHomography(
      pts,
      pts.map((p) => applyHomography(H, p)),
    );
    for (const p of pts) {
      const q = applyHomography(fitted, p);
      const r = applyHomography(H, p);
      expect(Math.hypot(q.x - r.x, q.y - r.y)).toBeLessThan(1e-6);
      const back = applyHomography(invertHomography(fitted), q);
      expect(Math.hypot(back.x - p.x, back.y - p.y)).toBeLessThan(1e-6);
    }
    expect(() => fitHomography(pts.slice(0, 3), pts.slice(0, 3))).toThrow();
  });
});

describe("quem é papel", () => {
  it("decide pela moldura da foto, não pela borda da grade (que fica quase toda fora da foto)", () => {
    // Grade 20×20; a foto é um losango (cantos da grade fora dela). Mesa escura
    // (40), papel claro (200) no meio e reflexos claros (200) justo onde o
    // losango encosta em três bordas da grade: lá a regra antiga errava.
    const w = 20;
    const h = 20;
    const photo = new Float32Array(w * h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const inPhoto = Math.abs(i - 9.5) + Math.abs(j - 9.5) <= 10;
        const paper = i >= 7 && i <= 12 && j >= 7 && j <= 12;
        const glare = [
          [0, 9.5],
          [9.5, 0],
          [19, 9.5],
        ].some(([x, y]) => Math.hypot(i - x!, j - y!) <= 1.6);
        photo[j * w + i] = !inPhoto ? Number.NaN : paper || glare ? 200 : 40;
      }
    expect(paperIsBright(photo, photo, w, h, 120)).toBe(true);
    // Papel escuro sobre mesa clara: o contrário.
    const inverse = photo.map((v) => (Number.isNaN(v) ? v : 240 - v));
    expect(paperIsBright(inverse, inverse, w, h, 120)).toBe(false);
  });
});

describe("contorno da máscara", () => {
  it("segue a borda dos pixels com o papel à direita, só nos vértices", () => {
    // L: três pixels.
    const mask = { width: 3, height: 3, data: new Uint8Array([1, 0, 0, 1, 1, 0, 0, 0, 0]) };
    expect(traceOuterBoundary(mask)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    expect(traceOuterBoundary({ width: 2, height: 2, data: new Uint8Array(4) })).toEqual([]);
  });
});

describe("contorno → parte de molde", () => {
  it("retângulo com pique: 4 cantos retos, 1 pique, só retas, molde válido", () => {
    const rect = [
      ...linePoints({ x: 0, y: 0 }, { x: 97.5, y: 0 }, 200),
      ...linePoints({ x: 97.5, y: 0 }, { x: 100, y: 5 }, 10),
      ...linePoints({ x: 100, y: 5 }, { x: 102.5, y: 0 }, 10),
      ...linePoints({ x: 102.5, y: 0 }, { x: 200, y: 0 }, 200),
      ...linePoints({ x: 200, y: 0 }, { x: 200, y: 150 }, 300),
      ...linePoints({ x: 200, y: 150 }, { x: 0, y: 150 }, 400),
      ...linePoints({ x: 0, y: 150 }, { x: 0, y: 0 }, 300),
    ];
    const r = outlineToPiece(rect, "Retângulo");
    expect(r.corners).toHaveLength(4);
    for (const c of [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 150 },
      { x: 0, y: 150 },
    ])
      expect(nearest(c, r.corners)).toBeLessThan(0.8);
    expect(r.piques).toHaveLength(1);
    expect(nearest({ x: 100, y: 0 }, r.piques)).toBeLessThan(1);
    expect(r.piece.outline.every((s) => s.kind === "line")).toBe(true);
    expect(Object.keys(r.piece.points)).toContain("pique1");
    const doc = emptyDocument(["M"], "M");
    doc.pieces = [r.piece];
    expect(validatePattern(doc)).toEqual([]);
  });

  it("círculo (sem cantos) vira curvas fiéis", () => {
    const circle = Array.from({ length: 1200 }, (_, k) => ({ x: 100 + 80 * Math.cos((k / 1200) * 2 * Math.PI), y: 100 + 80 * Math.sin((k / 1200) * 2 * Math.PI) }));
    const r = outlineToPiece(circle);
    expect(r.corners.length).toBeLessThanOrEqual(4);
    expect(r.piques).toHaveLength(0);
    expect(r.piece.outline.some((s) => s.kind === "cubic")).toBe(true);
    const flat = flattenOutline(r.piece).polygon;
    const minX = Math.min(...circle.map((p) => p.x));
    const minY = Math.min(...circle.map((p) => p.y));
    expect(hausdorff(flat.map((p) => ({ x: p.x + minX, y: p.y + minY })), circle)).toBeLessThan(0.8);
  });
});

describe("scan de foto (sintética)", () => {
  it("mede o molde em mm a partir da foto em perspectiva: contorno, cantos e piques", { timeout: 60_000 }, () => {
    const photo = renderPhoto({ sheet: A4_SHEET, paper: molde(true) }, camera(), 1800, 1400);
    const r = scanPhoto(photo, { name: "Frente" });
    if (!r.ok) throw new Error(r.error);
    expect(r.markers).toEqual([0, 1, 2, 3]);
    expect(r.markerErrorMm).toBeLessThan(0.5);
    expect(r.warnings).toEqual([]);
    // Contorno a no máximo 1,2 mm do real (com os piques fechados).
    expect(hausdorff(scanned(r), molde(false))).toBeLessThan(1.2);
    const pos = (list: Point[]) => list.map((p) => ({ x: p.x + r.offsetMm.x, y: p.y + r.offsetMm.y }));
    expect(r.corners).toHaveLength(4);
    for (const c of TRUE_CORNERS) expect(nearest(c, pos(r.corners))).toBeLessThan(1.5);
    expect(r.piques).toHaveLength(2);
    for (const q of TRUE_PIQUES) expect(nearest(q, pos(r.piques))).toBeLessThan(2);
    // A lateral curva sai como curva; o topo, a barra e a outra lateral como retas.
    expect(r.piece.outline.filter((s) => s.kind === "cubic").length).toBeGreaterThan(0);
    expect(r.piece.name).toBe("Frente");
    const doc = emptyDocument(["M"], "M");
    doc.pieces = [r.piece];
    expect(validatePattern(doc)).toEqual([]);
  });

  it("foto girada e mais longe: mesma medida", { timeout: 60_000 }, () => {
    const photo = renderPhoto({ sheet: A4_SHEET, paper: molde(true) }, camera(25), 1800, 1400, { seed: 9, light: 0.25 });
    const r = scanPhoto(photo);
    if (!r.ok) throw new Error(r.error);
    expect(hausdorff(scanned(r), molde(false))).toBeLessThan(1.5);
    expect(r.corners).toHaveLength(4);
    expect(r.piques).toHaveLength(2);
  });

  it("explica o que falta: sem marcador, um só marcador, molde fora da foto, pouco contraste", { timeout: 60_000 }, () => {
    const H = camera();
    const blank = renderPhoto({ sheet: A4_SHEET, markerIds: [], paper: molde(false) }, H, 900, 700, { supersample: 1 });
    expect(scanPhoto(blank)).toMatchObject({ ok: false, error: expect.stringMatching(/Nenhum marcador/) });

    const one = renderPhoto({ sheet: A4_SHEET, markerIds: [2], paper: molde(false) }, H, 1800, 1400, { supersample: 1 });
    expect(scanPhoto(one)).toMatchObject({ ok: false, error: expect.stringMatching(/Só um marcador/) });

    // Empurrado para a direita: passa da borda da foto.
    const off = molde(false).map((p) => ({ x: p.x + 300, y: p.y }));
    const cut = renderPhoto({ sheet: A4_SHEET, paper: off }, H, 1800, 1400, { supersample: 1 });
    expect(scanPhoto(cut)).toMatchObject({ ok: false, error: expect.stringMatching(/sai da foto/) });

    const flat = renderPhoto({ sheet: A4_SHEET, paper: molde(false), table: 205, paperValue: 220 }, H, 1800, 1400, { supersample: 1, light: 0 });
    expect(scanPhoto(flat)).toMatchObject({ ok: false, error: expect.stringMatching(/contraste/) });
  });

  it("reflexo tão claro quanto o papel, vindo da borda da foto, não vira o molde", { timeout: 60_000 }, () => {
    const glare = [
      { x: 740, y: -600 },
      { x: 2500, y: -600 },
      { x: 2500, y: 200 },
      { x: 740, y: 200 },
    ];
    const photo = renderPhoto({ sheet: A4_SHEET, paper: molde(true), extra: [{ polygon: glare, value: 210 }] }, camera(), 1800, 1400, { supersample: 1 });
    const r = scanPhoto(photo);
    if (!r.ok) throw new Error(r.error);
    expect(hausdorff(scanned(r), molde(false))).toBeLessThan(1.5);
    expect(r.warnings.some((w) => /borda da foto/.test(w))).toBe(true);
  });

  it("molde encostado na folha de marcadores é recusado", { timeout: 60_000 }, () => {
    const touching = molde(false).map((p) => ({ x: p.x - 90, y: p.y }));
    const photo = renderPhoto({ sheet: A4_SHEET, paper: touching }, camera(), 1800, 1400, { supersample: 1 });
    expect(scanPhoto(photo)).toMatchObject({ ok: false, error: expect.stringMatching(/encostado na folha/) });
  });
});
