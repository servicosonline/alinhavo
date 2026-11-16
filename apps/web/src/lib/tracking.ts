/**
 * Link de acompanhamento da cliente: opções, validade, leitura do que a página pública recebe e o texto
 * para mandar. Puro. O banco é quem decide o que sai (public_tracking, migração acompanhamento).
 */
import type { ProductStatus } from "./supabase/database.types";

export type TrackingOption = "status" | "prazos" | "cronograma" | "imagens" | "molde";
export type TrackingShow = Partial<Record<TrackingOption, boolean>>;

export const TRACKING_OPTIONS: { id: TrackingOption; label: string; hint: string }[] = [
  { id: "status", label: "Status", hint: "Ideia, modelagem, prova, aprovado ou produção" },
  { id: "prazos", label: "Prazos", hint: "Data de entrega e de lançamento" },
  { id: "cronograma", label: "Cronograma", hint: "As etapas da coleção, feitas ou não" },
  { id: "imagens", label: "Imagens", hint: "As fotos da última aprovação (frente, costas, lado)" },
  { id: "molde", label: "Molde", hint: "Nome do molde e a versão atual" },
];

export const TRACKING_DEFAULT: TrackingShow = { status: true, prazos: true, cronograma: true, imagens: true, molde: false };

export const TRACKING_VALIDITY: { days: number | null; label: string }[] = [
  { days: 7, label: "7 dias" },
  { days: 14, label: "14 dias" },
  { days: 30, label: "30 dias" },
  { days: null, label: "Até eu cancelar" },
];

/** O que veio do formulário: só as opções conhecidas, e pelo menos uma marcada. */
export function readShow(form: FormData): TrackingShow | null {
  const show: TrackingShow = {};
  for (const o of TRACKING_OPTIONS) show[o.id] = form.get(o.id) === "on";
  return Object.values(show).some(Boolean) ? show : null;
}

/** Validade do formulário: 7, 14, 30 ou "sem" (null). Outra coisa: undefined. */
export function readValidity(raw: unknown): number | null | undefined {
  if (raw === "sem") return null;
  const n = Number(raw);
  return TRACKING_VALIDITY.some((v) => v.days === n) ? n : undefined;
}

export interface TrackingImage {
  angle: string;
  mime: string;
  data: string;
}

export interface TrackingProduct {
  name: string;
  reference: string | null;
  status: ProductStatus | null;
  dueOn: string | null;
  pattern: { name: string; version: number } | null;
  images: TrackingImage[];
}

export interface TrackingView {
  kind: "produto" | "colecao";
  orgName: string;
  title: string;
  collectionName: string | null;
  launchOn: string | null;
  show: TrackingShow;
  expiresAt: string | null;
  products: TrackingProduct[];
  milestones: { title: string; dueOn: string; done: boolean }[] | null;
}

const str = (v: unknown) => (typeof v === "string" ? v : null);
const STATUSES = ["ideia", "modelagem", "prova", "aprovado", "producao"];

/** Lê o JSON de public_tracking sem confiar no formato (página pública: nada de quebrar). */
export function readTrackingView(raw: unknown): TrackingView | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.kind !== "produto" && r.kind !== "colecao") return null;
  const products = Array.isArray(r.products) ? r.products : [];
  return {
    kind: r.kind,
    orgName: str(r.org_name) ?? "",
    title: str(r.title) ?? "",
    collectionName: str(r.collection_name),
    launchOn: str(r.launch_on),
    show: (r.show && typeof r.show === "object" ? r.show : {}) as TrackingShow,
    expiresAt: str(r.expires_at),
    products: products
      .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
      .map((p) => {
        const pattern = p.pattern as Record<string, unknown> | undefined;
        return {
          name: str(p.name) ?? "",
          reference: str(p.reference),
          status: STATUSES.includes(String(p.status)) ? (p.status as ProductStatus) : null,
          dueOn: str(p.due_on),
          pattern: pattern && typeof pattern.name === "string" ? { name: pattern.name, version: Number(pattern.version) || 0 } : null,
          images: (Array.isArray(p.images) ? p.images : [])
            .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
            .filter((i) => (i.mime === "image/jpeg" || i.mime === "image/png") && typeof i.data === "string")
            .map((i) => ({ angle: String(i.angle), mime: String(i.mime), data: String(i.data) })),
        };
      }),
    milestones: Array.isArray(r.milestones)
      ? r.milestones
          .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
          .map((m) => ({ title: str(m.title) ?? "", dueOn: str(m.due_on) ?? "", done: m.done === true }))
      : null,
  };
}

/** Texto pronto para o WhatsApp (a cliente recebe o link com uma frase). */
export function whatsappUrl(link: string, title: string, orgName: string): string {
  const text = `Oi! Acompanhe aqui o andamento de "${title}"${orgName ? ` com ${orgName}` : ""}: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** "agora há pouco", "há 3 h", "há 2 dias" (quando a cliente abriu o link). */
export function openedAgo(iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const min = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (min < 5) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}
