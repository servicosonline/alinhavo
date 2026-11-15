import { readMeasurements } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { findTemplate, gridRows, SIZE_CHART_TEMPLATES } from "./size-chart-templates";

describe("tabelas de medidas prontas", () => {
  it("ids únicos, base na grade e tamanhos sem repetição", () => {
    const ids = SIZE_CHART_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SIZE_CHART_TEMPLATES) {
      expect(t.sizes).toContain(t.base);
      expect(new Set(t.sizes).size).toBe(t.sizes.length);
      // Mesmo formato que o banco aceita (minúsculo, sem espaço nas pontas, até 60).
      for (const m of t.measurements) expect(m.name).toBe(m.name.trim().toLowerCase());
    }
  });

  it("toda medida do modelo é lida pelo manequim da Prova (nenhuma ignorada)", () => {
    for (const t of SIZE_CHART_TEMPLATES) {
      const table = Object.fromEntries(t.measurements.map((m) => [m.name, 1000]));
      expect(readMeasurements(table).ignored, t.id).toEqual([]);
    }
  });

  it("nenhum número sem fonte", () => {
    for (const t of SIZE_CHART_TEMPLATES) {
      if (t.values) expect(t.values.source.trim().length, t.id).toBeGreaterThan(0);
    }
  });

  it("a grade mostra as medidas do modelo mesmo sem valor, e as extras depois", () => {
    const t = findTemplate("feminino-adulto");
    const rows = gridRows(t, ["gancho", "busto"]);
    expect(rows.slice(0, 3)).toEqual(["altura", "busto", "cintura"]);
    expect(rows.at(-1)).toBe("gancho");
    expect(rows.filter((r) => r === "busto")).toHaveLength(1);
    expect(gridRows(null, ["gancho"])).toEqual(["gancho"]);
    expect(findTemplate("nao-existe")).toBeNull();
  });
});
