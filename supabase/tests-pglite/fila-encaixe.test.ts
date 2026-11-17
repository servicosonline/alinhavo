import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { contar, entrarComo, novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const DOC = { schema: 4, unit: "mm", sizes: ["P", "M"], baseSize: "M", pieces: [], seams: [] };
const LAYOUT = JSON.stringify({ schema: 1, pieces: [], placements: [] });

type Cenario = { orgId: string; productId: string; dono: User; modelista: User; estilista: User;
  outra: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@q.com`);
  const modelista = await createUser(db, `modelista${n}@q.com`);
  const estilista = await createUser(db, `estilista${n}@q.com`);
  const outra = await createUser(db, `outra${n}@q.com`);
  const leitura = await createUser(db, `leitura${n}@q.com`);
  const fora = await createUser(db, `fora${n}@q.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, outra, "modelista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const productId = await as(db, dono, async (q) => {
    const pat = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pat.id, JSON.stringify(DOC)]);
    return (await q.query<{ id: string }>("insert into public.products (org_id, name, pattern_id) values ($1, 'Saia', $2) returning id", [orgId, pat.id])).rows[0]!.id;
  });
  return { orgId, productId, dono, modelista, estilista, outra, leitura, fora };
}

const enfileirar = (u: User, productId: string, demand: unknown = { P: 2, M: 1 }) =>
  as(db, u, async (q) =>
    (
      await q.query<{ id: string; status: string; pattern_version: number }>(
        "select id, status, pattern_version from public.enqueue_nest_job($1, 1500, $2, 0, false)",
        [productId, JSON.stringify(demand)],
      )
    ).rows[0]!,
  );

const pegar = (u: User, orgId: string) =>
  as(db, u, async (q) => (await q.query<{ id: string | null }>("select (public.claim_nest_job($1)).id", [orgId])).rows[0]!.id);

const progresso = (u: User, jobId: string, p = 0.5) =>
  as(db, u, async (q) => (await q.query<{ ok: boolean }>("select public.nest_job_progress($1, $2) as ok", [jobId, p])).rows[0]!.ok);

const concluir = (u: User, jobId: string) =>
  as(db, u, async (q) =>
    (await q.query<{ number: number }>("select number from public.finish_nest_job($1, 1234.5, 0.8, $2)", [jobId, LAYOUT])).rows[0]!,
  );

const pedido = async (jobId: string) =>
  (
    await db.query<{ status: string; progress: string; attempts: number; marker_id: string | null; error: string | null; claimed_by: string | null }>(
      "select status, progress, attempts, marker_id, error, claimed_by from public.nest_jobs where id = $1",
      [jobId],
    )
  ).rows[0]!;

const vencerPrazo = (jobId: string) => db.query("update public.nest_jobs set lease_until = now() - interval '1 minute' where id = $1", [jobId]);

describe("fila de encaixes", () => {
  it("quem edita produto põe na fila (na versão atual do molde); todo membro vê; quem é de fora, não", async () => {
    const c = await cenario();
    const job = await enfileirar(c.outra, c.productId);
    expect(job).toMatchObject({ status: "fila", pattern_version: 1 });
    // O encaixe é da modelista: a estilista edita o produto, mas não encaixa nem processa a fila.
    await expect(enfileirar(c.estilista, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(pegar(c.estilista, c.orgId)).rejects.toThrow(/Sem permissão/);
    await expect(enfileirar(c.leitura, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(enfileirar(c.fora, c.productId)).rejects.toThrow(/sem permissão/);
    expect(await contar(db, c.leitura, "select 1 from public.nest_jobs where id = $1", [job.id])).toBe(1);
    expect(await contar(db, c.fora, "select 1 from public.nest_jobs where id = $1", [job.id])).toBe(0);
  });

  it("recusa demanda inválida, produto sem molde e escrita direta", async () => {
    const c = await cenario();
    for (const demand of [{}, [], { P: 0 }, { P: 1.5 }, { P: 201 }, { P: "2" }]) {
      await expect(enfileirar(c.dono, c.productId, demand)).rejects.toThrow(/Demanda inválida/);
    }
    await expect(
      as(db, c.dono, (q) =>
        q.query("insert into public.nest_jobs (org_id, product_id, pattern_version, width_mm, demand) values ($1, $2, 1, 1500, '{\"P\":1}')", [c.orgId, c.productId]),
      ),
    ).rejects.toThrow(/permission denied/);
    const job = await enfileirar(c.dono, c.productId);
    await expect(as(db, c.dono, (q) => q.query("update public.nest_jobs set status = 'pronto' where id = $1", [job.id]))).rejects.toThrow(/permission denied/);
    await as(db, c.dono, (q) => q.query("update public.products set pattern_id = null where id = $1", [c.productId]));
    await expect(enfileirar(c.dono, c.productId)).rejects.toThrow(/Ligue um molde/);
  });

  it("pega o mais antigo primeiro; o pedido pego não é pego de novo; fila vazia devolve nada", async () => {
    const c = await cenario();
    const a = await enfileirar(c.dono, c.productId);
    const b = await enfileirar(c.dono, c.productId);
    expect(await pegar(c.modelista, c.orgId)).toBe(a.id);
    expect(await pegar(c.outra, c.orgId)).toBe(b.id);
    expect(await pegar(c.dono, c.orgId)).toBeNull();
    expect(await pedido(a.id)).toMatchObject({ status: "rodando", attempts: 1, claimed_by: c.modelista.id });
    await expect(pegar(c.leitura, c.orgId)).rejects.toThrow(/Sem permissão/);
    await expect(pegar(c.fora, c.orgId)).rejects.toThrow(/Sem permissão/);
  });

  it("só quem pegou avisa progresso e conclui; concluir grava o risco e liga ao pedido", async () => {
    const c = await cenario();
    const job = await enfileirar(c.dono, c.productId);
    await pegar(c.modelista, c.orgId);
    expect(await progresso(c.outra, job.id)).toBe(false);
    expect(await progresso(c.modelista, job.id, 0.4)).toBe(true);
    expect(Number((await pedido(job.id)).progress)).toBeCloseTo(0.4);
    await expect(concluir(c.outra, job.id)).rejects.toThrow(/não está mais com você/);
    await expect(concluir(c.leitura, job.id)).rejects.toThrow(/sem permissão/);
    expect((await concluir(c.modelista, job.id)).number).toBe(1);
    const done = await pedido(job.id);
    expect(done).toMatchObject({ status: "pronto", claimed_by: null });
    expect(Number(done.progress)).toBe(1);
    const marker = (await db.query<{ id: string; width_mm: number; demand: unknown }>("select id, width_mm, demand from public.markers where product_id = $1", [c.productId])).rows;
    expect(marker).toEqual([{ id: done.marker_id, width_mm: 1500, demand: { P: 2, M: 1 } }]);
    // Concluído não se conclui de novo.
    await expect(concluir(c.modelista, job.id)).rejects.toThrow(/não está mais com você/);
  });

  it("prazo vencido: outro pega, o primeiro perde o pedido; depois de 3 tentativas vira erro", async () => {
    const c = await cenario();
    const job = await enfileirar(c.dono, c.productId);
    await pegar(c.modelista, c.orgId);
    await vencerPrazo(job.id);
    expect(await progresso(c.modelista, job.id)).toBe(false);
    await expect(concluir(c.modelista, job.id)).rejects.toThrow(/não está mais com você/);
    expect(await pegar(c.outra, c.orgId)).toBe(job.id);
    expect(await pedido(job.id)).toMatchObject({ attempts: 2, claimed_by: c.outra.id });
    await vencerPrazo(job.id);
    expect(await pegar(c.dono, c.orgId)).toBe(job.id);
    await vencerPrazo(job.id);
    expect(await pegar(c.dono, c.orgId)).toBeNull();
    expect(await pedido(job.id)).toMatchObject({ status: "erro", attempts: 3, error: expect.stringMatching(/parou 3 vezes/) });
  });

  it("quem para de processar devolve o pedido à fila sem gastar tentativa", async () => {
    const c = await cenario();
    const job = await enfileirar(c.dono, c.productId);
    await pegar(c.modelista, c.orgId);
    const soltar = (u: User) => as(db, u, async (q) => (await q.query<{ ok: boolean }>("select public.release_nest_job($1) as ok", [job.id])).rows[0]!.ok);
    expect(await soltar(c.outra)).toBe(false);
    expect(await soltar(c.modelista)).toBe(true);
    expect(await pedido(job.id)).toMatchObject({ status: "fila", attempts: 0, claimed_by: null });
    expect(await pegar(c.outra, c.orgId)).toBe(job.id);
  });

  it("erro marcado por quem pegou; refazer põe de volta na fila", async () => {
    const c = await cenario();
    const job = await enfileirar(c.dono, c.productId);
    await pegar(c.modelista, c.orgId);
    const falhar = (u: User) => as(db, u, async (q) => (await q.query<{ ok: boolean }>("select public.fail_nest_job($1, 'Peça mais larga que o tecido') as ok", [job.id])).rows[0]!.ok);
    expect(await falhar(c.outra)).toBe(false);
    expect(await falhar(c.modelista)).toBe(true);
    expect(await pedido(job.id)).toMatchObject({ status: "erro", error: "Peça mais larga que o tecido" });
    const refazer = (u: User) => as(db, u, (q) => q.query("select public.retry_nest_job($1)", [job.id]));
    await expect(refazer(c.leitura)).rejects.toThrow(/sem permissão/);
    await refazer(c.outra);
    expect(await pedido(job.id)).toMatchObject({ status: "fila", attempts: 0, error: null });
    await expect(refazer(c.outra)).rejects.toThrow(/sem erro/);
  });

  it("uma organização não pega nem apaga pedido da outra; só quem edita apaga", async () => {
    const a = await cenario();
    const b = await cenario();
    const job = await enfileirar(a.dono, a.productId);
    expect(await pegar(b.dono, b.orgId)).toBeNull();
    expect(await pedido(job.id)).toMatchObject({ status: "fila" });
    await as(db, b.dono, (q) => q.query("delete from public.nest_jobs where id = $1", [job.id]));
    await as(db, a.leitura, (q) => q.query("delete from public.nest_jobs where id = $1", [job.id]));
    await as(db, a.estilista, (q) => q.query("delete from public.nest_jobs where id = $1", [job.id]));
    expect(await contar(db, a.dono, "select 1 from public.nest_jobs where id = $1", [job.id])).toBe(1);
    await as(db, a.outra, (q) => q.query("delete from public.nest_jobs where id = $1", [job.id]));
    expect(await contar(db, a.dono, "select 1 from public.nest_jobs where id = $1", [job.id])).toBe(0);
  });

  it("a fila tem limite de pedidos esperando por organização", async () => {
    const c = await cenario();
    await db.query(
      "insert into public.nest_jobs (org_id, product_id, pattern_version, width_mm, demand) select $1, $2, 1, 1500, '{\"P\":1}' from generate_series(1, 50)",
      [c.orgId, c.productId],
    );
    await expect(enfileirar(c.dono, c.productId)).rejects.toThrow(/fila de encaixes está cheia/);
  });
});
