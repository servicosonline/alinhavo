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

const DOC = { schema: 3, unit: "mm", sizes: ["M"], baseSize: "M", pieces: [], seams: [] };
/** Menor JPEG e PNG que passam pela conferência dos primeiros bytes. */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9]).toString("base64");

type Cenario = { orgId: string; patternId: string; dono: User; modelista: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@a.com`);
  const modelista = await createUser(db, `modelista${n}@a.com`);
  const leitura = await createUser(db, `leitura${n}@a.com`);
  const fora = await createUser(db, `fora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const patternId = await as(db, modelista, async (q) => {
    const { rows } = await q.query<{ id: string }>(
      "insert into public.patterns (org_id, name) values ($1, 'Saia') returning id",
      [orgId],
    );
    const id = rows[0]!.id;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [id, JSON.stringify(DOC)]);
    return id;
  });
  return { orgId, patternId, dono, modelista, leitura, fora };
}

async function criar(
  user: User | null,
  patternId: string,
  opts: { version?: number; images?: unknown; days?: number } = {},
): Promise<{ id: string; token: string }> {
  return as(db, user, async (q) => {
    const { rows } = await q.query<{ id: string; token: string }>(
      "select id, token from public.create_approval($1, $2, $3, $4, $5)",
      [
        patternId,
        opts.version ?? 1,
        JSON.stringify({ size: "M", fabric: "planoLeve", pose: "em-pe" }),
        JSON.stringify(opts.images ?? [{ angle: "frente", data: JPEG }, { angle: "costas", data: PNG }]),
        opts.days ?? 14,
      ],
    );
    return rows[0]!;
  });
}

type Publica = {
  pattern_name: string;
  version: number;
  status: string;
  reviewer_name: string | null;
  images: { angle: string; mime: string; data: string }[];
} | null;

async function ver(token: string, user: User | null = null): Promise<Publica> {
  return as(db, user, async (q) => (await q.query<{ j: Publica }>("select public.public_approval($1) as j", [token])).rows[0]!.j);
}

async function responder(token: string, status: string, name: string, comment: string | null = null) {
  return as(db, null, (q) => q.query("select public.decide_approval($1, $2, $3, $4)", [token, status, name, comment]));
}

describe("criar aprovação", () => {
  it("quem edita moldes cria com as imagens; todo membro lê; o token abre a parte pública", async () => {
    const c = await cenario();
    const { id, token } = await criar(c.modelista, c.patternId);
    expect(await contar(db, c.leitura, "select 1 from public.approvals where id = $1", [id])).toBe(1);
    expect(await contar(db, c.leitura, "select 1 from public.approval_images where approval_id = $1", [id])).toBe(2);

    const pub = await ver(token);
    expect(pub).toMatchObject({ pattern_name: "Saia", version: 1, status: "pendente", reviewer_name: null });
    expect(pub!.images.map((i) => [i.angle, i.mime])).toEqual([
      ["frente", "image/jpeg"],
      ["costas", "image/png"],
    ]);
    expect(pub!.images[0]!.data).toBe(JPEG);
    // Nada da organização na parte pública.
    expect(JSON.stringify(pub)).not.toContain(c.orgId);
  });

  it("só-leitura, quem é de fora e visitante não criam", async () => {
    const c = await cenario();
    for (const u of [c.leitura, c.fora]) {
      await expect(criar(u, c.patternId)).rejects.toThrow(/sem permissão/);
    }
    await expect(criar(null, c.patternId)).rejects.toThrow(/permission denied/);
  });

  it("recusa versão inexistente, prazo fora de 1 a 60 dias e imagens fora do formato", async () => {
    const c = await cenario();
    await expect(criar(c.modelista, c.patternId, { version: 9 })).rejects.toThrow(/versão do molde não existe/);
    await expect(criar(c.modelista, c.patternId, { days: 0 })).rejects.toThrow(/1 a 60 dias/);
    await expect(criar(c.modelista, c.patternId, { days: 61 })).rejects.toThrow(/1 a 60 dias/);
    await expect(criar(c.modelista, c.patternId, { images: [] })).rejects.toThrow(/1 a 4 imagens/);
    const cinco = Array.from({ length: 5 }, () => ({ angle: "atual", data: JPEG }));
    await expect(criar(c.modelista, c.patternId, { images: cinco })).rejects.toThrow(/1 a 4 imagens/);
    const texto = Buffer.from("<svg onload=alert(1)>").toString("base64");
    await expect(criar(c.modelista, c.patternId, { images: [{ angle: "atual", data: texto }] })).rejects.toThrow(/JPEG ou PNG/);
    await expect(criar(c.modelista, c.patternId, { images: [{ angle: "cima", data: JPEG }] })).rejects.toThrow(/check/);
    const grande = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(600_000)]).toString("base64");
    await expect(criar(c.modelista, c.patternId, { images: [{ angle: "atual", data: grande }] })).rejects.toThrow(/check/);
    // Nada ficou pela metade.
    expect(await contar(db, c.modelista, "select 1 from public.approvals where pattern_id = $1", [c.patternId])).toBe(0);
  });

  it("ninguém escreve direto nas tabelas, nem muda o status por fora", async () => {
    const c = await cenario();
    const { id } = await criar(c.modelista, c.patternId);
    await expect(
      as(db, c.dono, (q) => q.query("update public.approvals set status = 'aprovado' where id = $1", [id])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, c.dono, (q) =>
        q.query("insert into public.approvals (org_id, pattern_id, version_number, expires_at) values ($1, $2, 1, now())", [
          c.orgId,
          c.patternId,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(as(db, null, (q) => q.query("select * from public.approvals"))).rejects.toThrow(/permission denied/);
  });

  it("quem é de fora não lê; quem edita apaga (revoga o link) e as imagens vão junto", async () => {
    const c = await cenario();
    const { id, token } = await criar(c.modelista, c.patternId);
    expect(await contar(db, c.fora, "select 1 from public.approvals where id = $1", [id])).toBe(0);
    expect(await contar(db, c.fora, "select 1 from public.approval_images where approval_id = $1", [id])).toBe(0);
    await as(db, c.leitura, (q) => q.query("delete from public.approvals where id = $1", [id]));
    expect(await contar(db, c.dono, "select 1 from public.approvals where id = $1", [id])).toBe(1); // só-leitura não apagou
    await as(db, c.modelista, (q) => q.query("delete from public.approvals where id = $1", [id]));
    expect(await contar(db, c.dono, "select 1 from public.approval_images where approval_id = $1", [id])).toBe(0);
    expect(await ver(token)).toBeNull();
  });
});

describe("parte pública", () => {
  it("token errado e link vencido dão a mesma resposta: nada", async () => {
    const c = await cenario();
    const { id, token } = await criar(c.modelista, c.patternId);
    expect(await ver("00000000-0000-4000-8000-000000000000")).toBeNull();
    await db.query("update public.approvals set expires_at = now() - interval '1 minute' where id = $1", [id]);
    expect(await ver(token)).toBeNull();
    await expect(responder(token, "aprovado", "Ana")).rejects.toThrow(/inválido ou vencido/);
  });

  it("o cliente aprova uma vez só; a equipe vê a resposta", async () => {
    const c = await cenario();
    const { id, token } = await criar(c.modelista, c.patternId);
    await responder(token, "aprovado", "  Ana Cliente ");
    await expect(responder(token, "ajustes", "Outra pessoa", "mudar a barra")).rejects.toThrow(/já foi respondida/);
    const row = await as(db, c.leitura, async (q) =>
      (await q.query<{ status: string; reviewer_name: string; decided_at: string | null }>(
        "select status, reviewer_name, decided_at from public.approvals where id = $1",
        [id],
      )).rows[0]!,
    );
    expect(row.status).toBe("aprovado");
    expect(row.reviewer_name).toBe("Ana Cliente");
    expect(row.decided_at).not.toBeNull();
    expect((await ver(token))!.status).toBe("aprovado");
  });

  it("pedir ajustes exige nome e comentário; pendente não é resposta", async () => {
    const c = await cenario();
    const { token } = await criar(c.modelista, c.patternId);
    await expect(responder(token, "ajustes", "Ana")).rejects.toThrow(/precisa ser ajustado/);
    await expect(responder(token, "aprovado", "   ")).rejects.toThrow(/seu nome/);
    await expect(responder(token, "pendente", "Ana")).rejects.toThrow(/aprovar ou pedir ajustes/);
    await responder(token, "ajustes", "Ana", "Alongar 2 cm a barra");
    expect((await ver(token))!.status).toBe("ajustes");
  });
});
