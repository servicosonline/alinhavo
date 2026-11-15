import { describe, expect, it } from "vitest";
import { dbErrorMessage } from "./db-error";

const texts = { noPermission: "Sem permissão.", fallback: "Não foi possível." };

describe("dbErrorMessage", () => {
  it("mostra só as mensagens das nossas funções", () => {
    expect(dbErrorMessage({ code: "22023", message: "Ligue um molde ao produto antes de encaixar." }, texts)).toBe("Ligue um molde ao produto antes de encaixar.");
    expect(dbErrorMessage({ code: "54000", message: "A fila de encaixes está cheia." }, texts)).toBe("A fila de encaixes está cheia.");
  });

  it("permissão vira o texto da tela; o resto, o genérico", () => {
    expect(dbErrorMessage({ code: "42501", message: "permission denied for table x" }, texts)).toBe("Sem permissão.");
    expect(dbErrorMessage({ code: "PGRST202", message: "Could not find the function public.claim_nest_job(p_org_id) in the schema cache" }, texts)).toBe(
      "Não foi possível.",
    );
    expect(dbErrorMessage({ code: "23514", message: 'new row violates check constraint "x"' }, texts)).toBe("Não foi possível.");
    expect(dbErrorMessage(null, texts)).toBe("Não foi possível.");
  });
});
