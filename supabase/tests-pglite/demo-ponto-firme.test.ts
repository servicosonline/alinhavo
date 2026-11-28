import type { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";

// Povoamento da organização de demonstração (supabase/demo/ponto-firme.sql), rodado sobre uma cópia
// mínima do Ateliê: dono, tabela, tecido e um molde com versão, no plano Confecção em cortesia.

const ORG = "a70b71c6-d1a0-4630-bb5a-ff5f7302fd2c";
const DEMO = join(import.meta.dirname, "..", "demo");
const DOC = JSON.stringify({ schema: 7, unit: "mm", sizes: ["P", "M", "G"], baseSize: "M", pieces: [], seams: [] });

let db: PGlite;
let dono: User;
let seed: string;
let undo: string;
let originalPattern: string;

beforeAll(async () => {
  db = await createDb();
  seed = await readFile(join(DEMO, "ponto-firme.sql"), "utf8");
  undo = await readFile(join(DEMO, "ponto-firme-desfazer.sql"), "utf8");
  dono = await createUser(db, "paulo@exemplo.com");
  await db.query("insert into public.orgs (id, name, created_by) values ($1, 'Ateliê Ponto Firme', $2)", [ORG, dono.id]);
  await db.query("insert into public.org_members (org_id, user_id, role) values ($1, $2, 'owner')", [ORG, dono.id]);
  await db.query("update public.org_subscriptions set plan_id = 'confeccao', status = 'cortesia', trial_ends_at = null where org_id = $1", [ORG]);
  await db.query("insert into public.size_charts (org_id, name) values ($1, 'Feminino P/M/G')", [ORG]);
  await db.query("insert into public.fabrics (org_id, name) values ($1, 'Viscose'), ($1, 'Linho')", [ORG]);
  const { rows } = await db.query<{ id: string }>(
    "insert into public.patterns (org_id, name, current_version, created_by) values ($1, 'Calça pantalona', 1, $2) returning id",
    [ORG, dono.id],
  );
  originalPattern = rows[0]!.id;
  await db.query("insert into public.pattern_versions (org_id, pattern_id, number, document, origin) values ($1, $2, 1, $3, 'editor')", [ORG, originalPattern, DOC]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const count = async (sql: string, params: unknown[] = [ORG]) => Number((await db.query<{ n: number }>(sql, params)).rows[0]!.n);

describe("povoamento do Ateliê Ponto Firme", () => {
  it("recusa organização fora do plano Confecção sem gravar nada", async () => {
    await db.query("update public.org_subscriptions set plan_id = 'modelista' where org_id = $1", [ORG]);
    await expect(db.exec(seed)).rejects.toThrow(/plano Confecção/);
    await db.query("update public.org_subscriptions set plan_id = 'confeccao' where org_id = $1", [ORG]);
    expect(await count("select count(*) as n from public.org_members where org_id = $1")).toBe(1);
  });

  it("cria equipe, coleções, produtos com histórico, moldes, aprovações e atividade com nome", async () => {
    const before = await count("select coalesce(max(id), 0) as n from public.activity_log", []);
    await db.exec(seed);

    expect(await count("select count(*) as n from public.org_members where org_id = $1")).toBe(6);
    const team = await as(db, dono, async (q) => (await q.query<{ first_name: string | null }>("select first_name from public.org_team($1)", [ORG])).rows);
    expect(team.map((m) => m.first_name).filter(Boolean)).toHaveLength(5);

    expect(await count("select count(*) as n from public.collections where org_id = $1")).toBe(5);
    expect(await count("select count(*) as n from public.milestones where org_id = $1")).toBe(30);
    expect(await count("select count(*) as n from public.products where org_id = $1")).toBe(30);
    // Ideia ainda não tem molde; os outros têm, cada um com versões em ordem e o desenho copiado.
    expect(await count("select count(*) as n from public.products where org_id = $1 and pattern_id is null")).toBe(2);
    expect(await count("select count(*) as n from public.patterns where org_id = $1")).toBe(29);
    expect(
      await count(
        "select count(*) as n from public.patterns p where p.org_id = $1 and p.current_version <> (select max(number) from public.pattern_versions v where v.pattern_id = p.id)",
      ),
    ).toBe(0);

    // Histórico de estágios: datas em ordem, todas no passado, terminando no estágio atual.
    expect(await count("select count(*) as n from public.product_status_events where org_id = $1 and (backfilled or entered_at > now())")).toBe(0);
    expect(
      await count(
        `select count(*) as n from public.products p where p.org_id = $1 and p.status <> (
           select e.status from public.product_status_events e where e.product_id = p.id order by e.entered_at desc limit 1)`,
      ),
    ).toBe(0);
    const times = await as(db, dono, async (q) =>
      (await q.query<{ stage: string; done_count: number; current_count: number }>("select stage, done_count, current_count from public.production_stage_times($1)", [ORG])).rows,
    );
    const total = times.find((t) => t.stage === "total")!;
    expect(total.done_count).toBe(22);
    expect(times.find((t) => t.stage === "modelagem")!.done_count).toBeGreaterThan(20);

    // Aprovações: decididas pela cliente, algumas com ajustes, e 2 esperando.
    expect(await count("select count(*) as n from public.approvals where org_id = $1 and status = 'aprovado'")).toBe(24);
    expect(await count("select count(*) as n from public.approvals where org_id = $1 and status = 'ajustes'")).toBeGreaterThan(3);
    expect(await count("select count(*) as n from public.approvals where org_id = $1 and status = 'pendente' and expires_at > now()")).toBe(2);
    expect(await count("select count(*) as n from public.comments where org_id = $1")).toBeGreaterThan(80);

    // Atividade: quem fez e quando; nada gravado com a data de agora nem sem pessoa (fora a cliente).
    expect(await count("select count(*) as n from public.activity_log where org_id = $1 and id > $2 and created_at > now() - interval '1 hour'", [ORG, before])).toBe(0);
    expect(await count("select count(*) as n from public.activity_log where org_id = $1 and id > $2 and user_id is null and action <> 'aprovacao_decidida'", [ORG, before])).toBe(0);
    expect(await count("select count(*) as n from public.activity_log where org_id = $1 and action = 'produto_status'")).toBeGreaterThan(90);

    // Resultados com histórico de 6 meses.
    expect(await count("select count(*) as n from public.roi_months where org_id = $1")).toBe(6);
  });

  it("não povoa duas vezes", async () => {
    await expect(db.exec(seed)).rejects.toThrow(/já foi povoado/);
  });

  it("o desfazer tira só o que o povoamento criou", async () => {
    await db.exec(undo);
    expect(await count("select count(*) as n from public.org_members where org_id = $1")).toBe(1);
    expect(await count("select count(*) as n from public.collections where org_id = $1")).toBe(0);
    expect(await count("select count(*) as n from public.products where org_id = $1")).toBe(0);
    expect(await count("select count(*) as n from public.patterns where org_id = $1")).toBe(1);
    expect(await count("select count(*) as n from public.patterns where id = $1", [originalPattern])).toBe(1);
    expect(await count("select count(*) as n from auth.users where email like '%@ponto-firme.invalid'", [])).toBe(0);
    expect(await count("select count(*) as n from public.activity_log where org_id = $1 and created_at < '2026-11-01'")).toBe(0);
    // Dá para povoar de novo depois de desfazer.
    await db.exec(seed);
    expect(await count("select count(*) as n from public.products where org_id = $1")).toBe(30);
  });
});
