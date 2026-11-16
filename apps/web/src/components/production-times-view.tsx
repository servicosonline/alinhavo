import { formatDuration, hasProductionData, STAGE_LABEL, type ProductionTimes } from "@/lib/production-times";
import { ui } from "./ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Tempo de produção por estágio: média e mediana das passagens encerradas,
 * quantos estão parados agora e há quanto tempo, e o total da ideia à
 * produção. Usado pelo dono (uma organização) e pelo superadmin.
 */
export function ProductionTimesView({ times }: { times: ProductionTimes }) {
  if (!hasProductionData(times)) {
    return (
      <p className={ui.muted} data-production-empty>
        Ainda não há trocas de estágio medidas. A contagem começa na próxima vez que um produto mudar de estágio (ideia, modelagem, prova,
        aprovado, produção).
      </p>
    );
  }
  const { stages, total, slowest } = times;
  return (
    <div className="space-y-4" data-production-times>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${ui.card} p-5`}>
          <p className={ui.eyebrow}>Da ideia à produção</p>
          <p className="mt-1 font-display text-2xl font-semibold" data-total-avg>
            {formatDuration(total.avg)}
          </p>
          <p className="text-xs text-tinta-suave">
            {total.done > 0 ? `média de ${plural(total.done, "produto", "produtos")}; mediana ${formatDuration(total.median)}` : "nenhum produto chegou à produção ainda"}
          </p>
        </div>
        <div className={`${ui.card} p-5`}>
          <p className={ui.eyebrow}>Gargalo</p>
          <p className="mt-1 font-display text-2xl font-semibold" data-slowest={slowest ?? ""}>
            {slowest ? STAGE_LABEL[slowest] : "—"}
          </p>
          <p className="text-xs text-tinta-suave">o estágio com a maior média de permanência</p>
        </div>
        <div className={`${ui.card} p-5`}>
          <p className={ui.eyebrow}>A caminho</p>
          <p className="mt-1 font-display text-2xl font-semibold">{plural(total.now, "produto", "produtos")}</p>
          <p className="text-xs text-tinta-suave">{total.now > 0 ? `há ${formatDuration(total.nowAvg)} em média, ainda antes da produção` : "nenhum produto em andamento"}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-tinta/10 bg-white">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-tinta/10 text-left">
              <th className="px-4 py-2 font-medium">Estágio</th>
              <th className="px-4 py-2 font-medium">Tempo médio</th>
              <th className="px-4 py-2 font-medium">Mediana</th>
              <th className="px-4 py-2 font-medium">Passagens</th>
              <th className="px-4 py-2 font-medium">Parados agora</th>
              <th className="px-4 py-2 font-medium">Há quanto tempo (média)</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => {
              const end = s.stage === "producao";
              return (
                <tr key={s.stage} className={`border-b border-tinta/5 last:border-0 ${s.stage === slowest ? "bg-linha/5" : ""}`} data-stage={s.stage}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    {STAGE_LABEL[s.stage]}
                    {s.stage === slowest && <span className="ml-2 text-xs font-normal text-linha">gargalo</span>}
                  </th>
                  <td className="px-4 py-2 tabular-nums" data-stage-avg>
                    {end ? "—" : formatDuration(s.avg)}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{end ? "—" : formatDuration(s.median)}</td>
                  <td className="px-4 py-2 tabular-nums">{end ? "—" : s.done}</td>
                  <td className="px-4 py-2 tabular-nums">{s.now}</td>
                  <td className="px-4 py-2 tabular-nums">{end ? "—" : formatDuration(s.nowAvg)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-tinta-suave">
        Média e mediana contam as passagens já encerradas (o produto entrou e saiu do estágio); a mediana não se deixa puxar por um produto
        esquecido. Voltar um estágio conta como nova passagem. Produtos criados antes desta medição entram a partir da próxima troca.
      </p>
    </div>
  );
}
