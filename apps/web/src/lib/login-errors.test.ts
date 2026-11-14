import { describe, expect, it } from "vitest";
import { otpErrorLog, otpErrorMessage } from "./login-errors";

describe("otpErrorMessage", () => {
  it("limite de envio", () => {
    expect(otpErrorMessage({ status: 429 })).toMatch(/Espere um minuto/);
    expect(otpErrorMessage({ status: 400, code: "over_email_send_rate_limit" })).toMatch(/Espere um minuto/);
  });

  it("e-mail inválido e e-mail não autorizado", () => {
    expect(otpErrorMessage({ status: 400, code: "email_address_invalid" })).toBe("Digite um e-mail válido.");
    expect(otpErrorMessage({ status: 400, code: "email_address_not_authorized" })).toMatch(/ainda não pode receber/);
  });

  it("qualquer outro erro vira a mensagem genérica", () => {
    expect(otpErrorMessage({ status: 401 })).toMatch(/Não conseguimos enviar/);
    expect(otpErrorMessage({})).toMatch(/Não conseguimos enviar/);
  });
});

describe("otpErrorLog", () => {
  it("registra status, código e motivo sem o e-mail", () => {
    const line = otpErrorLog({
      status: 400,
      code: "email_address_invalid",
      message: 'Email address "maria@confeccao.com.br" is invalid',
    });
    expect(line).toContain("status=400");
    expect(line).toContain("code=email_address_invalid");
    expect(line).toContain("<e-mail>");
    expect(line).not.toContain("maria@confeccao.com.br");
  });

  it("aponta a chave quando o Supabase responde 401", () => {
    expect(otpErrorLog({ status: 401, message: "Invalid API key" })).toMatch(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});
