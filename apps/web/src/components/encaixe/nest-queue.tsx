"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import {
  claimNextNestJob,
  deleteNestJob,
  failNestJob,
  finishNestJob,
  releaseNestJob,
  reportNestProgress,
  retryNestJob,
} from "@/app/painel/[orgId]/encaixes/actions";
import { formatDemand, layoutFromRun } from "@/lib/encaixe/marker";
import { createNestRunner, NestCancelled } from "@/lib/encaixe/nest-runner";
import { IDLE_WAIT_MS, jobStatusText, PROGRESS_EVERY_MS, REFRESH_EVERY_MS } from "@/lib/encaixe/queue";
import { formatDate } from "@/lib/prova/approval";
import type { NestJobStatus } from "@/lib/supabase/database.types";
import { formatCm } from "@/lib/units";

export type QueueJob = {
  id: string;
  productId: string;
  productName: string;
  status: NestJobStatus;
  progress: number;
  attempts: number;
  error: string | null;
  widthMm: number;
  demand: Record<string, number>;
  version: number;
  createdAt: string;
  /** Está sendo processado por este usuário. */
  mine: boolean;
  markerNumber: number | null;
};

type Current = { jobId: string; productName: string; done: number; total: number };

const sleep = (ms: number, signal: { stop: boolean }) =>
  new Promise<void>((resolve) => {
    const t = setInterval(() => {
      if (signal.stop) {
        clearInterval(t);
        resolve();
      }
    }, 250);
    setTimeout(() => {
      clearInterval(t);
      resolve();
    }, ms);
  });

/**
 * Lista da fila e o processador deste navegador: ligado, pega um pedido por
 * vez, encaixa no Worker, avisa o progresso (renova o prazo) e salva o
 * risco. Desligar no meio devolve o pedido à fila.
 */
export function NestQueue({ orgId, jobs, canProcess }: { orgId: string; jobs: QueueJob[]; canProcess: boolean }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState<Current | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // A lista se atualiza sozinha (progresso de quem estiver processando).
  useEffect(() => {
    const t = setInterval(() => router.refresh(), REFRESH_EVERY_MS);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    if (!processing) return;
    const signal = { stop: false };
    const runner = createNestRunner();
    let holding: string | null = null;

    (async () => {
      while (!signal.stop) {
        const claim = await claimNextNestJob(orgId);
        if (signal.stop) {
          if ("job" in claim && claim.job) await releaseNestJob(orgId, claim.job.id);
          break;
        }
        if ("error" in claim) {
          setNote(claim.error);
          setProcessing(false);
          break;
        }
        if (!claim.job) {
          setCurrent(null);
          await sleep(IDLE_WAIT_MS, signal);
          continue;
        }
        const job = claim.job;
        holding = job.id;
        router.refresh();
        setCurrent({ jobId: job.id, productName: job.productName, done: 0, total: 0 });
        let last = Date.now();
        try {
          const { pieces, result } = await runner.run({ doc: job.doc, ...job.input }, (done, total) => {
            setCurrent({ jobId: job.id, productName: job.productName, done, total });
            if (Date.now() - last >= PROGRESS_EVERY_MS) {
              last = Date.now();
              void reportNestProgress(orgId, job.id, total ? done / total : 0).then((ok) => {
                if (!ok) runner.cancel(); // o prazo venceu: outra pessoa pode ter pegado
              });
            }
          });
          const out = layoutFromRun(pieces, result, job.input);
          const saved = "error" in out ? await failNestJob(orgId, job.id, out.error) : await finishNestJob(orgId, job.id, result.placements);
          if (saved.error) setNote(`${job.productName}: ${saved.error}`);
          holding = null;
        } catch (err) {
          if (err instanceof NestCancelled) {
            if (signal.stop && holding) await releaseNestJob(orgId, holding);
            holding = null;
            continue;
          }
          await failNestJob(orgId, job.id, err instanceof Error ? err.message : "Erro no encaixe.");
          holding = null;
        }
        setCurrent(null);
        router.refresh();
      }
    })();

    return () => {
      signal.stop = true;
      runner.cancel();
      setCurrent(null);
    };
  }, [processing, orgId, router]);

  const waiting = jobs.filter((j) => j.status === "fila").length;

  return (
    <div className="space-y-6">
      {canProcess && (
        <section className={`${ui.card} space-y-3`} aria-labelledby="processador" data-section="processador">
          <h2 id="processador" className={ui.h2}>
            Processar neste computador
          </h2>
          <p className={ui.muted}>
            {waiting === 0 ? "Nenhum pedido esperando." : `${waiting} ${waiting === 1 ? "pedido esperando" : "pedidos esperando"}.`} Deixe esta página aberta enquanto
            processa; fechar no meio devolve o pedido à fila depois de 2 minutos.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={processing ? ui.buttonGhost : ui.buttonPrimary} onClick={() => setProcessing((p) => !p)} data-processing={processing}>
              {processing ? "Parar" : "Processar a fila"}
            </button>
            {processing && (
              <span className="text-sm text-tinta-suave" role="status">
                {current
                  ? `Encaixando ${current.productName}${current.total ? ` · ${current.done} de ${current.total} peças` : "…"}`
                  : "Esperando pedidos…"}
              </span>
            )}
          </div>
          {note && (
            <p className={ui.error} role="alert">
              {note}
            </p>
          )}
        </section>
      )}

      <section className={`${ui.card} space-y-3`} aria-labelledby="pedidos" data-section="pedidos">
        <h2 id="pedidos" className={ui.h2}>
          Pedidos
        </h2>
        {jobs.length === 0 ? (
          <p className={ui.muted}>Nenhum pedido ainda.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 text-sm" data-jobs>
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-job-status={j.status}>
                <span>
                  <Link href={`/painel/${orgId}/produtos/${j.productId}/encaixe${j.markerNumber ? `?risco=${j.markerNumber}` : ""}`} className="font-semibold underline">
                    {j.productName}
                  </Link>{" "}
                  · {jobStatusText(j)}
                  {j.mine && j.status === "rodando" && " (neste usuário)"}
                  <span className="block text-xs text-tinta-suave">
                    {formatDemand(Object.keys(j.demand), j.demand)} · {formatCm(j.widthMm)} cm · molde versão {j.version} · {formatDate(j.createdAt)}
                  </span>
                  {j.error && <span className="block text-xs text-linha">{j.error}</span>}
                </span>
                {canProcess && (
                  <span className="flex gap-2">
                    {j.status === "erro" && (
                      <form action={retryNestJob}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="jobId" value={j.id} />
                        <SubmitButton variant="ghost" pendingText="…">
                          Refazer
                        </SubmitButton>
                      </form>
                    )}
                    {j.status !== "rodando" && (
                      <form action={deleteNestJob}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="jobId" value={j.id} />
                        <SubmitButton variant="ghost" pendingText="…">
                          {j.status === "fila" ? "Tirar da fila" : "Apagar"}
                        </SubmitButton>
                      </form>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
