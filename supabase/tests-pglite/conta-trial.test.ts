import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser } from "./db";
import { contar, entrarComo, novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

let seq = 0;
const email = (p: string) => `${p}${++seq}@conta.com`;

// CPF e CNPJ válidos (dígitos verificadores certos), de teste.
const CPF = "52998224725";
const CNPJ = "11222333000181";

describe("CPF e CNPJ", () => {
  it("valida o dígito verificador e recusa repetidos", async () => {
    const q = (sql: string, v: string) => db.query<{ ok: boolean }>(sql, [v]).then((r) => r.rows[0]!.ok);
    expect(await q("select private.valid_cpf($1) as ok", CPF)).toBe(true);
    expect(await q("select private.valid_cpf($1) as ok", "52998224724")).toBe(false);
    expect(await q("select private.valid_cpf($1) as ok", "11111111111")).toBe(false);
    expect(await q("select private.valid_cpf($1) as ok", "529.982.247-25")).toBe(false);
    expect(await q("select private.valid_cnpj($1) as ok", CNPJ)).toBe(true);
    expect(await q("select private.valid_cnpj($1) as ok", "11222333000182")).toBe(false);
    expect(await q("select private.valid_cnpj($1) as ok", "00000000000000")).toBe(false);
  });
});

describe("perfil", () => {
  it("cada pessoa cria, lê e edita só o próprio", async () => {
    const ana = await createUser(db, email("ana"));
    const bia = await createUser(db, email("bia"));
    await as(db, ana, (q) =>
      q.query("insert into public.profiles (first_name, last_name, document_type, document) values ('Ana', 'Lima', 'cpf', $1)", [CPF]),
    );
    expect(await contar(db, ana, "select 1 from public.profiles")).toBe(1);
    expect(await contar(db, bia, "select 1 from public.profiles")).toBe(0);
    expect(await contar(db, null, "select 1 from public.profiles").catch(() => 0)).toBe(0);

    // Bia não escreve no perfil da Ana (nem cria um com o id dela).
    await as(db, bia, (q) => q.query("update public.profiles set first_name = 'X'"));
    const { rows } = await as(db, ana, (q) => q.query<{ first_name: string }>("select first_name from public.profiles"));
    expect(rows[0]!.first_name).toBe("Ana");
    await expect(
      as(db, bia, (q) => q.query("insert into public.profiles (user_id, first_name) values ($1, 'X')", [ana.id])),
    ).rejects.toThrow(/row-level security|duplicate key/);
  });

  it("recusa documento inválido ou sem o tipo", async () => {
    const u = await createUser(db, email("doc"));
    await expect(
      as(db, u, (q) => q.query("insert into public.profiles (document_type, document) values ('cpf', '12345678900')")),
    ).rejects.toThrow(/profiles_document_ok/);
    await expect(as(db, u, (q) => q.query("insert into public.profiles (document) values ($1)", [CPF]))).rejects.toThrow(
      /profiles_document_ok/,
    );
    await as(db, u, (q) => q.query("insert into public.profiles (document_type, document) values ('cnpj', $1)", [CNPJ]));
  });

  it("a foto só pode apontar para a própria pasta", async () => {
    const u = await createUser(db, email("foto"));
    const outro = await createUser(db, email("foto"));
    await expect(
      as(db, u, (q) => q.query("insert into public.profiles (avatar_path) values ($1)", [`${outro.id}/a.webp`])),
    ).rejects.toThrow(/profiles_avatar_own/);
    await as(db, u, (q) => q.query("insert into public.profiles (avatar_path) values ($1)", [`${u.id}/a.webp`]));
  });
});

describe("foto de perfil no Storage", () => {
  const enviar = (user: { id: string; email: string } | null, name: string) =>
    as(db, user, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ('avatars', $1, '{}')", [name]));

  it("o bucket é público, de imagem, até 200 KB", async () => {
    const { rows } = await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'");
    expect(rows[0]).toEqual({ public: true, file_size_limit: 204800, allowed_mime_types: ["image/webp", "image/jpeg", "image/png"] });
  });

  it("cada pessoa envia e apaga só na própria pasta", async () => {
    const u = await createUser(db, email("av"));
    const outro = await createUser(db, email("av"));
    await enviar(u, `${u.id}/foto-1.webp`);
    await expect(enviar(u, `${outro.id}/foto-1.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(null, `${u.id}/foto-2.webp`)).rejects.toThrow(/row-level security|permission denied/);
    await expect(enviar(u, `${u.id}/../x.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(u, `${u.id}/foto.gif`)).rejects.toThrow(/row-level security/);
    await as(db, outro, (q) => q.query("delete from storage.objects where bucket_id = 'avatars'"));
    expect(await contar(db, u, "select 1 from storage.objects where bucket_id = 'avatars'")).toBe(1);
  });
});

describe("teste grátis por organização", () => {
  it("organização nova nasce em teste de 15 dias, plano Confecção", async () => {
    const dono = await createUser(db, email("dono"));
    const { id } = await novaOrg(db, dono);
    const { rows } = await as(db, dono, (q) =>
      q.query<{ plan_id: string; status: string; days_left: number }>("select plan_id, status, days_left from public.org_plan_status($1)", [id]),
    );
    expect(rows[0]).toEqual({ plan_id: "confeccao", status: "trial", days_left: 15 });
  });

  it("teste com o prazo passado aparece como vencida", async () => {
    const dono = await createUser(db, email("dono"));
    const { id } = await novaOrg(db, dono);
    await db.query("update public.org_subscriptions set trial_ends_at = now() - interval '1 hour' where org_id = $1", [id]);
    const { rows } = await as(db, dono, (q) => q.query<{ status: string; days_left: number }>("select status, days_left from public.org_plan_status($1)", [id]));
    expect(rows[0]).toEqual({ status: "vencida", days_left: 0 });
  });

  it("membros leem; de fora não; ninguém escreve pelo app", async () => {
    const dono = await createUser(db, email("dono"));
    const leitura = await createUser(db, email("leit"));
    const fora = await createUser(db, email("fora"));
    const { id } = await novaOrg(db, dono);
    await entrarComo(db, dono, id, leitura, "leitura");
    const sql = "select 1 from public.org_subscriptions where org_id = $1";
    expect(await contar(db, leitura, sql, [id])).toBe(1);
    expect(await contar(db, fora, sql, [id])).toBe(0);
    expect(await contar(db, fora, "select 1 from public.org_plan_status($1)", [id])).toBe(0);
    await expect(as(db, dono, (q) => q.query("update public.org_subscriptions set status = 'ativa' where org_id = $1", [id]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(db, dono, (q) => q.query("insert into public.org_subscriptions (org_id, status) values (gen_random_uuid(), 'cortesia')")),
    ).rejects.toThrow(/permission denied/);
  });
});
