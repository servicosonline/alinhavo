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

const DOC = { schema: 3, unit: "mm", sizes: ["P", "M", "G"], baseSize: "M", pieces: [], seams: [] };

type Equipe = { orgId: string; dono: User; modelista: User; estilista: User; leitura: User; fora: User };

let seq = 0;
/** Uma organização com um membro de cada papel, mais alguém de fora. */
async function equipe(): Promise<Equipe> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@m.com`);
  const modelista = await createUser(db, `modelista${n}@m.com`);
  const estilista = await createUser(db, `estilista${n}@m.com`);
  const leitura = await createUser(db, `leitura${n}@m.com`);
  const fora = await createUser(db, `fora${n}@m.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  return { orgId, dono, modelista, estilista, leitura, fora };
}

async function um<T>(user: User, sql: string, params: unknown[] = []): Promise<T> {
  return as(db, user, async (q) => (await q.query<T>(sql, params)).rows[0]!);
}

async function novaTabela(user: User, orgId: string, name = "Feminino") {
  return um<{ id: string }>(user, "insert into public.size_charts (org_id, name) values ($1, $2) returning id", [
    orgId,
    name,
  ]);
}

async function novoTamanho(user: User, orgId: string, chartId: string, label: string, position: number, isBase = false) {
  return um<{ id: string }>(
    user,
    "insert into public.sizes (org_id, size_chart_id, label, position, is_base) values ($1, $2, $3, $4, $5) returning id",
    [orgId, chartId, label, position, isBase],
  );
}

async function novoMolde(user: User, orgId: string, chartId: string | null = null) {
  return um<{ id: string; current_version: number }>(
    user,
    "insert into public.patterns (org_id, name, size_chart_id) values ($1, 'Saia base', $2) returning id, current_version",
    [orgId, chartId],
  );
}

async function salvar(user: User, patternId: string, expected: number, doc: unknown = DOC, message: string | null = null) {
  return um<{ number: number; origin: string; message: string | null }>(
    user,
    "select number, origin, message from public.save_pattern_version($1, $2, 'editor', $3, $4)",
    [patternId, JSON.stringify(doc), expected, message],
  );
}

describe("tabelas de medidas", () => {
  it("modelista monta tabela, tamanhos e medidas; todo membro lê", async () => {
    const e = await equipe();
    const tabela = await novaTabela(e.modelista, e.orgId);
    const m = await novoTamanho(e.modelista, e.orgId, tabela.id, "M", 1, true);
    await as(db, e.modelista, (q) =>
      q.query("insert into public.measurements (org_id, size_id, name, value_mm) values ($1, $2, 'cintura', 700)", [
        e.orgId,
        m.id,
      ]),
    );

    for (const u of [e.dono, e.estilista, e.leitura]) {
      expect(await contar(db, u, "select 1 from public.measurements where size_id = $1", [m.id])).toBe(1);
    }
    expect(await contar(db, e.fora, "select 1 from public.size_charts where id = $1", [tabela.id])).toBe(0);
    expect(await contar(db, e.fora, "select 1 from public.measurements where size_id = $1", [m.id])).toBe(0);
  });

  it("estilista e só-leitura não editam medidas", async () => {
    const e = await equipe();
    const tabela = await novaTabela(e.modelista, e.orgId);
    for (const u of [e.estilista, e.leitura]) {
      await expect(novaTabela(u, e.orgId, "Tentativa")).rejects.toThrow(/row-level security/);
      const up = await as(db, u, (q) =>
        q.query("update public.size_charts set name = 'Mudou' where id = $1", [tabela.id]),
      );
      expect(up.affectedRows).toBe(0);
    }
  });

  it("medida em mm precisa ser positiva e o nome em minúsculas", async () => {
    const e = await equipe();
    const tabela = await novaTabela(e.modelista, e.orgId);
    const m = await novoTamanho(e.modelista, e.orgId, tabela.id, "M", 1);
    const inserir = (name: string, valor: number) =>
      as(db, e.modelista, (q) =>
        q.query("insert into public.measurements (org_id, size_id, name, value_mm) values ($1, $2, $3, $4)", [
          e.orgId,
          m.id,
          name,
          valor,
        ]),
      );
    await expect(inserir("quadril", 0)).rejects.toThrow(/check/);
    await expect(inserir("Quadril", 950)).rejects.toThrow(/check/);
    await inserir("quadril", 950);
    await expect(inserir("quadril", 960)).rejects.toThrow(/duplicate key/);
  });

  it("só um tamanho base por tabela, e set_base_size troca de uma vez", async () => {
    const e = await equipe();
    const tabela = await novaTabela(e.modelista, e.orgId);
    const p = await novoTamanho(e.modelista, e.orgId, tabela.id, "P", 0, true);
    const m = await novoTamanho(e.modelista, e.orgId, tabela.id, "M", 1);
    await expect(novoTamanho(e.modelista, e.orgId, tabela.id, "G", 2, true)).rejects.toThrow(/duplicate key/);

    await as(db, e.modelista, (q) => q.query("select public.set_base_size($1)", [m.id]));
    const bases = await as(db, e.leitura, async (q) =>
      (await q.query<{ id: string }>("select id from public.sizes where size_chart_id = $1 and is_base", [tabela.id]))
        .rows,
    );
    expect(bases).toEqual([{ id: m.id }]);

    await expect(as(db, e.leitura, (q) => q.query("select public.set_base_size($1)", [p.id]))).rejects.toThrow(
      /Sem permissão/,
    );
    await expect(as(db, e.fora, (q) => q.query("select public.set_base_size($1)", [p.id]))).rejects.toThrow(
      /não encontrado/,
    );
  });
});

describe("vínculos entre organizações", () => {
  it("quem está em duas organizações não liga dados de uma na outra", async () => {
    const a = await equipe();
    const b = await equipe();
    // o modelista de A também vira modelista de B
    await entrarComo(db, b.dono, b.orgId, a.modelista, "modelista");
    const tabelaB = await novaTabela(a.modelista, b.orgId, "Tabela de B");

    await expect(novoTamanho(a.modelista, a.orgId, tabelaB.id, "M", 1)).rejects.toThrow(/foreign key/);
    await expect(novoMolde(a.modelista, a.orgId, tabelaB.id)).rejects.toThrow(/foreign key/);
  });

  it("org_id não pode ser trocado depois de criado", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await expect(
      as(db, e.modelista, (q) =>
        q.query("update public.patterns set org_id = gen_random_uuid() where id = $1", [molde.id]),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("moldes e versões", () => {
  it("salvar cria a versão 1, 2, 3… e atualiza a versão atual", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    expect(molde.current_version).toBe(0);

    expect(await salvar(e.modelista, molde.id, 0, DOC, "  primeira  ")).toEqual({
      number: 1,
      origin: "editor",
      message: "primeira",
    });
    expect((await salvar(e.dono, molde.id, 1)).number).toBe(2);
    const atual = await um<{ current_version: number }>(
      e.leitura,
      "select current_version from public.patterns where id = $1",
      [molde.id],
    );
    expect(atual.current_version).toBe(2);
    expect(await contar(db, e.leitura, "select 1 from public.pattern_versions where pattern_id = $1", [molde.id])).toBe(2);
  });

  it("recusa salvar por cima de uma versão mais nova", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await salvar(e.modelista, molde.id, 0);
    // o dono também abriu na versão 0 e tenta salvar depois
    await expect(salvar(e.dono, molde.id, 0)).rejects.toThrow(/alterado por outra pessoa/);
  });

  it("estilista, só-leitura e quem é de fora não salvam versões", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    for (const u of [e.estilista, e.leitura, e.fora]) {
      await expect(salvar(u, molde.id, 0)).rejects.toThrow(/sem permissão/);
    }
    await expect(
      as(db, null, (q) =>
        q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [molde.id, JSON.stringify(DOC)]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("recusa documento fora do formato", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await expect(salvar(e.modelista, molde.id, 0, { ...DOC, unit: "cm" })).rejects.toThrow(/check/);
    await expect(salvar(e.modelista, molde.id, 0, { ...DOC, schema: 4 })).rejects.toThrow(/check/);
    await expect(salvar(e.modelista, molde.id, 0, { schema: 3, unit: "mm" })).rejects.toThrow(/check/);
    // Formatos 2 e 3 exigem a lista de costuras.
    const { seams: _seams, ...semCosturas } = DOC;
    await expect(salvar(e.modelista, molde.id, 0, semCosturas)).rejects.toThrow(/check/);
    await expect(salvar(e.modelista, molde.id, 0, { ...semCosturas, schema: 2 })).rejects.toThrow(/check/);
    await expect(salvar(e.modelista, molde.id, 0, { ...DOC, seams: {} })).rejects.toThrow(/check/);
  });

  it("aceita os formatos 1 e 2 (versões antigas) e 3 (com dobra e posição na Prova)", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    const { seams: _seams, ...v1 } = { ...DOC, schema: 1 };
    await salvar(e.modelista, molde.id, 0, v1);
    const costura = { id: "costura1", a: { piece: "a", segment: 0 }, b: { piece: "b", segment: 0 }, direction: "opposite" };
    await salvar(e.modelista, molde.id, 1, { ...DOC, schema: 2, seams: [costura] });
    const parte = { id: "a", fold: 3, placement: { side: "frente", anchor: "cintura", offset: 0 } };
    await salvar(e.modelista, molde.id, 2, { ...DOC, pieces: [parte], seams: [costura] });
    const ultima = await um<{ document: { schema: number; seams: unknown[]; pieces: unknown[] } }>(
      e.modelista,
      "select document from public.pattern_versions where pattern_id = $1 and number = 3",
      [molde.id],
    );
    expect(ultima.document.schema).toBe(3);
    expect(ultima.document.seams).toEqual([costura]);
    expect(ultima.document.pieces).toEqual([parte]);
  });

  it("versões não mudam nem somem, nem para o dono", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await salvar(e.modelista, molde.id, 0);
    await expect(
      as(db, e.dono, (q) => q.query("insert into public.pattern_versions (org_id, pattern_id, number, document, origin) values ($1, $2, 9, $3, 'editor')", [e.orgId, molde.id, JSON.stringify(DOC)])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, e.dono, (q) => q.query("update public.pattern_versions set message = 'x' where pattern_id = $1", [molde.id])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, e.dono, (q) => q.query("delete from public.pattern_versions where pattern_id = $1", [molde.id])),
    ).rejects.toThrow(/permission denied/);
    // nem o dono do banco altera por engano
    await expect(db.query("update public.pattern_versions set message = 'x' where pattern_id = $1", [molde.id])).rejects.toThrow(
      /não podem ser alteradas/,
    );
  });

  it("cliente não mexe na versão atual direto", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await expect(
      as(db, e.modelista, (q) => q.query("update public.patterns set current_version = 99 where id = $1", [molde.id])),
    ).rejects.toThrow(/permission denied/);
  });

  it("só dono e admin apagam um molde, e o histórico vai junto", async () => {
    const e = await equipe();
    const molde = await novoMolde(e.modelista, e.orgId);
    await salvar(e.modelista, molde.id, 0);

    const delModelista = await as(db, e.modelista, (q) => q.query("delete from public.patterns where id = $1", [molde.id]));
    expect(delModelista.affectedRows).toBe(0);
    const delDono = await as(db, e.dono, (q) => q.query("delete from public.patterns where id = $1", [molde.id]));
    expect(delDono.affectedRows).toBe(1);
    const { rows } = await db.query("select 1 from public.pattern_versions where pattern_id = $1", [molde.id]);
    expect(rows).toHaveLength(0);
  });
});
