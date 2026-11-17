"use client";

import Link from "next/link";
import { KanbanBoard } from "@/components/kanban/board";
import { ViewToggle, useView } from "@/components/kanban/view-toggle";
import { ProductThumb } from "@/components/product-thumb";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, type MilestoneState } from "@/lib/collection";
import { moveProduct } from "../actions";

export interface ProductCard {
  id: string;
  /** Versão da miniatura (foto e data de edição): troca o endereço quando a foto muda. */
  thumbVersion: string;
  column: string;
  name: string;
  reference: string | null;
  href: string;
  patternName: string | null;
  due: { label: string; state: MilestoneState } | null;
}

const DUE_STYLE: Record<MilestoneState, string> = {
  concluida: "bg-papel-escuro text-tinta-suave",
  atrasada: "bg-linha/10 text-linha",
  proxima: "bg-amber-100 text-amber-900",
  futura: "border border-tinta/15 text-tinta-suave",
};

export function DueChip({ due }: { due: ProductCard["due"] }) {
  if (!due) return null;
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[11px] ${DUE_STYLE[due.state]}`} data-due={due.state}>
      {due.state === "atrasada" ? "atrasado · " : "entrega "}
      {due.label}
    </span>
  );
}

/**
 * Produtos da coleção em Lista (a de sempre, com os formulários; vem pronta do servidor em `list`) ou
 * Quadro (uma coluna por status; quem edita arrasta para mudar). A escolha fica guardada no navegador.
 */
export function ProductsView({
  orgId,
  collectionId,
  list,
  cards,
  canEdit,
}: {
  orgId: string;
  collectionId: string;
  list: React.ReactNode;
  cards: ProductCard[];
  canEdit: boolean;
}) {
  const [view, setView] = useView("produtos");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>
      {view === "lista" ? (
        list
      ) : (
        <KanbanBoard
          label="Produtos por status"
          columns={PRODUCT_STATUSES.map((s) => ({ id: s, label: PRODUCT_STATUS_LABEL[s] }))}
          items={cards}
          onMove={canEdit ? (id, status) => moveProduct(orgId, collectionId, id, status) : undefined}
          renderCard={(p) => (
            <div className="flex gap-2.5">
              <ProductThumb orgId={orgId} productId={p.id} version={p.thumbVersion} size={48} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Link href={p.href} className="block font-medium leading-snug hover:underline" onPointerDown={(e) => e.stopPropagation()}>
                  {p.reference && <span className="font-mono text-xs text-tinta-suave">{p.reference} · </span>}
                  {p.name}
                </Link>
                <p className="truncate text-xs text-tinta-suave">{p.patternName ? `Molde: ${p.patternName}` : "Sem molde"}</p>
                <DueChip due={p.due} />
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
