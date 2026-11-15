import { MEASUREMENT_KEYS } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import {
  BODY_FIELD_NAME,
  BODY_GROUPS,
  bodyMeasurements,
  bodySummary,
  bodyTypeOverrides,
  limbLevelName,
  naturalBelly,
  overrideCount,
  setBelly,
  setBodyOverride,
  setLimb,
  suggestedBelly,
} from "./body";

const TABELA = { altura: 1680, busto: 920, cintura: 740, quadril: 1000 };

describe("manequim ajustado na Prova", () => {
  it("a tela mostra cada medida do corpo uma vez", () => {
    const keys = BODY_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect([...keys].sort()).toEqual([...MEASUREMENT_KEYS].sort());
    for (const k of MEASUREMENT_KEYS) expect(BODY_FIELD_NAME[k]).toBeTruthy();
  });

  it("trocar uma medida guarda o ajuste; voltar ao valor da tabela tira", () => {
    const { table } = bodyMeasurements(TABELA, {});
    const a = setBodyOverride({}, table, "altura", 1755.4);
    expect(a).toEqual({ altura: 1755 });
    expect(overrideCount(a)).toBe(1);
    expect(setBodyOverride(a, table, "altura", 1680)).toEqual({});
  });

  it("prende o valor aos limites do corpo e ignora o que não é número", () => {
    const { table } = bodyMeasurements(TABELA, {});
    expect(setBodyOverride({}, table, "punho", 5)).toEqual({ punho: 100 });
    expect(setBodyOverride({ coxa: 600 }, table, "coxa", Number.NaN)).toEqual({ coxa: 600 });
  });

  it("as medidas estimadas acompanham o ajuste, como no Worker", () => {
    const { table, values, estimated } = bodyMeasurements(TABELA, { quadril: 1100, coxa: 650 });
    expect(table.quadril).toBe(1000);
    expect(values.quadril).toBe(1100);
    expect(values.joelho).toBeCloseTo(1100 * 0.38, 9);
    expect(estimated).not.toContain("coxa");
    expect(estimated).toContain("joelho");
  });
});

describe("tipos de corpo e condições", () => {
  it("tipo de corpo multiplica a tabela e a pessoa vê os valores como medidas trocadas", () => {
    const { table } = bodyMeasurements(TABELA, {});
    const plus = bodyTypeOverrides(table, "plus");
    expect(plus.cintura).toBe(Math.round(740 * 1.32));
    expect(plus.altura).toBeUndefined();
    const magro = bodyTypeOverrides(table, "magro");
    expect(magro.busto).toBe(Math.round(920 * 0.9));
    // Nunca sai dos limites do corpo.
    const tiny = bodyMeasurements({ ...TABELA, punho: 100 }, {}).table;
    expect(bodyTypeOverrides(tiny, "magro").punho ?? 100).toBeGreaterThanOrEqual(100);
  });

  it("corte de membro: inteiro sai da lista; nomes dos pontos prontos e dos outros", () => {
    let c = setLimb({}, "leftArm", 1.5);
    expect(c).toEqual({ limbs: { leftArm: 1.5 } });
    expect(limbLevelName("leftArm", 1.5)).toBe("Abaixo do cotovelo");
    expect(limbLevelName("rightLeg", 0)).toBe("Sem a perna");
    expect(limbLevelName("rightLeg", 1.25)).toBe("25% da canela");
    c = setLimb(c, "leftArm", 3);
    expect(c).toEqual({});
    expect(setLimb({}, "rightLeg", -2)).toEqual({ limbs: { rightLeg: 0 } });
  });

  it("gestante: sugere uma barriga maior que a volta natural e respeita os limites", () => {
    const { values } = bodyMeasurements(TABELA, {});
    expect(suggestedBelly(values)).toBeGreaterThan(naturalBelly(values));
    expect(setBelly({}, 99999).belly).toBe(2200);
    expect(setBelly({ belly: 1000 }, null)).toEqual({});
  });

  it("resumo do painel", () => {
    expect(bodySummary({}, {})).toBe("pela tabela");
    expect(bodySummary({ altura: 1700 }, { belly: 1100, limbs: { leftArm: 0, rightLeg: 1 } })).toBe("1 medida trocada · gestante · 2 membros");
    expect(overrideCount({})).toBe(0);
  });
});
