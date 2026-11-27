"use client";

import type { TechPackData } from "@alinhavo/export/tech-pack";
import { useActionState, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { addTrim, generateTechPack, updateProductOperations } from "../actions";
import { formatMoney } from "@/lib/money";

function Feedback({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error)
    return (
      <p className={`${ui.error} text-sm`} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className={`${ui.success} text-sm`} role="status">
        {state.ok}
      </p>
    );
  return null;
}

export function TrimForm({ orgId, productId }: { orgId: string; productId: string }) {
  const [state, action, pending] = useActionState(addTrim.bind(null, orgId, productId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end" data-form="aviamento">
      <label className="block">
        <span className={ui.label}>Aviamento</span>
        <input name="name" required maxLength={120} placeholder="Ex.: Zíper 18 cm" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Quantidade</span>
        <input name="quantity" required inputMode="decimal" defaultValue="1" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Unidade</span>
        <select name="unit" defaultValue="un" className={ui.input}>
          <option value="un">un</option>
          <option value="par">par</option>
          <option value="m">m</option>
          <option value="cm">cm</option>
        </select>
      </label>
      <label className="block">
        <span className={ui.label}>Preço unit. (R$)</span>
        <input name="price" inputMode="decimal" placeholder="Ex.: 2,50" className={ui.input} />
      </label>
      <SubmitButton pendingText="…">Adicionar</SubmitButton>
      <div className="sm:col-span-5">
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}

export function OperationsForm({
  orgId,
  productId,
  sewingCents,
  laundryCents,
  wastePct,
}: {
  orgId: string;
  productId: string;
  sewingCents: number | null;
  laundryCents: number | null;
  wastePct: number | null;
}) {
  const [state, action, pending] = useActionState(updateProductOperations.bind(null, orgId, productId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" data-form="operacoes">
      <label className="block">
        <span className={ui.label}>Costura / facção (R$/peça)</span>
        <input
          name="sewing"
          inputMode="decimal"
          defaultValue={sewingCents == null ? "" : formatMoney(sewingCents).replace(/^R\$\s*/, "")}
          placeholder="Ex.: 14,50"
          className={ui.input}
        />
      </label>
      <label className="block">
        <span className={ui.label}>Lavanderia / benef. (R$/peça)</span>
        <input
          name="laundry"
          inputMode="decimal"
          defaultValue={laundryCents == null ? "" : formatMoney(laundryCents).replace(/^R\$\s*/, "")}
          placeholder="Ex.: 4,00"
          className={ui.input}
        />
      </label>
      <label className="block">
        <span className={ui.label}>Perda de corte (%)</span>
        <input
          name="waste"
          inputMode="decimal"
          defaultValue={wastePct == null ? "" : String(Number(wastePct)).replace(".", ",")}
          placeholder="Ex.: 3"
          className={ui.input}
        />
      </label>
      <SubmitButton variant="ghost" pendingText="Salvando…">
        Salvar custos
      </SubmitButton>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}

export function GenerateTechPack({ orgId, productId, disabledReason }: { orgId: string; productId: string; disabledReason: string | null }) {
  const [state, action, pending] = useActionState(generateTechPack.bind(null, orgId, productId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="space-y-2" data-form="ficha">
      {disabledReason ? (
        <p className="text-sm text-tinta-suave">{disabledReason}</p>
      ) : (
        <SubmitButton pendingText="Gerando…">Gerar ficha técnica</SubmitButton>
      )}
      <Feedback state={state} />
    </ActionForm>
  );
}

/** Baixa o PDF da ficha (gerado no navegador, sem passar pelo servidor). */
export function DownloadTechPack({ data, number, fileName }: { data: TechPackData; number: number; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={ui.buttonGhost}
        disabled={busy}
        data-download-ficha={number}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const { exportTechPackPdf } = await import("@alinhavo/export/tech-pack-pdf");
            const bytes = await exportTechPackPdf(data, { number });
            const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
          } catch {
            setError("Não foi possível gerar o PDF.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Gerando PDF…" : "Baixar PDF"}
      </button>
      {error && <span className="text-xs text-linha">{error}</span>}
    </span>
  );
}
