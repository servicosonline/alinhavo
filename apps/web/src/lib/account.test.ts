import { describe, expect, it } from "vitest";
import { cleanName, displayName, initials, onboardingSteps, planName, trialNotice } from "./account";

describe("perfil", () => {
  it("nome aparado, com limite; vazio vira null", () => {
    expect(cleanName("  Ana   Maria ", 60)).toEqual({ ok: true, value: "Ana Maria" });
    expect(cleanName("", 60)).toEqual({ ok: true, value: null });
    expect(cleanName("x".repeat(61), 60)).toEqual({ ok: false });
  });

  it("como chamar a pessoa e as iniciais", () => {
    expect(displayName({ first_name: "Ana", last_name: "Lima" }, "a@b.com")).toBe("Ana Lima");
    expect(displayName({ first_name: null, last_name: null }, "rita.costa@b.com")).toBe("rita.costa");
    expect(displayName(null, null)).toBe("Você");
    expect(initials("Ana Maria Lima")).toBe("AL");
    expect(initials("rita")).toBe("R");
  });
});

describe("aviso do teste grátis", () => {
  it("conta os dias e avisa mais forte no fim", () => {
    expect(trialNotice({ plan_id: "confeccao", status: "trial", days_left: 12 })).toEqual({ tone: "info", text: "Teste grátis: faltam 12 dias." });
    expect(trialNotice({ plan_id: "confeccao", status: "trial", days_left: 1 })).toEqual({ tone: "alerta", text: "Teste grátis: falta 1 dia." });
    expect(trialNotice({ plan_id: "confeccao", status: "vencida", days_left: null, trial_ends_at: null })?.text).toMatch(/já foi usado em outra organização/);
    expect(trialNotice({ plan_id: "confeccao", status: "vencida", days_left: null, trial_ends_at: "2026-11-01T00:00:00Z" })?.text).toMatch(/terminou/);
    expect(trialNotice({ plan_id: "confeccao", status: "trial", days_left: 0 })?.tone).toBe("alerta");
    expect(trialNotice({ plan_id: "confeccao", status: "vencida", days_left: 0 })?.text).toMatch(/terminou/);
  });

  it("plano em dia ou cortesia não aparece", () => {
    expect(trialNotice({ plan_id: "confeccao", status: "ativa", days_left: null })).toBeNull();
    expect(trialNotice({ plan_id: "confeccao", status: "cortesia", days_left: null })).toBeNull();
    expect(trialNotice(null)).toBeNull();
  });

  it("nome do plano vem de lib/plans.ts", () => {
    expect(planName("confeccao")).toBe("Confecção");
    expect(planName("desconhecido")).toBe("desconhecido");
  });
});

describe("primeiros passos", () => {
  const nada = { has_profile: false, has_org: false, has_pattern: false, has_prova: false, has_approval: false, has_invite: false };

  it("seis passos na ordem, marcados pelo progresso", () => {
    const s = onboardingSteps({ ...nada, has_profile: true }, "org-1");
    expect(s.map((x) => x.id)).toEqual(["has_profile", "has_org", "has_pattern", "has_prova", "has_approval", "has_invite"]);
    expect(s.filter((x) => x.done).map((x) => x.id)).toEqual(["has_profile"]);
    expect(s.find((x) => x.id === "has_pattern")!.href).toBe("/painel/org-1/moldes");
  });

  it("sem organização, os passos que dependem dela levam ao painel", () => {
    expect(onboardingSteps(nada, null).find((x) => x.id === "has_pattern")!.href).toBe("/painel");
  });
});
