import { PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, type ProductStatus } from "@/lib/collection";

/** Cores do andamento por estágio, da ideia (clara) à produção (tinta). */
export const STATUS_BAR: Record<ProductStatus, string> = {
  ideia: "bg-tinta/15",
  modelagem: "bg-costura/60",
  prova: "bg-fita",
  aprovado: "bg-linha",
  producao: "bg-tinta",
};

/** Andamento da coleção: uma faixa por estágio, do tamanho da quantidade de produtos, e o texto. */
export function CollectionProgress({ statuses, className = "" }: { statuses: readonly ProductStatus[]; className?: string }) {
  const counts = PRODUCT_STATUSES.map((s) => [s, statuses.filter((x) => x === s).length] as const).filter(([, n]) => n > 0);
  return (
    <div className={className} data-progress>
      <div className="flex h-2 overflow-hidden rounded-full bg-papel-escuro" aria-hidden="true">
        {counts.map(([s, n]) => (
          <span key={s} className={STATUS_BAR[s]} style={{ width: `${(n / statuses.length) * 100}%` }} />
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinta-suave">
        {statuses.length === 0
          ? "Nenhum produto ainda"
          : counts.map(([s, n]) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${STATUS_BAR[s]}`} aria-hidden="true" />
                {n} {PRODUCT_STATUS_LABEL[s].toLowerCase()}
              </span>
            ))}
      </p>
    </div>
  );
}
