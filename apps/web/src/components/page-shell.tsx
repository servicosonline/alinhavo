import Link from "next/link";
import { BrandLogo } from "./brand-mark";
import { ModuleIcon, type ModuleIconName } from "./icons";
import { ui } from "./ui";

/**
 * Moldura das telas do app: barra com o logo, conteúdo sobre o papel milimetrado e rodapé.
 * A largura do conteúdo fica com cada tela (`Container`); a barra ocupa a largura toda.
 */
export function PageShell({
  children,
  aside,
  homeHref = "/",
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  /** Para onde o logo leva (no painel, a lista de organizações). */
  homeHref?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-tinta/10 bg-papel">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center gap-4 px-4 sm:px-6">
          <Link href={homeHref} aria-label="Alinhavo, início" className="rounded-md">
            <BrandLogo size="sm" />
          </Link>
          {aside && <div className="ml-auto flex items-center gap-3">{aside}</div>}
        </div>
      </header>
      <main className="papel-milimetrado flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-tinta/10 bg-papel">
        <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-sm text-tinta-suave sm:px-6">
          <span className="font-display text-base text-tinta">Prove antes de cortar.</span>
          <span className="ml-auto font-mono text-[12px]">alinhavo · molde, prova 3D e encaixe no navegador</span>
        </div>
      </footer>
    </div>
  );
}

const WIDTH = {
  /** Um formulário só (entrar, convite). */
  form: "max-w-md",
  /** Leitura e aprovação. */
  narrow: "max-w-3xl",
  /** Listas e telas do painel. */
  medium: "max-w-5xl",
  /** Estúdios (editor, Prova, encaixe). */
  wide: "max-w-[90rem]",
} as const;

/**
 * Coluna de conteúdo. No painel é `medium`; a tela que marca a raiz com `data-largura="tela"`
 * (editor, Prova, encaixe) ganha a largura toda sem sair da coluna.
 */
export function Container({
  children,
  size = "medium",
  className = "",
}: {
  children: React.ReactNode;
  size?: keyof typeof WIDTH;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 ${WIDTH[size]} has-[[data-largura=tela]]:max-w-[90rem] has-[[data-largura=tela]]:py-5 ${className}`}
    >
      {children}
    </div>
  );
}

export type TrailItem = { label: string; href?: string };

/** Trilha "Coleções › Verão 27 › Vestido Lia" (marca/README.md, seção 9). O último item é a tela atual. */
export function Trail({ items }: { items: TrailItem[] }) {
  return (
    <nav aria-label="Caminho" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-tinta-suave">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex min-w-0 items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="truncate hover:text-tinta hover:underline hover:underline-offset-4">
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${last ? "text-tinta" : ""}`} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-linha/70">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Cabeçalho de tela: trilha, rótulo, título com o alinhavo, descrição e ações à direita. */
export function PageHeader({
  trail,
  eyebrow,
  title,
  description,
  actions,
  stitch = true,
}: {
  trail?: TrailItem[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** O tracejado vermelho sob o título (some nas telas de estúdio, onde o espaço é do trabalho). */
  stitch?: boolean;
}) {
  return (
    <div className="space-y-3">
      {trail && trail.length > 0 && <Trail items={trail} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className={ui.eyebrow}>{eyebrow}</p>}
          <h1 className={`${ui.h1} ${eyebrow ? "mt-2" : ""} break-words`}>{title}</h1>
          {stitch && <span className="alinhavo mt-4 w-24" aria-hidden="true" />}
          {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-tinta-suave">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Lista vazia: moldura tracejada, como o molde ainda por cortar. */
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ModuleIconName;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-tinta/15 bg-papel/60 px-6 py-10 text-center">
      {icon && <ModuleIcon name={icon} className="mx-auto size-8 text-linha" />}
      <p className="mt-3 font-display text-xl font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm text-tinta-suave">{children}</div>}
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="rounded-2xl border border-linha/40 bg-white p-6">
      <h2 className={ui.h2}>Supabase ainda não configurado</h2>
      <p className="mt-2 text-sm text-tinta-suave">
        Copie <code className="font-mono">apps/web/.env.example</code> para{" "}
        <code className="font-mono">apps/web/.env.local</code>, preencha a URL e a chave publicável do
        projeto e reinicie o servidor.
      </p>
    </div>
  );
}

/** Carregamento com o alinhavo andando ("Costurando as partes…" da página inicial). */
export function Loading({ label = "Costurando as partes…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-6" role="status">
      <span className="alinhavo alinhavo-correndo w-28" aria-hidden="true" />
      <span className="text-sm text-tinta-suave">{label}</span>
    </div>
  );
}
