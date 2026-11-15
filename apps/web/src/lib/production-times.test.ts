import { describe, expect, it } from "vitest";
import { formatDuration, hasProductionData, readProductionTimes } from "./production-times";

const row = (stage: string, done: number, avg: number | null, now = 0, nowAvg: number | null = null) => ({
  stage,
  done_count: done,
  done_avg_seconds: avg,
  done_median_seconds: avg,
  current_count: now,
  current_avg_seconds: nowAvg,
});

describe("tempo de produção", () => {
  it("põe na ordem do fluxo e acha o gargalo (sem contar a produção)", () => {
    const t = readProductionTimes([
      row("total", 1, 9 * 86400),
      row("producao", 0, null, 3, 50 * 86400),
      row("prova", 2, 5 * 86400),
      row("ideia", 2, 3 * 86400),
      row("modelagem", 1, 2 * 86400, 1, 86400),
    ]);
    expect(t.stages.map((s) => s.stage)).toEqual(["ideia", "modelagem", "prova", "aprovado", "producao"]);
    expect(t.stages[3]).toMatchObject({ done: 0, avg: null, now: 0 });
    expect(t.slowest).toBe("prova");
    expect(t.total.avg).toBe(9 * 86400);
    expect(hasProductionData(t)).toBe(true);
  });

  it("sem dados, sem gargalo", () => {
    const t = readProductionTimes([]);
    expect(t.slowest).toBeNull();
    expect(hasProductionData(t)).toBe(false);
  });

  it("aceita número vindo como texto do banco", () => {
    const t = readProductionTimes([{ ...row("ideia", 1, null), done_avg_seconds: "7200" as unknown as number }]);
    expect(t.stages[0]!.avg).toBe(7200);
  });

  it("formata durações curtas e longas", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(30)).toBe("menos de 1 min");
    expect(formatDuration(12 * 60)).toBe("12 min");
    expect(formatDuration(5 * 3600 + 10 * 60)).toBe("5 h 10 min");
    expect(formatDuration(2 * 3600)).toBe("2 h");
    expect(formatDuration(3 * 86400 + 4 * 3600 + 59)).toBe("3 d 4 h");
    expect(formatDuration(2 * 86400)).toBe("2 d");
  });
});
