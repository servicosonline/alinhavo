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

const DOC = { schema: 5, unit: "mm", sizes: ["M"], baseSize: "M", pieces: [], seams: [] };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");

type Cenario = { orgId: string; approvalId: string; token: string; modelista: User; estilista: User; leitura: User; fora: User; outraOrg: string };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `vdono${n}@a.com`);
  const modelista = await createUser(db, `vmodelista${n}@a.com`);
  const estilista = await createUser(db, `vestilista${n}@a.com`);
  const leitura = await createUser(db, `vleitura${n}@a.com`);
  const fora = await createUser(db, `vfora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  const { id: outraOrg } = await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const { approvalId, token } = await as(db, modelista, async (q) => {
    const { rows } = await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId]);
    const patternId = rows[0]!.id;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [patternId, JSON.stringify(DOC)]);
    const a = await q.query<{ id: string; token: string }>("select id, token from public.create_approval($1, 1, '{}', $2, 14)", [
      patternId,
      JSON.stringify([{ angle: "frente", data: JPEG }]),
    ]);
    return { approvalId: a.rows[0]!.id, token: a.rows[0]!.token };
  });
  return { orgId, approvalId, token, modelista, estilista, leitura, fora, outraOrg };
}

/** Envia um "arquivo" como o Storage faria: insert em storage.objects com a sessão de quem envia. */
function enviar(user: User | null, name: string, bucket = "aprovacoes") {
  return as(db, user, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ($1, $2, '{}')", [bucket, name]));
}
function ligar(user: User | null, approvalId: string, path: string | null) {
  return as(db, user, (q) => q.query("select public.attach_approval_video($1, $2)", [approvalId, path]));
}
const caminho = (c: Cenario, ext = "mp4") => `${c.orgId}/${c.approvalId}/video.${ext}`;

describe("vídeo da aprovação no Storage", () => {
  it("o bucket é privado e só aceita MP4 e WebM de até 10 MB", async () => {
    const { rows } = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
      "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'aprovacoes'",
    );
    expect(rows[0]).toEqual({ public: false, file_size_limit: 10485760, allowed_mime_types: ["video/mp4", "video/webm"] });
  });

  it("quem edita moldes envia no caminho da aprovação; membros leem; de fora não vê", async () => {
    const c = await cenario();
    await enviar(c.modelista, caminho(c));
    const sql = "select 1 from storage.objects where bucket_id = 'aprovacoes' and name = $1";
    expect(await contar(db, c.leitura, sql, [caminho(c)])).toBe(1);
    expect(await contar(db, c.estilista, sql, [caminho(c)])).toBe(1);
    expect(await contar(db, c.fora, sql, [caminho(c)])).toBe(0);
    expect(await contar(db, null, sql, [caminho(c)])).toBe(0);
  });

  it("estilista, só-leitura, quem é de fora e visitante não enviam", async () => {
    const c = await cenario();
    for (const u of [c.estilista, c.leitura, c.fora, null]) {
      await expect(enviar(u, caminho(c, "webm"))).rejects.toThrow(/row-level security|permission denied/);
    }
  });

  it("recusa caminho fora do formato, de outra organização ou de aprovação que não existe", async () => {
    const c = await cenario();
    const errados = [
      `${c.orgId}/${c.approvalId}/outro.mp4`,
      `${c.orgId}/${c.approvalId}/video.mov`,
      `${c.outraOrg}/${c.approvalId}/video.mp4`,
      `${c.orgId}/00000000-0000-4000-8000-000000000000/video.mp4`,
      `${c.orgId}/${c.approvalId}/x/video.mp4`,
      "../video.mp4",
    ];
    for (const name of errados) await expect(enviar(c.modelista, name)).rejects.toThrow(/row-level security/);
    await expect(enviar(c.modelista, caminho(c), "outro-bucket")).rejects.toThrow();
  });

  it("só quem edita apaga o arquivo", async () => {
    const c = await cenario();
    await enviar(c.modelista, caminho(c));
    const del = (u: User) => as(db, u, (q) => q.query("delete from storage.objects where bucket_id = 'aprovacoes' and name = $1", [caminho(c)]));
    await del(c.leitura); // RLS: não apaga nada (sem erro)
    expect(await contar(db, c.modelista, "select 1 from storage.objects where name = $1", [caminho(c)])).toBe(1);
    await del(c.modelista);
    expect(await contar(db, c.modelista, "select 1 from storage.objects where name = $1", [caminho(c)])).toBe(0);
  });
});

describe("attach_approval_video", () => {
  it("liga o vídeo enviado; a página pública passa a dizer que há vídeo", async () => {
    const c = await cenario();
    const publica = async () =>
      (await as(db, null, (q) => q.query<{ j: { has_video: boolean } }>("select public.public_approval($1) as j", [c.token]))).rows[0]!.j;
    expect((await publica()).has_video).toBe(false);
    await enviar(c.modelista, caminho(c));
    await ligar(c.modelista, c.approvalId, caminho(c));
    expect((await publica()).has_video).toBe(true);
    await ligar(c.modelista, c.approvalId, null);
    expect((await publica()).has_video).toBe(false);
  });

  it("recusa sem o arquivo, caminho de outra aprovação e quem não edita", async () => {
    const c = await cenario();
    await expect(ligar(c.modelista, c.approvalId, caminho(c))).rejects.toThrow(/não foi enviado/);
    await expect(ligar(c.modelista, c.approvalId, `${c.orgId}/00000000-0000-4000-8000-000000000000/video.mp4`)).rejects.toThrow(/inválido/);
    await enviar(c.modelista, caminho(c));
    for (const u of [c.estilista, c.leitura, c.fora]) await expect(ligar(u, c.approvalId, caminho(c))).rejects.toThrow(/sem permissão/);
    await expect(ligar(null, c.approvalId, caminho(c))).rejects.toThrow(/permission denied|logado/);
  });

  it("ninguém escreve video_path direto", async () => {
    const c = await cenario();
    await expect(as(db, c.modelista, (q) => q.query("update public.approvals set video_path = 'x' where id = $1", [c.approvalId]))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("approval_video_path (para a Edge Function)", () => {
  it("só a chave de serviço pergunta, e só um link que vale responde", async () => {
    const c = await cenario();
    await enviar(c.modelista, caminho(c));
    await ligar(c.modelista, c.approvalId, caminho(c));
    for (const u of [null, c.modelista]) {
      await expect(as(db, u, (q) => q.query("select public.approval_video_path($1)", [c.token]))).rejects.toThrow(/permission denied/);
    }
    const servico = async (token: string) => {
      await db.exec("set role service_role");
      try {
        return (await db.query<{ p: string | null }>("select public.approval_video_path($1) as p", [token])).rows[0]!.p;
      } finally {
        await db.exec("reset role");
      }
    };
    expect(await servico(c.token)).toBe(caminho(c));
    expect(await servico("00000000-0000-4000-8000-000000000000")).toBeNull();
    await db.query("update public.approvals set expires_at = now() - interval '1 day' where id = $1", [c.approvalId]);
    expect(await servico(c.token)).toBeNull(); // vencido responde igual a token errado
  });
});
