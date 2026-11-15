"use client";

import { useState } from "react";
import { CopyLink } from "@/app/painel/[orgId]/copy-link";
import type { ApprovalResult } from "@/app/painel/[orgId]/moldes/[patternId]/prova/actions";
import { APPROVAL_DAYS, formatDate, type ApprovalSettings } from "@/lib/prova/approval";
import { APPROVAL_VIDEO_MAX_BYTES } from "@/lib/prova/approval-video";
import type { Capture } from "@/lib/prova/captures";
import { ui } from "../ui";

/** O que a página do painel oferece à Prova para pedir aprovação. */
export type ApprovalRequester = {
  request: (settings: ApprovalSettings, captures: Capture[], days: number) => Promise<ApprovalResult>;
  /** Envia o vídeo 360° e o liga à aprovação; devolve a mensagem de erro, ou null se deu certo. */
  uploadVideo?: (approvalId: string, video: Blob) => Promise<string | null>;
  /** Motivo para não pedir agora (ex.: alterações não salvas); null = pode pedir. */
  blocked: string | null;
};

type Props = {
  requester: ApprovalRequester;
  settings: ApprovalSettings;
  captures: Capture[];
  /** Vídeo 360° gravado na Prova (vai junto, se a pessoa quiser). */
  video?: Blob | null;
};

/** Gera o link público de aprovação com as capturas e mostra para copiar. */
export function ApprovalRequest({ requester, settings, captures, video }: Props) {
  const [days, setDays] = useState<number>(14);
  const [busy, setBusy] = useState<false | "link" | "video">(false);
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const [withVideo, setWithVideo] = useState(true);
  const [videoNote, setVideoNote] = useState<{ ok: boolean; text: string } | null>(null);
  const canSendVideo = !!video && !!requester.uploadVideo;
  const tooBig = !!video && video.size > APPROVAL_VIDEO_MAX_BYTES;

  const submit = async () => {
    setBusy("link");
    setResult(null);
    setVideoNote(null);
    const r = await requester.request(settings, captures, days);
    setResult(r);
    // O link já vale com as imagens; o vídeo vai depois, direto do navegador para o Storage.
    if (r.ok && video && requester.uploadVideo && withVideo && !tooBig) {
      setBusy("video");
      const err = await requester.uploadVideo(r.approvalId, video);
      setVideoNote(err ? { ok: false, text: "O link vale, mas o vídeo não foi: " + err } : { ok: true, text: "Vídeo 360° incluído no link." });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2 border-t border-tinta/10 pt-3" data-approval-request>
      <h3 className="text-xs font-medium">Pedir aprovação</h3>
      {requester.blocked ? (
        <p className="text-[11px] text-tinta-suave">{requester.blocked}</p>
      ) : (
        <>
          <p className="text-[11px] text-tinta-suave">
            Gera um link para o cliente ver as imagens e responder, sem precisar de conta.
          </p>
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-xs">
              <span>Vale por</span>
              <select className={`${ui.input} text-sm`} value={days} onChange={(e) => setDays(Number(e.target.value))} data-approval-days>
                {APPROVAL_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={ui.buttonPrimary}
              onClick={submit}
              disabled={busy !== false || captures.length === 0}
              data-approval-submit
            >
              {busy === "link" ? "Gerando…" : busy === "video" ? "Enviando o vídeo…" : "Gerar link"}
            </button>
          </div>
          {canSendVideo && (
            <label className="flex items-center gap-2 text-[11px]" data-approval-video>
              <input type="checkbox" checked={withVideo && !tooBig} disabled={tooBig} onChange={(e) => setWithVideo(e.target.checked)} />
              {tooBig ? "O vídeo passa de 10 MB e não vai no link." : "Incluir o vídeo 360°"}
            </label>
          )}
          {captures.length === 0 && <p className="text-[11px] text-tinta-suave">Capture pelo menos uma imagem.</p>}
        </>
      )}
      {result?.ok === false && (
        <p className={`${ui.error} text-xs`} role="alert">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <div className="space-y-1" role="status" data-approval-link>
          <p className="text-[11px]">Link pronto. Vale até {formatDate(result.expiresAt)}; mande para o cliente:</p>
          <CopyLink link={result.link} label="Link de aprovação" />
          {videoNote && <p className={videoNote.ok ? "text-[11px] text-tinta-suave" : "text-[11px] text-linha"}>{videoNote.text}</p>}
        </div>
      )}
    </div>
  );
}
