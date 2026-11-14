/** Classes compartilhadas, na linguagem visual da página inicial. */
export const ui = {
  card: "rounded-lg border border-tinta/15 bg-white/70 p-6 shadow-sm",
  label: "block text-sm font-medium text-tinta",
  input:
    "mt-1 block w-full rounded-md border border-tinta/25 bg-white px-3 py-2 text-tinta placeholder:text-tinta-suave/60 focus:border-tinta focus:outline-none focus:ring-2 focus:ring-linha/30",
  buttonPrimary:
    "inline-flex items-center justify-center rounded-md bg-tinta px-4 py-2 text-sm font-medium text-papel transition hover:bg-tinta/85 disabled:cursor-not-allowed disabled:opacity-60",
  buttonGhost:
    "inline-flex items-center justify-center rounded-md border border-tinta/20 px-3 py-1.5 text-sm text-tinta transition hover:bg-papel-escuro disabled:opacity-60",
  error: "rounded-md border border-linha/40 bg-linha/5 px-3 py-2 text-sm text-linha",
  success: "rounded-md border border-tinta/15 bg-papel-escuro px-3 py-2 text-sm text-tinta",
  h1: "font-display text-3xl font-semibold tracking-tight",
  h2: "font-display text-xl font-semibold",
  muted: "text-sm text-tinta-suave",
} as const;

export type FormState = { error?: string; ok?: string; link?: string } | undefined;

export const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  admin: "Admin",
  modelista: "Modelista",
  estilista: "Estilista",
  leitura: "Só leitura",
};
