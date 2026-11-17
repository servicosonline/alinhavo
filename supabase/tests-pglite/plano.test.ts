import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { contar, convidar, entrarComo, novaOrg } from "./helpers";

// Bloqueio por plano (migração 20261117000000_bloqueio_por_plano.sql).

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const DOC = JSON.stringify({ schema: 4, unit: "mm", sizes: ["P", "M"], baseSize: "M", pieces: [], seams: [] });
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");

let seq = 0;
async function org(): Promise<{ orgId: string; dono: User; modelista: User; patternId: string; n: number }> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@p.com`);
  const modelista = await createUser(db, `modelista${n}@p.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  const patternId = await novoMolde(dono, orgId);
  return { orgId, dono, modelista, patternId, n };
}

const plano = (orgId: string, plan: string, status: string) =>
  db.query("update public.org_subscriptions set plan_id = $2, status = $3::public.subscription_status where org_id = $1", [orgId, plan, status]);
const vencerTeste = (orgId: string) =>
  db.query("update public.org_subscriptions set trial_ends_at = now() - interval '1 day' where org_id = $1", [orgId]);

const novoMolde = (u: User, orgId: string, name = "Saia") =>
  as(db, u, async (q) => {
    const id = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, $2) returning id", [orgId, name])).rows[0]!.id;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [id, DOC]);
    return id;
  });
const salvarVersao = (u: User, patternId: string, origin = "editor") =>
  as(db, u, async (q) => {
    const v = (await q.query<{ current_version: number }>("select current_version from public.patterns where id = $1", [patternId])).rows[0]!;
    await q.query("select public.save_pattern_version($1, $2, $3::public.pattern_origin, $4)", [patternId, DOC, origin, v.current_version]);
  });
const novoProduto = (u: User, orgId: string) =>
  as(db, u, (q) => q.query("insert into public.products (org_id, name) values ($1, 'Saia')", [orgId]));
const aprovacao = (u: User, patternId: string) =>
  as(db, u, (q) =>
    q.query("select id from public.create_approval($1, 1, $2, $3, 14)", [
      patternId,
      JSON.stringify({ size: "M", fabric: "planoLeve", pose: "em-pe" }),
      JSON.stringify([{ angle: "frente", data: JPEG }]),
    ]),
  );
const planoAgora = async (u: User, orgId: string) =>
  as(db, u, async (q) => (await q.query<{ plan: string }>("select private.org_plan($1) as plan", [orgId])).rows[0]!.plan);

describe("bloqueio por plano", () => {
  it("plano que vale: teste no prazo e cortesia = o gravado; teste vencido ou cancelado = Grátis", async () => {
    const a = await org();
    expect(await planoAgora(a.dono, a.orgId)).toBe("confeccao");
    await vencerTeste(a.orgId);
    expect(await planoAgora(a.dono, a.orgId)).toBe("gratis");
    await plano(a.orgId, "confeccao", "cortesia");
    expect(await planoAgora(a.dono, a.orgId)).toBe("confeccao");
    await plano(a.orgId, "modelista", "ativa");
    expect(await planoAgora(a.dono, a.orgId)).toBe("modelista");
    await plano(a.orgId, "confeccao", "cancelada");
    expect(await planoAgora(a.dono, a.orgId)).toBe("gratis");
  });

  it("Grátis: 1 molde, só o primeiro edita, sem Scan, sem aprovação; lê tudo o que já fez", async () => {
    const a = await org();
    const segundo = await novoMolde(a.dono, a.orgId, "Calça");
    await vencerTeste(a.orgId);

    await expect(novoMolde(a.dono, a.orgId, "Blusa")).rejects.toThrow(/plano Grátis guarda 1 molde/);
    await salvarVersao(a.dono, a.patternId);
    await expect(salvarVersao(a.dono, segundo)).rejects.toThrow(/plano Grátis guarda 1 molde/);
    await expect(salvarVersao(a.dono, a.patternId, "scan")).rejects.toThrow(/Scan/);
    await expect(aprovacao(a.dono, a.patternId)).rejects.toThrow(/aprovação por link/);
    expect(await contar(db, a.modelista, "select 1 from public.patterns where org_id = $1", [a.orgId])).toBe(2);
  });

  it("Grátis: 1 pessoa (nem convite novo nem aceitar convite antigo)", async () => {
    const a = await org();
    const convite = await convidar(db, a.dono, a.orgId, `nova${a.n}@p.com`, "estilista");
    await vencerTeste(a.orgId);
    await expect(convidar(db, a.dono, a.orgId, `outra${a.n}@p.com`)).rejects.toThrow(/plano Grátis é para 1 pessoa/);
    const nova = await createUser(db, `nova${a.n}@p.com`);
    await expect(as(db, nova, (q) => q.query("select * from public.accept_invite($1)", [convite.token]))).rejects.toThrow(
      /plano Grátis é para 1 pessoa/,
    );
    // Quem cria uma organização entra sempre.
    expect((await novaOrg(db, nova)).id).toBeTruthy();
  });

  it("Modelista: moldes, Scan, aprovação e equipe; sem coleção, comentário, encaixe nem API", async () => {
    const a = await org();
    const productId = await as(db, a.dono, async (q) =>
      (await q.query<{ id: string }>("insert into public.products (org_id, name, pattern_id) values ($1, 'Saia', $2) returning id", [a.orgId, a.patternId])).rows[0]!.id,
    );
    await plano(a.orgId, "modelista", "ativa");

    await novoMolde(a.modelista, a.orgId, "Calça");
    await salvarVersao(a.modelista, a.patternId, "scan");
    await aprovacao(a.modelista, a.patternId);
    await entrarComo(db, a.dono, a.orgId, await createUser(db, `equipe${a.n}@p.com`), "leitura");

    await expect(novoProduto(a.dono, a.orgId)).rejects.toThrow(/row-level security/);
    await expect(
      as(db, a.dono, (q) => q.query("insert into public.comments (org_id, product_id, body) values ($1, $2, 'oi')", [a.orgId, productId])),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as(db, a.modelista, (q) => q.query("select public.enqueue_nest_job($1, 1500, '{\"P\":1}', 0, false)", [productId])),
    ).rejects.toThrow(/sem permissão/);
    await expect(as(db, a.dono, (q) => q.query("select * from public.create_api_key($1, 'erp')", [a.orgId]))).rejects.toThrow(
      /API e os webhooks são do plano Confecção/,
    );
    // O que já existe continua à vista.
    expect(await contar(db, a.modelista, "select 1 from public.products where id = $1", [productId])).toBe(1);
  });

  it("Confecção (e teste no prazo): tudo liberado", async () => {
    const a = await org();
    await plano(a.orgId, "confeccao", "ativa");
    await novoMolde(a.modelista, a.orgId, "Calça");
    await novoProduto(a.dono, a.orgId);
    await as(db, a.dono, (q) => q.query("select * from public.create_api_key($1, 'erp')", [a.orgId]));
  });
});
