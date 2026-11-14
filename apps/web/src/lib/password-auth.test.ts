import { describe, expect, it } from "vitest";
import { passwordErrorLog, passwordErrorMessage, readCredentials } from "./password-auth";

describe("readCredentials", () => {
  it("normaliza o e-mail e aceita a senha como veio (sem cortar espaços)", () => {
    expect(readCredentials("  Maria@Confeccao.com.BR ", " minha senha ")).toEqual({
      ok: true,
      value: { email: "maria@confeccao.com.br", password: " minha senha " },
    });
  });

  it("recusa e-mail inválido e senha vazia", () => {
    expect(readCredentials("maria", "12345678")).toEqual({ ok: false, error: "Digite um e-mail válido." });
    expect(readCredentials("maria@x.com", "")).toEqual({ ok: false, error: "Digite a senha." });
    expect(readCredentials("maria@x.com", null)).toEqual({ ok: false, error: "Digite a senha." });
  });

  it("no cadastro, exige tamanho mínimo, máximo e as duas senhas iguais", () => {
    expect(readCredentials("maria@x.com", "1234567", "1234567")).toMatchObject({ ok: false, error: expect.stringMatching(/pelo menos 8/) });
    const longa = "a".repeat(73);
    expect(readCredentials("maria@x.com", longa, longa)).toMatchObject({ ok: false, error: expect.stringMatching(/no máximo 72/) });
    expect(readCredentials("maria@x.com", "12345678", "12345679")).toEqual({ ok: false, error: "As duas senhas não são iguais." });
    expect(readCredentials("maria@x.com", "12345678", "12345678").ok).toBe(true);
  });

  it("ao entrar, não cobra tamanho (contas antigas podem ter senha menor)", () => {
    expect(readCredentials("maria@x.com", "123").ok).toBe(true);
  });
});

describe("passwordErrorMessage", () => {
  it("traduz os erros comuns do Supabase Auth", () => {
    expect(passwordErrorMessage({ status: 400, code: "invalid_credentials" })).toBe("E-mail ou senha incorretos.");
    expect(passwordErrorMessage({ status: 400, code: "email_not_confirmed" })).toMatch(/Confirme seu e-mail/);
    expect(passwordErrorMessage({ status: 422, code: "user_already_exists" })).toMatch(/já tem conta/);
    expect(passwordErrorMessage({ status: 422, code: "weak_password" })).toMatch(/Senha fraca/);
    expect(passwordErrorMessage({ status: 429 })).toMatch(/Espere um minuto/);
    expect(passwordErrorMessage({ status: 422, code: "signup_disabled" })).toMatch(/desligado/);
    expect(passwordErrorMessage({})).toMatch(/Não conseguimos entrar/);
  });

  it("o log não leva o e-mail", () => {
    const line = passwordErrorLog("cadastro", { status: 422, code: "weak_password", message: "Password for maria@x.com is weak" });
    expect(line).toContain("[cadastro]");
    expect(line).toContain("code=weak_password");
    expect(line).not.toContain("maria@x.com");
  });
});
