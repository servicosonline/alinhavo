"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogPhotoResult } from "@/app/painel/[orgId]/produtos/catalog-actions";
import {
  AI_PHOTO_MONTHLY_LIMIT,
  BODY_TYPES,
  DEFAULT_PHOTO_OPTIONS,
  NOTE_MAX,
  PHOTO_QUALITIES,
  SCENES,
  SKIN_TONES,
  type CatalogPhotoOptions,
} from "@/lib/ai/catalog-photo";
import { ANGLE_LABEL, type Capture } from "@/lib/prova/captures";
import { PhotoDialog } from "../photo-dialog";
import { ui } from "../ui";

/** O que a página do painel oferece à Prova para gerar fotos de catálogo. */
export type CatalogPhotoRequester = {
  /** Produto ligado ao molde (as fotos ficam nele). */
  productName: string;
  productHref: string;
  /** Motivo para não gerar (sem permissão, IA não configurada…); null = pode. */
  blocked: string | null;
  usedThisMonth: number;
  /** Limite do mês da organização; sem ele, o padrão. */
  monthlyLimit?: number;
  generate: (capture: Capture, options: CatalogPhotoOptions) => Promise<CatalogPhotoResult>;
};

type Props = { requester: CatalogPhotoRequester; captures: Capture[] };

/** Escolhe uma captura e as opções, e pede a foto com modelo à IA. */
export function CatalogPhotoRequest({ requester, captures }: Props) {
  const [chosen, setChosen] = useState(0);
  const [options, setOptions] = useState<Omit<CatalogPhotoOptions, "angle">>(DEFAULT_PHOTO_OPTIONS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CatalogPhotoResult | null>(null);
  const [used, setUsed] = useState(requester.usedThisMonth);
  const [viewing, setViewing] = useState<number | null>(null);
  const capture = captures[Math.min(chosen, captures.length - 1)];
  const limit = requester.monthlyLimit ?? AI_PHOTO_MONTHLY_LIMIT;
  const full = used >= limit;

  const set = <K extends keyof typeof options>(key: K, value: (typeof options)[K]) => setOptions((o) => ({ ...o, [key]: value }));

  const submit = async () => {
    if (!capture) return;
    setBusy(true);
    setResult(null);
    const r = await requester.generate(capture, { ...options, angle: capture.angle });
    setResult(r);
    if (r.ok) setUsed((n) => n + 1);
    setBusy(false);
  };

  const select = (label: string, key: "skin" | "body" | "scene" | "quality", list: readonly { id: string; label: string }[]) => (
    <label className="block text-xs">
      <span>{label}</span>
      <select
        className={`${ui.input} text-sm`}
        value={options[key]}
        onChange={(e) => set(key, e.target.value as never)}
        disabled={busy}
        data-photo-option={key}
      >
        {list.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-2 border-t border-tinta/10 pt-3" data-catalog-photo>
      <h3 className="text-xs font-medium">Foto de catálogo (IA)</h3>
      {requester.blocked ? (
        <p className="text-[11px] text-tinta-suave">{requester.blocked}</p>
      ) : (
        <>
          <p className="text-[11px] text-tinta-suave">
            A IA troca o manequim por um modelo e monta o cenário, tentando manter a roupa igual. A captura vai para a OpenAI. A foto fica em{" "}
            <Link href={requester.productHref} className="underline">
              {requester.productName}
            </Link>
            ; confira antes de publicar.
          </p>
          {captures.length === 0 ? (
            <p className="text-[11px] text-tinta-suave">Capture pelo menos uma imagem (de frente funciona melhor).</p>
          ) : (
            <>
              {captures.length > 1 && (
                <fieldset className="text-xs">
                  <legend>Captura</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {captures.map((c, i) => (
                      <label key={i} className="flex items-center gap-1">
                        <input type="radio" name="catalog-capture" checked={i === chosen} onChange={() => setChosen(i)} disabled={busy} />
                        {ANGLE_LABEL[c.angle]} {captures.filter((x) => x.angle === c.angle).length > 1 ? i + 1 : ""}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="grid grid-cols-2 gap-2">
                {select("Pele", "skin", SKIN_TONES)}
                {select("Corpo", "body", BODY_TYPES)}
                {select("Cenário", "scene", SCENES)}
                {select("Qualidade", "quality", PHOTO_QUALITIES)}
              </div>
              <label className="block text-xs">
                <span>Observação (opcional)</span>
                <input
                  className={`${ui.input} text-sm`}
                  value={options.note}
                  maxLength={NOTE_MAX}
                  placeholder="Ex.: com tênis branco, mão no bolso"
                  onChange={(e) => set("note", e.target.value)}
                  disabled={busy}
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-tinta-suave">
                  {used} de {limit} fotos usadas neste mês
                </span>
                <button type="button" className={ui.buttonPrimary} onClick={submit} disabled={busy || full || !capture} data-photo-submit>
                  {busy ? "Gerando (até 2 min)…" : "Gerar foto"}
                </button>
              </div>
              {full && <p className="text-[11px] text-linha">A equipe usou as fotos deste mês. O limite volta no dia 1.</p>}
            </>
          )}
        </>
      )}
      {result?.ok === false && (
        <p className={`${ui.error} text-xs`} role="alert">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <div className="space-y-1" role="status" data-photo-result>
          {result.url && (
            <>
              {/* Abre a foto grande no modal, dentro do app (não outra aba). */}
              <button type="button" onClick={() => setViewing(0)} className="block w-full" aria-label="Ver a foto em tamanho grande">
                {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado do Storage, que vence */}
                <img src={result.url} alt="Foto de catálogo gerada por IA" className="aspect-[2/3] w-full rounded border border-tinta/15 object-cover" />
              </button>
              <PhotoDialog
                photos={[{ src: result.url, alt: "Foto de catálogo gerada por IA", caption: "Foto de catálogo gerada por IA" }]}
                index={viewing}
                onIndex={setViewing}
                onClose={() => setViewing(null)}
              />
            </>
          )}
          <p className="text-[11px] text-tinta-suave">
            Pronta e guardada no produto.{" "}
            <Link href={requester.productHref} className="underline">
              Ver as fotos
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
