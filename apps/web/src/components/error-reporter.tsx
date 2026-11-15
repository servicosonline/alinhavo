"use client";

import { useEffect } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const sent = new Set<string>();
const MAX_PER_PAGE = 5;

/** A organização da rota (/painel/<org>/…), se houver. */
function orgFromPath(path: string): string | null {
  const id = path.split("/")[2] ?? "";
  return UUID.test(id) ? id : null;
}

/** Manda um erro da tela para o superadmin (log_client_error). Mensagem curta, sem dado pessoal; repetido e excesso ficam de fora. */
export function reportClientError(message: string, digest?: string) {
  const text = message.slice(0, 500);
  if (!text || sent.has(text) || sent.size >= MAX_PER_PAGE) return;
  sent.add(text);
  const supabase = getBrowserClient();
  if (!supabase) return;
  const path = window.location.pathname;
  void supabase
    .rpc("log_client_error", { p_path: path.slice(0, 300), p_message: text, p_digest: digest ?? null, p_org_id: orgFromPath(path) })
    .then(
      () => null,
      () => null,
    );
}

/** No painel: escuta os erros que escapam (window.onerror e promessas recusadas) e registra. */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportClientError(e.message || "Erro na tela");
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: unknown } | undefined;
      reportClientError(typeof r?.message === "string" ? r.message : "Promessa recusada sem mensagem");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
