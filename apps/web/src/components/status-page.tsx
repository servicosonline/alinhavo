import { BrandSymbol } from "./brand-mark";
import { Container, PageShell } from "./page-shell";

/** Tela de aviso (404, erro) na moldura do app: o símbolo, o código em mono, o título e as saídas. */
export function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <PageShell>
      <Container size="form" className="flex flex-col justify-center py-16 text-center">
        <BrandSymbol className="mx-auto size-16" />
        <p className="mt-8 font-mono text-[12px] tracking-[0.14em] text-linha uppercase">{code}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold tracking-[-0.025em]">{title}</h1>
        <span className="alinhavo mx-auto mt-5 w-24" aria-hidden="true" />
        <div className="mt-5 text-[15px] leading-relaxed text-tinta-suave">{children}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </Container>
    </PageShell>
  );
}
