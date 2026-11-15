"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui, type FormState } from "@/components/ui";
import { AUDIENCE_STATUS, AUDIENCES, type Audience } from "@/lib/notifications";
import { getBrowserClient } from "@/lib/supabase/client";
import { adminSaveAnnouncement, adminSendNotification } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p className={ui.error} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  return null;
}

/** Enviar notificação: título, texto, link opcional e para quem (todos, plano, status, organização ou pessoa). */
export function SendNotificationForm({ orgs }: { orgs: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(adminSendNotification, undefined);
  const [audience, setAudience] = useState<Audience>("todos");
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-4">
      <label className="block">
        <span className={ui.label}>Título</span>
        <input name="title" required maxLength={120} className={ui.input} placeholder="Ex.: Prova ao lado do molde chegou" />
      </label>
      <label className="block">
        <span className={ui.label}>Texto (opcional)</span>
        <textarea name="body" maxLength={1000} rows={3} className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Link (opcional)</span>
        <input name="link" maxLength={300} className={`${ui.input} font-mono text-sm`} placeholder="/painel/novidades ou https://…" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={ui.label}>Para quem</span>
          <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className={ui.input}>
            {AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        {audience === "plano" && (
          <label className="block">
            <span className={ui.label}>Plano</span>
            <select name="valor_plano" className={ui.input}>
              <option value="confeccao">Confecção</option>
              <option value="modelista">Modelista</option>
              <option value="gratis">Grátis</option>
            </select>
          </label>
        )}
        {audience === "status" && (
          <label className="block">
            <span className={ui.label}>Status</span>
            <select name="valor_status" className={ui.input}>
              {AUDIENCE_STATUS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {audience === "org" && (
          <label className="block">
            <span className={ui.label}>Organização</span>
            <select name="valor_org" className={ui.input}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {audience === "pessoa" && (
          <label className="block">
            <span className={ui.label}>E-mail da conta</span>
            <input name="valor_pessoa" type="email" required className={ui.input} />
          </label>
        )}
      </div>
      <div>
        <SubmitButton variant="accent" pendingText="Enviando…">
          Enviar notificação
        </SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}

const MAX_SIDE = 1600;
const MAX_BYTES = 1024 * 1024;

/** Reduz a imagem (lado maior até 1600 px) e grava WebP (ou JPEG) até 1 MB. */
async function shrink(file: File): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  for (const q of [0.86, 0.72, 0.6]) {
    const w = await toBlob("image/webp", q);
    if (w && w.type === "image/webp" && w.size <= MAX_BYTES) return { blob: w, ext: "webp" };
    const j = await toBlob("image/jpeg", q);
    if (j && j.size <= MAX_BYTES) return { blob: j, ext: "jpg" };
  }
  throw new Error("grande demais");
}

/** Nova novidade: título, texto, imagem (enviada direto ao bucket público `novidades`) e vídeo do YouTube ou Vimeo. */
export function AnnouncementForm() {
  const [state, action, pending] = useActionState(adminSaveAnnouncement, undefined);
  const [image, setImage] = useState<{ path: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    setImgError(null);
    if (!file) return;
    const supabase = getBrowserClient();
    if (!supabase) return setImgError("O Supabase ainda não foi configurado neste ambiente.");
    setUploading(true);
    try {
      const { blob, ext } = await shrink(file);
      const path = `${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
      const up = await supabase.storage.from("novidades").upload(path, blob, { contentType: blob.type, upsert: false });
      if (up.error) throw new Error("envio");
      setImage({ path, preview: URL.createObjectURL(blob) });
    } catch {
      setImgError("Não conseguimos enviar a imagem. Use JPG, PNG ou WebP.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-4" onReset={() => setImage(null)}>
      <label className="block">
        <span className={ui.label}>Título</span>
        <input name="title" required maxLength={120} className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Texto</span>
        <textarea name="body" maxLength={4000} rows={6} className={ui.input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={ui.label}>Imagem (opcional)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files?.[0])} className="mt-1 block text-sm" />
          {uploading && <p className="mt-1 text-xs text-tinta-suave">Enviando…</p>}
          {imgError && <p className="mt-1 text-xs text-linha">{imgError}</p>}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local da imagem enviada
            <img src={image.preview} alt="" className="mt-2 max-h-32 rounded-lg border border-tinta/10" />
          )}
          <input type="hidden" name="image_path" value={image?.path ?? ""} />
        </div>
        <label className="block">
          <span className={ui.label}>Vídeo (opcional)</span>
          <input name="video" className={`${ui.input} font-mono text-sm`} placeholder="https://youtube.com/watch?v=… ou vimeo.com/…" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked /> Publicar agora (sem marcar, fica como rascunho)
      </label>
      <div>
        <SubmitButton variant="accent" pendingText="Salvando…">
          Salvar novidade
        </SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}
