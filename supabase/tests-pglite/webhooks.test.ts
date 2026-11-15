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

const DOC = {
  schema: 5,
  unit: "mm",
  sizes: ["M"],
  baseSize: "M",
  pieces: [],
  seams: [],
};
const LAYOUT = { schema: 1, pieces: [], placements: [] };
const URL = "https://erp.exemplo.com.br/alinhavo";
const TODOS = ["produto.aprovado", "ficha.gerada", "risco.salvo"];

type Cenario = {
  orgId: string;
  outraOrg: string;
  productId: string;
  dono: User;
  admin: User;
  modelista: User;
  fora: User;
};

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `wdono${n}@w.com`);
  const admin = await createUser(db, `wadmin${n}@w.com`);
  const modelista = await createUser(db, `wmodelista${n}@w.com`);
  const fora = await createUser(db, `wfora${n}@w.com`);
  const { id: orgId } = await novaOrg(db, dono);
  const { id: outraOrg } = await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, admin, "admin");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  const productId = await as(db, dono, async (q) => {
    const pat = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!.id;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pat, JSON.stringify(DOC)]);
    return (
      await q.query<{ id: string }>(
        "insert into public.products (org_id, name, reference, pattern_id) values ($1, 'Saia midi', 'SM-1', $2) returning id",
        [orgId, pat],
      )
    ).rows[0]!.id;
  });
  return { orgId, outraOrg, productId, dono, admin, modelista, fora };
}

const criar = (u: User, orgId: string, url = URL, events: string[] = TODOS) =>
  as(
    db,
    u,
    async (q) =>
      (await q.query<{ id: string; secret: string }>("select * from public.create_webhook_endpoint($1, $2, $3)", [orgId, url, events])).rows[0]!,
  );

/** Roda como a Edge Function (chave de serviço). */
async function servico<T>(fn: (q: PGlite) => Promise<T>): Promise<T> {
  await db.exec("set role service_role");
  try {
    return await fn(db);
  } finally {
    await db.exec("reset role");
  }
}

type Claimed = {
  id: string;
  url: string;
  secret: string;
  event: string;
  payload: Record<string, unknown>;
  attempt: number;
};
const claim = (limit = 100) => servico(async (q) => (await q.query<Claimed>("select * from public.claim_webhook_deliveries($1)", [limit])).rows);
const finish = (id: string, ok: boolean, code: number | null = null, error: string | null = null) =>
  servico((q) => q.query("select public.finish_webhook_delivery($1, $2, $3, $4)", [id, ok, code, error]));

/** Esvazia a fila (o banco é compartilhado entre os testes). */
async function limparFila() {
  await db.query("delete from public.webhook_deliveries");
}

async function filaDe(endpointId: string) {
  return (
    await db.query<{
      event: string;
      status: string;
      attempts: number;
      payload: Record<string, unknown>;
    }>("select event, status, attempts, payload from public.webhook_deliveries where endpoint_id = $1 order by created_at", [endpointId])
  ).rows;
}

describe("cadastro de webhooks", () => {
  it("dono e admin cadastram; o segredo sai uma vez e não é legível pelo app", async () => {
    const c = await cenario();
    const ep = await criar(c.admin, c.orgId);
    expect(ep.secret).toMatch(/^whsec_[0-9a-f]{64}$/);
    expect(await contar(db, c.dono, "select id, url, events, active from public.webhook_endpoints where id = $1", [ep.id])).toBe(1);
    await expect(as(db, c.dono, (q) => q.query("select secret from public.webhook_endpoints"))).rejects.toThrow(/permission denied/);
    await expect(as(db, c.dono, (q) => q.query("update public.webhook_endpoints set active = false"))).rejects.toThrow(/permission denied/);
    await expect(
      as(db, c.dono, (q) =>
        q.query("insert into public.webhook_deliveries (org_id, endpoint_id, event, payload) values ($1, $2, 'teste', '{}')", [c.orgId, ep.id]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("modelista e quem é de fora não cadastram nem veem", async () => {
    const c = await cenario();
    const ep = await criar(c.dono, c.orgId);
    await expect(criar(c.modelista, c.orgId)).rejects.toThrow(/donos e admins/);
    await expect(criar(c.fora, c.orgId)).rejects.toThrow(/donos e admins/);
    expect(await contar(db, c.modelista, "select 1 from public.webhook_endpoints where id = $1", [ep.id])).toBe(0);
    expect(await contar(db, c.fora, "select 1 from public.webhook_endpoints where id = $1", [ep.id])).toBe(0);
    for (const sql of [
      "select public.delete_webhook_endpoint($1)",
      "select public.send_test_webhook($1)",
      "select public.set_webhook_endpoint_active($1, false)",
    ]) {
      await expect(as(db, c.modelista, (q) => q.query(sql, [ep.id]))).rejects.toThrow(/sem permissão/);
      await expect(as(db, c.fora, (q) => q.query(sql, [ep.id]))).rejects.toThrow(/sem permissão/);
    }
  });

  it("recusa URL sem https, local ou de rede interna, evento desconhecido e mais de 5", async () => {
    const c = await cenario();
    for (const url of [
      "http://erp.exemplo.com",
      "https://localhost/x",
      "https://127.0.0.1/x",
      "https://10.0.0.5/x",
      "https://192.168.1.10/x",
      "https://172.20.0.1/x",
      "https://169.254.169.254/latest",
      "https://[::1]/x",
      "https://servidor/x",
      "https://user:senha@erp.exemplo.com/x",
      "https://api.internal/x",
      "https://8.8.8.8/x",
    ]) {
      await expect(criar(c.dono, c.orgId, url), url).rejects.toThrow(/https/);
    }
    await expect(criar(c.dono, c.orgId, URL, [])).rejects.toThrow(/evento/);
    await expect(criar(c.dono, c.orgId, URL, ["produto.apagado"])).rejects.toThrow(/evento/);
    for (let i = 0; i < 5; i++) await criar(c.dono, c.orgId, `https://erp${i}.exemplo.com/h`);
    await expect(criar(c.dono, c.orgId)).rejects.toThrow(/5 webhooks/);
  });
});

describe("eventos", () => {
  it("produto aprovado, ficha gerada e risco salvo entram na fila de quem está inscrito", async () => {
    const c = await cenario();
    await limparFila();
    const todos = await criar(c.dono, c.orgId);
    const soRisco = await criar(c.dono, c.orgId, "https://outro.exemplo.com/h", ["risco.salvo"]);
    const desligado = await criar(c.dono, c.orgId, "https://desligado.exemplo.com/h");
    await as(db, c.admin, (q) => q.query("select public.set_webhook_endpoint_active($1, false)", [desligado.id]));
    const deFora = await criar(c.fora, c.outraOrg, "https://fora.exemplo.com/h");

    await as(db, c.modelista, async (q) => {
      await q.query("update public.products set status = 'prova' where id = $1", [c.productId]);
      await q.query("update public.products set status = 'aprovado' where id = $1", [c.productId]);
      await q.query("update public.products set name = 'Saia midi 2' where id = $1", [c.productId]); // continua aprovado: sem evento novo
      await q.query("select public.create_tech_pack($1, 1, $2)", [c.productId, JSON.stringify({ schema: 1 })]);
      await q.query("select public.create_marker($1, 1, null, 1500, $2, 1234.5, 0.81, $3)", [
        c.productId,
        JSON.stringify({ M: 2 }),
        JSON.stringify(LAYOUT),
      ]);
    });

    const t = await filaDe(todos.id);
    expect(t.map((d) => d.event)).toEqual(["produto.aprovado", "ficha.gerada", "risco.salvo"]);
    expect(t.every((d) => d.status === "pendente" && d.attempts === 0)).toBe(true);
    expect(t[0]!.payload).toMatchObject({
      produto: { id: c.productId, referencia: "SM-1", status: "aprovado" },
    });
    expect(t[1]!.payload).toMatchObject({
      produto_id: c.productId,
      numero: 1,
      versao_molde: 1,
    });
    expect(t[2]!.payload).toMatchObject({
      produto_id: c.productId,
      numero: 1,
      largura_mm: 1500,
      demanda: { M: 2 },
    });
    expect((await filaDe(soRisco.id)).map((d) => d.event)).toEqual(["risco.salvo"]);
    expect(await filaDe(desligado.id)).toEqual([]);
    expect(await filaDe(deFora.id)).toEqual([]);
  });

  it("o teste vai mesmo com o webhook desligado; dono e admin veem as entregas, modelista não", async () => {
    const c = await cenario();
    const ep = await criar(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("select public.set_webhook_endpoint_active($1, false)", [ep.id]));
    await as(db, c.admin, (q) => q.query("select public.send_test_webhook($1)", [ep.id]));
    expect((await filaDe(ep.id)).map((d) => d.event)).toEqual(["teste"]);
    expect(await contar(db, c.admin, "select id, event, status from public.webhook_deliveries where endpoint_id = $1", [ep.id])).toBe(1);
    expect(await contar(db, c.modelista, "select 1 from public.webhook_deliveries where endpoint_id = $1", [ep.id])).toBe(0);
    await expect(as(db, c.dono, (q) => q.query("select payload from public.webhook_deliveries"))).rejects.toThrow(/permission denied/);
  });

  it("apagar o webhook apaga as entregas dele", async () => {
    const c = await cenario();
    const ep = await criar(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("select public.send_test_webhook($1)", [ep.id]));
    await as(db, c.admin, (q) => q.query("select public.delete_webhook_endpoint($1)", [ep.id]));
    expect(await filaDe(ep.id)).toEqual([]);
  });
});

describe("envio (Edge Function)", () => {
  it("só a chave de serviço pega e encerra entregas", async () => {
    const c = await cenario();
    for (const u of [c.dono, null]) {
      await expect(as(db, u, (q) => q.query("select * from public.claim_webhook_deliveries(10)"))).rejects.toThrow(/permission denied/);
      await expect(as(db, u, (q) => q.query("select public.finish_webhook_delivery(gen_random_uuid(), true, 200, null)"))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it("pega uma vez com URL e segredo, e entregue sai da fila", async () => {
    const c = await cenario();
    await limparFila();
    const ep = await criar(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("select public.send_test_webhook($1)", [ep.id]));
    const [d] = await claim();
    expect(d).toMatchObject({
      url: URL,
      secret: ep.secret,
      event: "teste",
      attempt: 1,
    });
    expect(await claim()).toEqual([]); // em envio: ninguém mais pega
    await finish(d!.id, true, 204);
    const [row] = (
      await db.query<{
        status: string;
        delivered_at: string | null;
        last_status_code: number;
      }>("select * from public.webhook_deliveries where id = $1", [d!.id])
    ).rows;
    expect(row).toMatchObject({ status: "entregue", last_status_code: 204 });
    expect(row!.delivered_at).not.toBeNull();
    expect(await claim()).toEqual([]);
  });

  it("falha volta com espera crescente e desiste na 6ª tentativa", async () => {
    const c = await cenario();
    await limparFila();
    const ep = await criar(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("select public.send_test_webhook($1)", [ep.id]));
    const esperas: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const [d] = await claim();
      expect(d!.attempt).toBe(i);
      await finish(d!.id, false, 500, "Erro do servidor");
      const { rows } = await db.query<{ status: string; espera: number }>(
        "select status, round(extract(epoch from next_attempt_at - now()))::int as espera from public.webhook_deliveries where id = $1",
        [d!.id],
      );
      if (i < 6) {
        expect(rows[0]!.status).toBe("pendente");
        esperas.push(rows[0]!.espera);
        await db.query("update public.webhook_deliveries set next_attempt_at = now() where id = $1", [d!.id]); // o tempo passa
      } else {
        expect(rows[0]!.status).toBe("falhou");
      }
    }
    expect(esperas).toEqual([60, 300, 1800, 7200, 43200]);
    expect(await claim()).toEqual([]);
  });

  it("entrega presa (prazo de 2 min vencido) volta a ser pega; encerrar depois não faz nada", async () => {
    const c = await cenario();
    await limparFila();
    const ep = await criar(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("select public.send_test_webhook($1)", [ep.id]));
    const [d] = await claim();
    await db.query("update public.webhook_deliveries set locked_until = now() - interval '1 second' where id = $1", [d!.id]);
    const [again] = await claim();
    expect(again).toMatchObject({ id: d!.id, attempt: 2 });
    await finish(d!.id, true, 200);
    await finish(d!.id, false, 500, "atrasado"); // já entregue: ignorado
    expect((await filaDe(ep.id))[0]!.status).toBe("entregue");
  });
});
