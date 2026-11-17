import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { entrarComo, novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

let seq = 0;
const novo = (p: string) => createUser(db, `${p}${++seq}@i.com`);

let dono: User;
beforeAll(async () => {
  dono = await novo("superdono");
  await db.query("insert into public.platform_admins (user_id, role) values ($1, 'dono')", [dono.id]);
});

const regras = (enabled: boolean, referrer = 20, referred = 3000) =>
  as(db, dono, (q) =>
    q.query("select public.platform_set_referral_settings($1, 'percentual', $2, 1, 'fixo', $3, 1)", [enabled, referrer, referred]),
  );

beforeEach(async () => {
  await regras(true);
});

const codigo = (u: User) => as(db, u, async (q) => (await q.query<{ c: string }>("select public.my_referral_code() as c")).rows[0]!.c);
const ligar = (u: User, code: string) =>
  as(db, u, async (q) => (await q.query<{ r: string }>("select public.claim_referral($1) as r", [code])).rows[0]!.r);
async function pagou(u: User) {
  await db.exec("set role service_role");
  try {
    return (await db.query<{ r: string }>("select public.referral_mark_paid($1) as r", [u.id])).rows[0]!.r;
  } finally {
    await db.exec("reset role");
  }
}
const cpf = (u: User, doc: string) =>
  as(db, u, (q) => q.query("insert into public.profiles (user_id, document_type, document) values ($1, 'cpf', $2)", [u.id, doc]));

describe("indicação de amigos", () => {
  it("cada pessoa tem um código só, de 8 letras e números", async () => {
    const a = await novo("a");
    const c1 = await codigo(a);
    expect(c1).toMatch(/^[A-Z0-9]{8}$/);
    expect(await codigo(a)).toBe(c1);
  });

  it("conta nova liga ao código; o primeiro pagamento registra os dois descontos uma vez só", async () => {
    const a = await novo("a");
    const b = await novo("b");
    expect(await ligar(b, (await codigo(a)).toLowerCase())).toBe("ligada");
    expect(await pagou(b)).toBe("pagou");
    expect(await pagou(b)).toBe("pagou");
    const { rows } = await db.query<{ side: string; user_id: string; kind: string; value: number }>(
      "select side, user_id, kind, value from public.referral_rewards w join public.referrals r on r.id = w.referral_id where r.referred_id = $1 order by side",
      [b.id],
    );
    expect(rows).toEqual([
      { side: "indicado", user_id: b.id, kind: "fixo", value: 3000 },
      { side: "quem_indicou", user_id: a.id, kind: "percentual", value: 20 },
    ]);
  });

  it("travas: código errado, a própria conta, o mesmo CPF, conta antiga, segunda indicação, programa desligado", async () => {
    const a = await novo("a");
    const code = await codigo(a);
    expect(await ligar(await novo("x"), "NAOEXISTE")).toBe("codigo_invalido");
    expect(await ligar(a, code)).toBe("propria_conta");
    const gemea = await novo("gemea");
    await cpf(a, "52998224725");
    await cpf(gemea, "52998224725");
    expect(await ligar(gemea, code)).toBe("propria_conta");
    const antiga = await novo("antiga");
    await novaOrg(db, antiga, "Já existia");
    expect(await ligar(antiga, code)).toBe("conta_antiga");
    const convidada = await novo("convidada");
    const outra = await novo("outra");
    const { id: org } = await novaOrg(db, outra, "Org da outra");
    await entrarComo(db, outra, org, convidada, "modelista");
    expect(await ligar(convidada, code)).toBe("conta_antiga");
    const b = await novo("b");
    const c = await novo("c");
    expect(await ligar(b, code)).toBe("ligada");
    expect(await ligar(b, await codigo(c))).toBe("ja_indicada");
    await regras(false);
    expect(await ligar(await novo("d"), code)).toBe("programa_desligado");
  });

  it("mesmo CPF preenchido depois do cadastro: o pagamento recusa e não dá desconto", async () => {
    const a = await novo("a");
    const b = await novo("b");
    expect(await ligar(b, await codigo(a))).toBe("ligada");
    await cpf(a, "11144477735");
    await cpf(b, "11144477735");
    expect(await pagou(b)).toBe("recusada");
    const { rows } = await db.query("select 1 from public.referral_rewards w join public.referrals r on r.id = w.referral_id where r.referred_id = $1", [b.id]);
    expect(rows).toHaveLength(0);
  });

  it("só o servidor marca pagamento; ninguém escreve nas tabelas pelo app", async () => {
    const a = await novo("a");
    const b = await novo("b");
    await ligar(b, await codigo(a));
    await expect(as(db, b, (q) => q.query("select public.referral_mark_paid($1)", [b.id]))).rejects.toThrow(/permission denied/);
    await expect(as(db, b, (q) => q.query("update public.referrals set status = 'pagou' where referred_id = $1", [b.id]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(as(db, a, (q) => q.query("insert into public.referral_codes (user_id, code) values ($1, 'ABCDEFGH')", [a.id]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("cada um vê só as suas indicações; quem indicou vê o e-mail mascarado", async () => {
    const a = await novo("ana");
    const b = await novo("bruna");
    const fora = await novo("fora");
    await ligar(b, await codigo(a));
    const mine = await as(db, a, async (q) => (await q.query<{ email_hint: string; status: string }>("select email_hint, status from public.my_referrals()")).rows);
    expect(mine).toEqual([{ email_hint: "br***@i.com", status: "cadastrado" }]);
    const seen = await as(db, fora, async (q) => (await q.query("select 1 from public.referrals")).rows.length);
    expect(seen).toBe(0);
  });

  it("regras: todo logado lê; só o superadmin dono muda, dentro dos limites, e vai para a auditoria", async () => {
    const a = await novo("a");
    const suporte = await novo("suporte");
    await db.query("insert into public.platform_admins (user_id, role) values ($1, 'suporte')", [suporte.id]);
    const { rows } = await as(db, a, (q) => q.query<{ enabled: boolean }>("select enabled from public.referral_settings"));
    expect(rows[0]!.enabled).toBe(true);
    for (const u of [a, suporte]) {
      await expect(as(db, u, (q) => q.query("select public.platform_set_referral_settings(true, 'percentual', 10, 1, 'fixo', 0, 1)"))).rejects.toThrow(/superadmin dono/);
    }
    await expect(regras(true, 150)).rejects.toThrow(/fora do limite/);
    await expect(regras(true, 10, 200000)).rejects.toThrow(/fora do limite/);
    const audit = await db.query<{ n: number }>("select count(*)::int as n from public.platform_audit where action = 'indicacao_regras'");
    expect(audit.rows[0]!.n).toBeGreaterThan(0);
    // O suporte lê a lista; quem não é admin, não.
    await as(db, suporte, (q) => q.query("select * from public.platform_referrals()"));
    await expect(as(db, a, (q) => q.query("select * from public.platform_referrals()"))).rejects.toThrow(/superadmin/);
  });

  it("desconto zerado não vira crédito", async () => {
    await regras(true, 0, 0);
    const a = await novo("a");
    const b = await novo("b");
    await ligar(b, await codigo(a));
    expect(await pagou(b)).toBe("pagou");
    const { rows } = await db.query("select 1 from public.referral_rewards w join public.referrals r on r.id = w.referral_id where r.referred_id = $1", [b.id]);
    expect(rows).toHaveLength(0);
  });
});
