/**
 * Classes compartilhadas, na linguagem visual da página inicial e do manual (marca/README.md):
 * cantos de 10 px nos botões, cartões brancos de 16 px, títulos em Fraunces, rótulo mono em maiúsculas.
 * Botão principal em Tinta; Linha (vermelho) só para o destaque de uma tela (ex.: "Provar", "Aprovar").
 */
const button =
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export const ui = {
  card: "rounded-2xl border border-tinta/10 bg-white p-6",
  label: "block text-sm font-medium text-tinta",
  input:
    "mt-1 block w-full rounded-lg border border-tinta/25 bg-white px-3 py-2 text-tinta placeholder:text-tinta-suave/60 focus:border-tinta focus:outline-none focus:ring-2 focus:ring-costura/25",
  /** Seletor pequeno de barra de ferramentas (sem a margem e a largura toda do `input`). */
  select:
    "rounded-lg border border-tinta/25 bg-white px-2.5 py-1.5 text-sm text-tinta focus:border-tinta focus:outline-none focus:ring-2 focus:ring-costura/25",
  buttonPrimary: `${button} border border-transparent bg-tinta px-4 py-2.5 text-papel hover:bg-black`,
  buttonAccent: `${button} border border-transparent bg-linha px-4 py-2.5 text-white hover:bg-linha-escura`,
  /** Destaque do tamanho dos botões de barra de ferramentas (ex.: "Provar" no editor). */
  buttonAccentSm: `${button} border border-transparent bg-linha px-3 py-1.5 text-white hover:bg-linha-escura`,
  /** Par do botão principal, no mesmo tamanho (ex.: "Página inicial" ao lado de "Ir para o painel"). */
  buttonSecondary: `${button} border border-tinta/25 bg-papel/40 px-4 py-2.5 text-tinta hover:border-tinta hover:bg-papel-escuro`,
  buttonGhost: `${button} border border-tinta/25 bg-papel/40 px-3 py-1.5 text-tinta hover:border-tinta hover:bg-papel-escuro`,
  error: "rounded-lg border border-linha/40 bg-linha/5 px-3 py-2 text-sm text-linha",
  success: "rounded-lg border border-tinta/15 bg-papel-escuro px-3 py-2 text-sm text-tinta",
  h1: "font-display text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.025em] sm:text-[2.5rem]",
  h2: "font-display text-2xl font-semibold tracking-[-0.015em]",
  /** Rótulo técnico: mono, maiúsculas, espaçado (cabeçalhos de seção, "Versão 3", "Aprovação de protótipo"). */
  eyebrow: "font-mono text-[12px] tracking-[0.14em] uppercase text-tinta-suave",
  muted: "text-sm text-tinta-suave",
  link: "text-costura underline decoration-costura/40 underline-offset-4 hover:decoration-costura",
  /** Lista em cartão (moldes, coleções, tecidos…) e a linha clicável dela. */
  list: "divide-y divide-tinta/10 overflow-hidden rounded-2xl border border-tinta/10 bg-white",
  row: "flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel",
  /** Etiqueta pequena (status, contagem). */
  tag: "inline-flex items-center rounded-full border border-tinta/20 px-2.5 py-0.5 font-mono text-[11px] text-tinta-suave",
  tagAlert: "inline-flex items-center rounded-full bg-linha/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-linha",
} as const;

export type FormState = { error?: string; ok?: string; link?: string } | undefined;

export const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  admin: "Admin",
  modelista: "Modelista",
  estilista: "Estilista",
  leitura: "Só leitura",
};
