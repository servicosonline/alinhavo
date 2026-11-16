"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useId, useState } from "react";

export interface BoardColumn {
  id: string;
  label: string;
}

export interface BoardItem {
  id: string;
  column: string;
}

/**
 * Quadro kanban: colunas e cartões. Com `onMove`, os cartões são arrastados (mouse, toque ou teclado:
 * espaço pega, setas levam, espaço solta) e cada um tem também o "Mover para…", que funciona sem arrastar.
 * Sem `onMove`, só mostra. A mudança aparece na hora e volta se o servidor recusar.
 */
export function KanbanBoard<T extends BoardItem>({
  columns,
  items,
  renderCard,
  onMove,
  label,
}: {
  columns: BoardColumn[];
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onMove?: (id: string, column: string) => Promise<{ error?: string }>;
  label: string;
}) {
  const dndId = useId(); // id estável: sem ele o dnd-kit gera ids diferentes no servidor e no navegador
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const columnOf = (item: T) => moved[item.id] ?? item.column;

  async function move(id: string, column: string) {
    if (!onMove) return;
    const item = items.find((i) => i.id === id);
    if (!item || columnOf(item) === column) return;
    setError(null);
    setMoved((m) => ({ ...m, [id]: column }));
    const r = await onMove(id, column);
    if (r.error) {
      setError(r.error);
      setMoved((m) => {
        const rest = { ...m };
        delete rest[id];
        return rest;
      });
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (e.over) void move(String(e.active.id), String(e.over.id));
  }

  const board = (
    <div className="-mx-1 overflow-x-auto pb-2" role="region" aria-label={label}>
      <div className="grid min-w-max auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 px-1">
        {columns.map((c) => (
          <Column key={c.id} column={c} count={items.filter((i) => columnOf(i) === c.id).length} droppable={Boolean(onMove)}>
            {items
              .filter((i) => columnOf(i) === c.id)
              .map((i) => (
                <Card key={i.id} id={i.id} draggable={Boolean(onMove)}>
                  {renderCard(i)}
                  {onMove && <MoveTo columns={columns} current={columnOf(i)} onChange={(col) => void move(i.id, col)} />}
                </Card>
              ))}
          </Column>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg border border-linha/40 bg-linha/5 px-3 py-2 text-sm text-linha" role="alert">
          {error}
        </p>
      )}
      {onMove ? (
        <DndContext id={dndId} sensors={sensors} onDragEnd={onDragEnd} accessibility={{ screenReaderInstructions: { draggable: "Espaço pega o cartão; as setas levam para outra coluna; espaço solta; Esc cancela." } }}>
          {board}
        </DndContext>
      ) : (
        board
      )}
    </div>
  );
}

function Column({ column, count, droppable, children }: { column: BoardColumn; count: number; droppable: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: !droppable });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.label}, ${count}`}
      data-coluna={column.id}
      className={`flex min-h-48 flex-col gap-2 rounded-2xl border p-2.5 transition ${isOver ? "border-linha/60 bg-linha/5" : "border-tinta/10 bg-papel-escuro/50"}`}
    >
      <h3 className="flex items-center justify-between px-1.5 pt-0.5 font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
        {column.label}
        <span className="rounded-full bg-white px-2 py-0.5 text-tinta">{count}</span>
      </h3>
      {children}
    </section>
  );
}

function Card({ id, draggable, children }: { id: string; draggable: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: !draggable });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      data-cartao={id}
      className={`rounded-xl border border-tinta/10 bg-white p-3 text-sm shadow-[0_1px_0_rgb(29_27_24/0.04)] ${draggable ? "cursor-grab touch-manipulation active:cursor-grabbing" : ""} ${isDragging ? "relative z-20 rotate-1 shadow-[0_18px_30px_-16px_rgb(29_27_24/0.5)]" : ""}`}
    >
      {children}
    </article>
  );
}

function MoveTo({ columns, current, onChange }: { columns: BoardColumn[]; current: string; onChange: (column: string) => void }) {
  const id = useId();
  return (
    <div className="mt-2.5 flex items-center gap-1.5 border-t border-tinta/10 pt-2" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <label htmlFor={id} className="text-xs text-tinta-suave">
        Mover para
      </label>
      <select id={id} value={current} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded-md border border-tinta/15 bg-white px-1.5 py-1 text-xs">
        {columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
