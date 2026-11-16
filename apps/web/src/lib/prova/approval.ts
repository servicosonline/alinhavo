/**
 * Regras da aprovação por link que o app usa nos dois lados (painel e página
 * pública). Puras, para testar sem banco.
 */

import { FABRIC_PRESETS, FABRICS } from "@alinhavo/cloth";
import { POSE_NAME as POSE_LABELS } from "./poses";

export const APPROVAL_DAYS = [7, 14, 30] as const;
export type ApprovalDays = (typeof APPROVAL_DAYS)[number];

export type ApprovalSettings = { size?: string; fabric?: string; pose?: string };

const FABRIC_NAME: Record<string, string> = Object.fromEntries(FABRIC_PRESETS.map((id) => [id, FABRICS[id].name]));
const POSE_NAME: Record<string, string> = POSE_LABELS;

export const STATUS_LABEL = { pendente: "Aguardando resposta", aprovado: "Aprovado", ajustes: "Pediu ajustes" } as const;

/** Lê as configurações guardadas (jsonb), aceitando só textos curtos conhecidos. */
export function readSettings(raw: unknown): ApprovalSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 40 ? v : undefined);
  return { size: text(r.size), fabric: text(r.fabric), pose: text(r.pose) };
}

/** "Tamanho M · Plano leve · Em pé" (o que faltar fica de fora). */
export function settingsLabel(settings: ApprovalSettings): string {
  return [
    settings.size && `Tamanho ${settings.size}`,
    settings.fabric && (FABRIC_NAME[settings.fabric] ?? settings.fabric),
    settings.pose && (POSE_NAME[settings.pose] ?? settings.pose),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function approvalLink(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/aprovar/${token}`;
}

/** Erro do Supabase (só o que importa aqui). */
export type DbError = { code?: string; message?: string };

/**
 * Mensagem para a tela. Os textos das funções do banco são nossos e em
 * português (códigos 22023, P0002 e 23505), então podem aparecer; o resto
 * vira mensagem genérica, para não vazar detalhe interno.
 */
export function approvalErrorMessage(error: DbError): string {
  switch (error.code) {
    case "42501":
      return "Você não tem permissão para pedir aprovação deste molde.";
    case "P0002":
      return "Este link de aprovação não vale mais (vencido ou inválido).";
    case "23505":
      return "Esta aprovação já foi respondida.";
    case "22023":
      return error.message && error.message.length <= 200 ? error.message : "Dados inválidos.";
    default:
      return "Não foi possível concluir agora. Tente de novo em instantes.";
  }
}

/** Data em português curta: "14/11/2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
