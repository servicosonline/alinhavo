/**
 * Imagem do produto na lista da coleção, no quadro e na página do produto. A ordem das fontes:
 * a foto enviada pela equipe (bucket privado `produtos`), a última foto de catálogo por IA, a captura
 * da última aprovação do molde ligado, o desenho técnico da última ficha e, sem nada disso, as
 * iniciais. A rota `/painel/[org]/produtos/[id]/miniatura` segue esta ordem; aqui ficam as regras puras
 * (sem dependência pesada: a miniatura e a página do produto usam no navegador). O desenho técnico em
 * SVG fica em `product-sketch-thumb.ts`, só no servidor.
 */

/** Lado da foto enviada (px) e o teto do arquivo (o mesmo do bucket `produtos`). */
export const PRODUCT_PHOTO_SIZE = 640;
export const PRODUCT_PHOTO_MAX_BYTES = 300 * 1024;

export type ProductImageSource = "foto" | "catalogo" | "aprovacao" | "desenho" | "iniciais";

/** Endereço da miniatura de um produto (a rota escolhe a fonte). `v` muda quando a foto muda. */
export function productThumbUrl(orgId: string, productId: string, version?: string | null): string {
  const base = `/painel/${orgId}/produtos/${productId}/miniatura`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}

/** Até duas letras: da referência sem número, senão do nome ("Calça pantalona" → "CP"). */
export function productInitials(name: string, reference?: string | null): string {
  const words = (name?.trim() || reference?.trim() || "?").normalize("NFC").split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => [...w][0] ?? "").join("");
  return (letters || "?").toLocaleUpperCase("pt-BR");
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Quadro neutro com as iniciais, nas cores da marca (papel e tinta). */
export function initialsSvg(name: string, reference?: string | null): string {
  const text = escapeXml(productInitials(name, reference));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="320" height="320">` +
    `<rect width="100" height="100" fill="#e8decb"/>` +
    `<text x="50" y="50" dy="0.35em" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" fill="#5c564c">${text}</text>` +
    `</svg>`
  );
}

export type ApprovalImageInfo = { id: string; approval_id: string; angle: string; position: number };

/** Na aprovação mais recente que tem imagem, a de frente (senão a câmera atual, o lado, as costas). */
export function pickApprovalImage(approvalIds: readonly string[], images: readonly ApprovalImageInfo[]): ApprovalImageInfo | null {
  const order = ["frente", "atual", "lado", "costas"];
  const rank = (angle: string) => (order.includes(angle) ? order.indexOf(angle) : order.length);
  for (const id of approvalIds) {
    const mine = images.filter((i) => i.approval_id === id);
    if (mine.length === 0) continue;
    return [...mine].sort((a, b) => rank(a.angle) - rank(b.angle) || a.position - b.position)[0]!;
  }
  return null;
}

/** O `bytea` como o PostgREST devolve ("\x" + hexadecimal) em bytes; null se não for isso. */
export function byteaToBytes(value: unknown): Uint8Array<ArrayBuffer> | null {
  if (typeof value !== "string" || !value.startsWith("\\x") || value.length % 2 !== 0) return null;
  const hex = value.slice(2);
  if (!/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Tipo da imagem pela extensão do caminho no Storage. */
export function imageMime(path: string): string {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

const SEGMENT = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PHOTO_PATH = new RegExp(`^(${SEGMENT})/(${SEGMENT})/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$`);

/** Caminho de foto enviada para este produto (a mesma regra do banco: pasta do produto, nome e extensão). */
export function isProductPhotoPath(path: string, orgId: string, productId: string): boolean {
  const m = PHOTO_PATH.exec(path);
  return !!m && m[1] === orgId && m[2] === productId;
}
