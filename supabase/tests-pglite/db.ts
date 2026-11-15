/**
 * Banco de teste: Postgres real (PGlite, em WASM) com as migrações do projeto
 * e uma imitação mínima do que o Supabase oferece (roles, schema auth,
 * auth.uid(), auth.jwt() e as permissões padrão do schema public).
 * Assim os testes de RLS rodam sem Docker, localmente e no CI.
 */
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "migrations");

const SUPABASE_STUB = /* sql */ `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key, email text);

  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;

  -- Storage: só o que as políticas usam (buckets, objetos com RLS, foldername).
  -- No Supabase de verdade é o serviço do Storage que grava em storage.objects,
  -- já com o papel e o jwt de quem enviou; aqui o teste faz o insert direto.
  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid default auth.uid(),
    metadata jsonb,
    created_at timestamptz default now(),
    unique (bucket_id, name)
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select on storage.buckets to anon, authenticated, service_role;
  grant all on storage.objects to anon, authenticated, service_role;

  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export async function createDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(join(MIGRATIONS_DIR, file), "utf8"));
  }
  return db;
}

export type User = { id: string; email: string };

export async function createUser(db: PGlite, email: string): Promise<User> {
  const user = { id: randomUUID(), email };
  await db.query("insert into auth.users (id, email) values ($1, $2)", [user.id, user.email]);
  return user;
}

/** Roda `fn` como se fosse uma requisição do app: logado como `user`, ou visitante se null. */
export async function as<T>(db: PGlite, user: User | null, fn: (db: PGlite) => Promise<T>): Promise<T> {
  const claims = user
    ? { sub: user.id, email: user.email, role: "authenticated" }
    : { role: "anon" };
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  try {
    return await fn(db);
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}
