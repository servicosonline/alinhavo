import { describe, expect, it } from "vitest";
import { checkSupabaseConfig } from "./config";

const URL_OK = "https://yckpwnyaxamlspdirzlh.supabase.co";
const KEY_OK = "sb_publishable_abc123";

describe("checkSupabaseConfig", () => {
  it("aceita URL https e chave publicável, tirando espaços e a barra final", () => {
    expect(checkSupabaseConfig(` ${URL_OK}/ `, `${KEY_OK}\n`)).toEqual({
      ok: true,
      config: { url: URL_OK, key: KEY_OK },
    });
  });

  it("aceita o Supabase local em http", () => {
    expect(checkSupabaseConfig("http://127.0.0.1:54321", KEY_OK).ok).toBe(true);
    expect(checkSupabaseConfig("http://localhost:54321", KEY_OK).ok).toBe(true);
  });

  it("variável vazia é 'não configurado', sem problema a relatar", () => {
    expect(checkSupabaseConfig(undefined, KEY_OK)).toEqual({ ok: false, missing: true });
    expect(checkSupabaseConfig(URL_OK, "  ")).toEqual({ ok: false, missing: true });
  });

  it("recusa a chave no lugar da URL e URL sem https", () => {
    const trocada = checkSupabaseConfig(KEY_OK, KEY_OK);
    expect(trocada.ok).toBe(false);
    expect(!trocada.ok && !trocada.missing && trocada.problem).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);

    const http = checkSupabaseConfig("http://yckpwnyaxamlspdirzlh.supabase.co", KEY_OK);
    expect(!http.ok && !http.missing && http.problem).toMatch(/https/);
  });

  it("recusa a chave secreta sem repetir o valor na mensagem", () => {
    const secreta = "sb_secret_naoPodeVazar";
    const r = checkSupabaseConfig(URL_OK, secreta);
    expect(r.ok).toBe(false);
    const problem = !r.ok && !r.missing ? r.problem : "";
    expect(problem).toMatch(/SECRETA/);
    expect(problem).not.toContain(secreta);
  });

  it("recusa chave em outro formato", () => {
    const r = checkSupabaseConfig(URL_OK, "Publishable key");
    expect(!r.ok && !r.missing && r.problem).toMatch(/sb_publishable_/);
  });
});
