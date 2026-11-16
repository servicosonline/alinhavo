"use client";

import { useEffect } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export type ScreenEvent = "prova_aberta" | "molde_exportado" | "risco_exportado" | "ficha_baixada" | "grade_aberta";

/** Registra um evento de tela no registro de atividade (log_event), uma vez ao abrir. Falha calada: não atrapalha a tela. */
export function logEvent(orgId: string, action: ScreenEvent, entityId?: string) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  void supabase.rpc("log_event", { p_org_id: orgId, p_action: action, p_entity_id: entityId ?? null }).then(({ error }) => {
    if (error) console.warn("[atividade] evento não registrado:", action);
  });
}

/** Versão em componente: põe na página e o evento é registrado quando ela abre. */
export function LogEvent({ orgId, action, entityId }: { orgId: string; action: ScreenEvent; entityId?: string }) {
  useEffect(() => logEvent(orgId, action, entityId), [orgId, action, entityId]);
  return null;
}
