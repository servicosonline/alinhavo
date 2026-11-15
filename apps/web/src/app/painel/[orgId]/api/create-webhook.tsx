"use client";

import { useState } from "react";
import { ui } from "@/components/ui";
import { WEBHOOK_EVENTS, webhookUrlProblem, type WebhookEvent } from "@/lib/api/webhooks";
import { CopyLink } from "../copy-link";
import { createWebhook } from "./actions";

/** Cadastra um webhook e mostra o segredo de assinatura uma vez só. */
export function CreateWebhook({ orgId, disabled }: { orgId: string; disabled: boolean }) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(WEBHOOK_EVENTS.map((e) => e.id));
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: WebhookEvent, on: boolean) {
    setEvents((cur) => (on ? [...cur, id] : cur.filter((e) => e !== id)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = webhookUrlProblem(url);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    const r = await createWebhook(orgId, url, events);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setSecret(r.secret);
    setUrl("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className={ui.label}>URL que recebe (POST)</span>
          <input
            className={ui.input}
            type="url"
            inputMode="url"
            value={url}
            maxLength={500}
            placeholder="https://erp.suaempresa.com.br/alinhavo"
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            required
          />
        </label>
        <fieldset className="space-y-1">
          <legend className={ui.label}>Eventos</legend>
          {WEBHOOK_EVENTS.map((ev) => (
            <label key={ev.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={events.includes(ev.id)}
                onChange={(e) => toggle(ev.id, e.target.checked)}
                disabled={disabled}
              />
              <span>
                {ev.label} <span className="font-mono text-xs text-tinta-suave">{ev.id}</span>
                <span className="block text-xs text-tinta-suave">Quando {ev.hint}.</span>
              </span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className={ui.buttonPrimary} disabled={disabled || busy || !url.trim() || events.length === 0} data-webhook-create>
          {busy ? "Cadastrando…" : "Cadastrar webhook"}
        </button>
      </form>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}
      {secret && (
        <div className={`${ui.success} space-y-2`} role="status" data-webhook-secret>
          <p className="text-sm font-medium">Copie o segredo de assinatura agora: ele não aparece de novo.</p>
          <CopyLink link={secret} label="Segredo de assinatura" />
          <p className="text-xs text-tinta-suave">Com ele, o seu sistema confere que o aviso veio do Alinhavo (cabeçalho X-Alinhavo-Signature).</p>
        </div>
      )}
    </div>
  );
}
