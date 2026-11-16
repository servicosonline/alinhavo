"use client";

import { useState } from "react";
import { ui } from "@/components/ui";
import { AI_MONTHLY_LIMIT, SALES_MAX, TECHNICAL_MAX } from "@/lib/ai/product-text";
import { saveProductTexts, suggestProductTexts } from "../actions";

type Props = {
  orgId: string;
  productId: string;
  sales: string | null;
  technical: string | null;
  canEdit: boolean;
  /** A IA está configurada no servidor (ANTHROPIC_API_KEY). */
  aiReady: boolean;
  /** Limite do mês da organização (o superadmin pode mudar); sem ele, o padrão. */
  monthlyLimit?: number;
  /** Gerações por IA já usadas pela organização neste mês. */
  usedThisMonth: number;
};

type Note = { tone: "ok" | "error"; text: string } | null;

/**
 * Textos do produto: o de venda e o técnico (que entra na próxima ficha). A IA
 * sugere a partir do tecido, aviamentos e molde; a sugestão só preenche os
 * campos, e nada é gravado até a pessoa salvar.
 */
export function ProductTexts({ orgId, productId, sales, technical, canEdit, aiReady, usedThisMonth, monthlyLimit = AI_MONTHLY_LIMIT }: Props) {
  const [draft, setDraft] = useState({ sales: sales ?? "", technical: technical ?? "" });
  const [busy, setBusy] = useState<false | "ia" | "salvar">(false);
  const [note, setNote] = useState<Note>(null);
  const [used, setUsed] = useState(usedThisMonth);
  const dirty = draft.sales !== (sales ?? "") || draft.technical !== (technical ?? "");
  const full = used >= monthlyLimit;

  if (!canEdit) {
    return (
      <div className="space-y-3 text-sm" data-product-texts="leitura">
        {!sales && !technical && <p className={ui.muted}>Sem textos ainda.</p>}
        {sales && <p className="whitespace-pre-line">{sales}</p>}
        {technical && <p className="whitespace-pre-line text-tinta-suave">{technical}</p>}
      </div>
    );
  }

  async function suggest() {
    if (dirty && !window.confirm("A sugestão substitui o que está nos campos. Continuar?")) return;
    setBusy("ia");
    setNote(null);
    const r = await suggestProductTexts(orgId, productId);
    setBusy(false);
    if (!r.ok) return setNote({ tone: "error", text: r.error });
    setUsed((u) => u + 1);
    setDraft({ sales: r.sales, technical: r.technical });
    setNote({ tone: "ok", text: "Sugestão da IA nos campos. Revise (principalmente composição e medidas) e salve." });
  }

  async function save() {
    setBusy("salvar");
    setNote(null);
    const r = await saveProductTexts(orgId, productId, draft.sales, draft.technical);
    setBusy(false);
    setNote(r?.error ? { tone: "error", text: r.error } : { tone: "ok", text: r?.ok ?? "Textos salvos." });
  }

  return (
    <div className="space-y-3" data-product-texts="edicao">
      <label className="block">
        <span className={ui.label}>Texto de venda</span>
        <textarea
          className={`${ui.input} min-h-24 text-sm`}
          value={draft.sales}
          maxLength={SALES_MAX}
          placeholder="Para loja, catálogo e marketplace."
          onChange={(e) => setDraft({ ...draft, sales: e.target.value })}
          data-text="venda"
        />
      </label>
      <label className="block">
        <span className={ui.label}>Texto técnico (entra na ficha)</span>
        <textarea
          className={`${ui.input} min-h-32 font-mono text-xs`}
          value={draft.technical}
          maxLength={TECHNICAL_MAX}
          placeholder="Tecido e composição, construção, aviamentos, acabamentos, grade."
          onChange={(e) => setDraft({ ...draft, technical: e.target.value })}
          data-text="tecnica"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={save} disabled={busy !== false || !dirty} data-texts-save>
          {busy === "salvar" ? "Salvando…" : "Salvar textos"}
        </button>
        <button
          type="button"
          className={ui.buttonGhost}
          onClick={suggest}
          disabled={busy !== false || !aiReady || full}
          title={!aiReady ? "A IA ainda não foi configurada neste ambiente." : undefined}
          data-texts-ai
        >
          {busy === "ia" ? "Escrevendo…" : "Sugerir com IA"}
        </button>
        <span className="text-xs text-tinta-suave" data-ai-usage>
          {aiReady ? `${used} de ${monthlyLimit} sugestões da IA usadas neste mês pela equipe.` : "IA não configurada neste ambiente."}
        </span>
      </div>
      {note && (
        <p className={note.tone === "ok" ? `${ui.success} text-xs` : `${ui.error} text-xs`} role={note.tone === "ok" ? "status" : "alert"}>
          {note.text}
        </p>
      )}
    </div>
  );
}
