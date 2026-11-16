import { MEASUREMENT_KEYS, readMeasurements } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import {
  applySavedBody,
  cleanSavedBodyName,
  isSavedBodyActive,
  readSavedBodies,
  readSavedBody,
  readSavedConditions,
  savedBodyPayload,
  type SavedBody,
} from "./saved-bodies";

const TABELA_M = { altura: 1680, busto: 920, cintura: 740, quadril: 1000 };
const TABELA_G = { altura: 1700, busto: 1000, cintura: 820, quadril: 1080 };
const row = (measurements: unknown, conditions: unknown = {}, name = "Maria 42") => ({
  id: "b1",
  name,
  measurements,
  conditions,
  updated_at: "2026-11-15T10:00:00Z",
});

describe("manequim salvo", () => {
  it("nome: espaços juntados, de 1 a 60 letras", () => {
    expect(cleanSavedBodyName("  Maria   42 ")).toEqual({ ok: true, value: "Maria 42" });
    expect(cleanSavedBodyName("   ").ok).toBe(false);
    expect(cleanSavedBodyName(42).ok).toBe(false);
    expect(cleanSavedBodyName("x".repeat(61)).ok).toBe(false);
    expect(cleanSavedBodyName("x".repeat(60)).ok).toBe(true);
  });

  it("salvar guarda as 15 medidas do corpo que veste, em mm, e o salto junto das condições", () => {
    const values = readMeasurements(TABELA_M, { busto: 955.4 }).values;
    const p = savedBodyPayload(values, { belly: 1150, limbs: { leftArm: 1.5 } }, 80);
    expect(Object.keys(p.measurements).sort()).toEqual([...MEASUREMENT_KEYS].sort());
    expect(p.measurements.busto).toBe(955);
    expect(p.conditions).toEqual({ belly: 1150, heel: 80, limbs: { leftArm: 1.5 } });
    // Descalço não guarda salto.
    expect(savedBodyPayload(values, {}, 0).conditions).toEqual({});
  });

  it("ler do banco: só medidas e condições conhecidas e dentro dos limites", () => {
    const b = readSavedBody(
      row(
        { busto: 955.6, cintura: "720", quadril: 99999, inventada: 10, altura: 1700 },
        { belly: 100, heel: 80, limbs: { leftArm: 1.5, rightLeg: 3, cauda: 1 }, outra: true },
      ),
    )!;
    expect(b.measurements).toEqual({ busto: 956, altura: 1700 });
    expect(b.conditions).toEqual({ heel: 80, limbs: { leftArm: 1.5 } });
    expect(readSavedBody(row({ cintura: "x" }))).toBeNull();
    expect(readSavedBody(row([1, 2]))).toBeNull();
    expect(readSavedConditions(null)).toEqual({});
  });

  it("a lista sai em ordem de nome e sem os que não leem", () => {
    const list = readSavedBodies([row({ busto: 900 }, {}, "Zeca"), row({}, {}, "Vazio"), row({ busto: 900 }, {}, "Ágata")]);
    expect(list.map((b) => b.name)).toEqual(["Ágata", "Zeca"]);
  });

  it("carregar aplica as medidas por cima da tabela do tamanho; igual à tabela não conta como trocada", () => {
    const values = readMeasurements(TABELA_M, { busto: 980 }).values;
    const saved: SavedBody = { id: "b", name: "Ana", updatedAt: "", ...savedBodyPayload(values, { belly: 1200 }, 60) };
    const noM = applySavedBody(saved, TABELA_M);
    expect(noM.overrides).toEqual({ busto: 980 });
    expect(noM.conditions).toEqual({ belly: 1200 });
    expect(noM.heel).toBe(60);
    // No G a tabela é outra: o corpo fica o mesmo, então mais medidas viram ajuste.
    const noG = applySavedBody(saved, TABELA_G);
    expect(readMeasurements(TABELA_G, noG.overrides).values).toEqual(values);
    expect(Object.keys(noG.overrides).length).toBeGreaterThan(1);
  });

  it("reconhece o manequim que já está vestindo", () => {
    const values = readMeasurements(TABELA_M, { busto: 980 }).values;
    const saved: SavedBody = { id: "b", name: "Ana", updatedAt: "", ...savedBodyPayload(values, { limbs: { leftArm: 1.5 } }, 0) };
    expect(isSavedBodyActive(saved, values, { limbs: { leftArm: 1.5 } }, 0)).toBe(true);
    expect(isSavedBodyActive(saved, values, {}, 0)).toBe(false);
    expect(isSavedBodyActive(saved, values, { limbs: { leftArm: 1.5 } }, 40)).toBe(false);
    expect(isSavedBodyActive(saved, readMeasurements(TABELA_M).values, { limbs: { leftArm: 1.5 } }, 0)).toBe(false);
  });
});
