"use client";

import { DRAPE_DEFAULT, FABRIC_PRESETS, FABRIC_TUNING_RANGE, FABRICS } from "@alinhavo/cloth";
import { useActionState, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { prepareFinishImage } from "@/lib/finish-image";
import { formatMoney } from "@/lib/money";
import { formatCm } from "@/lib/units";
import { createFabric, updateFabric } from "./actions";

/** Os presets da biblioteca, para o "Comportamento na Prova". */
function PresetSelect({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <select name="preset" defaultValue={defaultValue} className={ui.input} data-fabric-preset>
      <option value="">Escolher depois</option>
      {FABRIC_PRESETS.map((id) => (
        <option key={id} value={id}>
          {FABRICS[id].name}
        </option>
      ))}
    </select>
  );
}

function Feedback({ state }: { state: { error?: string; ok?: string } | undefined }) {
  return (
    <>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className={ui.success} role="status">
          {state.ok}
        </p>
      )}
    </>
  );
}

export function FabricForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createFabric.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-3" data-form="tecido">
      <label className="block sm:col-span-2">
        <span className={ui.label}>Nome</span>
        <input name="name" required maxLength={120} placeholder="Ex.: Sarja 2/1" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Comportamento na Prova</span>
        <PresetSelect />
      </label>
      <label className="block sm:col-span-3">
        <span className={ui.label}>Composição</span>
        <input name="composition" maxLength={200} placeholder="Ex.: 98% algodão, 2% elastano" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Largura útil (cm)</span>
        <input name="width" inputMode="decimal" placeholder="Ex.: 150" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Gramatura (g/m²)</span>
        <input name="weight" inputMode="decimal" placeholder="Ex.: 280" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Preço por metro (R$)</span>
        <input name="price" inputMode="decimal" placeholder="Ex.: 39,90" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Preço por quilo (R$/kg · malha)</span>
        <input name="pricePerKg" inputMode="decimal" placeholder="Ex.: 54,90 (calcula R$/m)" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Encolhimento urdume (%)</span>
        <input name="shrinkageWarp" inputMode="decimal" placeholder="Ex.: 4" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Encolhimento trama (%)</span>
        <input name="shrinkageWeft" inputMode="decimal" placeholder="Ex.: 3" className={ui.input} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <SubmitButton pendingText="Cadastrando…">Cadastrar tecido</SubmitButton>
        <span className="text-xs text-tinta-suave">Elasticidade, caimento, espessura e foto ficam em Editar, depois de cadastrar.</span>
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}

export type EditableFabric = {
  id: string;
  name: string;
  composition: string | null;
  width_mm: number | null;
  weight_gsm: number | null;
  price_cents: number | null;
  price_per_kg_cents?: number | null;
  shrinkage_warp_pct?: number | null;
  shrinkage_weft_pct?: number | null;
  preset: string | null;
  stretch_pct: number | null;
  drape: number | null;
  thickness_mm: number | null;
  texture: string | null;
  texture_cm: number | null;
};

const numText = (v: number | string | null) => (v === null || v === "" ? "" : String(Number(v)).replace(".", ","));
const DRAPE_LABEL = ["", "Armado", "Firme", "Médio", "Macio", "Fluido"];

/** Edição do tecido: dados técnicos e o comportamento na Prova, com a foto. */
export function FabricEditForm({ orgId, fabric, canEdit }: { orgId: string; fabric: EditableFabric; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateFabric.bind(null, orgId, fabric.id), undefined);
  const [texture, setTexture] = useState(fabric.texture ?? "");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [drape, setDrape] = useState(fabric.drape === null ? "" : String(fabric.drape));
  const preset = fabric.preset && fabric.preset in FABRICS ? FABRICS[fabric.preset as keyof typeof FABRICS] : null;
  const [sLo, sHi] = FABRIC_TUNING_RANGE.stretchPct;
  const [tLo, tHi] = FABRIC_TUNING_RANGE.thicknessMm;

  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="space-y-8" data-form="tecido-editar">
      <fieldset className="grid gap-3 sm:grid-cols-3" disabled={!canEdit}>
        <legend className={`${ui.eyebrow} mb-3`}>Dados técnicos</legend>
        <label className="block sm:col-span-2">
          <span className={ui.label}>Nome</span>
          <input name="name" required maxLength={120} defaultValue={fabric.name} className={ui.input} />
        </label>
        <label className="block">
          <span className={ui.label}>Comportamento na Prova</span>
          <PresetSelect defaultValue={fabric.preset ?? ""} />
        </label>
        <label className="block sm:col-span-3">
          <span className={ui.label}>Composição</span>
          <input name="composition" maxLength={200} defaultValue={fabric.composition ?? ""} className={ui.input} />
        </label>
        <label className="block">
          <span className={ui.label}>Largura útil (cm)</span>
          <input name="width" inputMode="decimal" defaultValue={fabric.width_mm ? formatCm(fabric.width_mm) : ""} className={ui.input} />
        </label>
        <label className="block">
          <span className={ui.label}>Gramatura (g/m²)</span>
          <input name="weight" inputMode="decimal" defaultValue={numText(fabric.weight_gsm)} className={ui.input} />
        </label>
        <label className="block">
          <span className={ui.label}>Preço por metro (R$)</span>
          <input
            name="price"
            inputMode="decimal"
            defaultValue={fabric.price_cents === null ? "" : formatMoney(fabric.price_cents).replace(/^R\$\s*/, "")}
            className={ui.input}
          />
        </label>
        <label className="block">
          <span className={ui.label}>Preço por quilo (R$/kg · malha)</span>
          <input
            name="pricePerKg"
            inputMode="decimal"
            defaultValue={fabric.price_per_kg_cents == null ? "" : formatMoney(fabric.price_per_kg_cents).replace(/^R\$\s*/, "")}
            placeholder="Opcional (converte se R$/m vazio)"
            className={ui.input}
          />
        </label>
        <label className="block">
          <span className={ui.label}>Encolhimento urdume (%)</span>
          <input name="shrinkageWarp" inputMode="decimal" defaultValue={numText(fabric.shrinkage_warp_pct ?? null)} className={ui.input} />
        </label>
        <label className="block">
          <span className={ui.label}>Encolhimento trama (%)</span>
          <input name="shrinkageWeft" inputMode="decimal" defaultValue={numText(fabric.shrinkage_weft_pct ?? null)} className={ui.input} />
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3" disabled={!canEdit} data-fabric-prova>
        <legend className={`${ui.eyebrow} mb-1`}>Na Prova 3D</legend>
        <p className="text-xs text-tinta-suave sm:col-span-3">
          A Prova parte do comportamento escolhido{preset ? ` (${preset.name})` : ""} e ajusta pelo que você souber do tecido. A gramatura de cima
          também entra. Deixe em branco o que não souber.
        </p>
        <label className="block">
          <span className={ui.label}>Elasticidade na trama (%)</span>
          <input
            name="stretch"
            inputMode="decimal"
            defaultValue={numText(fabric.stretch_pct)}
            placeholder={preset ? `Ex.: ${Math.round(preset.maxStretch * 100)}` : "Ex.: 5"}
            className={ui.input}
          />
          <span className="mt-1 block text-[11px] text-tinta-suave">
            Quanto estica até o limite ({sLo} a {sHi}%). É o vermelho do mapa de pressão.
          </span>
        </label>
        <label className="block">
          <span className={ui.label}>Caimento</span>
          <select name="drape" value={drape} onChange={(e) => setDrape(e.target.value)} className={ui.input}>
            <option value="">O do comportamento</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} · {DRAPE_LABEL[d]}
                {d === DRAPE_DEFAULT ? " (como o comportamento)" : ""}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] text-tinta-suave">De 1, armado (fica em pé), a 5, fluido (cai colado).</span>
        </label>
        <label className="block">
          <span className={ui.label}>Espessura (mm)</span>
          <input
            name="thickness"
            inputMode="decimal"
            defaultValue={numText(fabric.thickness_mm)}
            placeholder={preset ? `Ex.: ${String(preset.thickness).replace(".", ",")}` : "Ex.: 0,5"}
            className={ui.input}
          />
          <span className="mt-1 block text-[11px] text-tinta-suave">
            De {String(tLo).replace(".", ",")} a {String(tHi).replace(".", ",")} mm.
          </span>
        </label>

        <div className="space-y-2 sm:col-span-3" data-fabric-photo>
          <span className={ui.label}>Foto do tecido</span>
          <div className="flex flex-wrap items-start gap-4">
            {texture ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL guardada no banco, sem otimização de imagem.
              <img src={texture} alt="Foto do tecido" className="size-28 rounded-lg border border-tinta/15 object-cover" />
            ) : (
              <div className="grid size-28 place-items-center rounded-lg border border-dashed border-tinta/20 text-center text-[11px] text-tinta-suave">
                sem foto
              </div>
            )}
            <div className="space-y-2 text-xs">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="block text-xs"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setPhotoError(null);
                  const r = await prepareFinishImage(file, "da foto do tecido");
                  if ("error" in r) return setPhotoError(r.error);
                  setTexture(r.image);
                }}
              />
              {texture && (
                <button type="button" className="text-linha underline" onClick={() => setTexture("")}>
                  Tirar a foto
                </button>
              )}
              <label className="block">
                <span className="font-medium">A foto mostra quantos cm de largura?</span>
                <input
                  name="textureCm"
                  inputMode="decimal"
                  defaultValue={numText(fabric.texture_cm) || "10"}
                  className={`${ui.input} w-28 text-sm`}
                />
              </label>
              <p className="max-w-sm text-[11px] text-tinta-suave">
                Fotografe o tecido de frente, com boa luz, e meça o pedaço que aparece. A Prova repete a foto nesse tamanho, no sentido do
                fio.
              </p>
              {photoError && (
                <p className="text-linha" role="alert">
                  {photoError}
                </p>
              )}
            </div>
          </div>
          <input type="hidden" name="texture" value={texture} />
        </div>
      </fieldset>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Salvando…">Salvar tecido</SubmitButton>
          <Feedback state={state} />
        </div>
      )}
    </ActionForm>
  );
}
