import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { sizeAction } from "../actions";
import { AddSizeForm } from "../forms";
import { MeasurementGrid } from "./measurement-grid";

type Params = PageProps<"/painel/[orgId]/medidas/[chartId]">["params"];

export default function TabelaPage({ params }: PageProps<"/painel/[orgId]/medidas/[chartId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando tabela…" />}>
      <Tabela params={params} />
    </Suspense>
  );
}

async function Tabela({ params }: { params: Params }) {
  const { orgId, chartId } = await params;
  if (!isUuid(orgId) || !isUuid(chartId)) notFound();
  const user = await requireUser(`/painel/${orgId}/medidas/${chartId}`);
  const supabase = await createClient();

  const [chartRes, role, sizesRes] = await Promise.all([
    supabase.from("size_charts").select("id, name").eq("id", chartId).eq("org_id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("sizes").select("id, label, position, is_base").eq("size_chart_id", chartId).order("position"),
  ]);
  const chart = chartRes.data;
  if (!chart) notFound();
  const sizes = sizesRes.data ?? [];
  const canEdit = canEditPatterns(role);

  const { data: measurements } = sizes.length
    ? await supabase.from("measurements").select("size_id, name, value_mm").in(
        "size_id",
        sizes.map((s) => s.id),
      )
    : { data: [] };

  const values: Record<string, Record<string, number>> = {};
  for (const m of measurements ?? []) {
    (values[m.name] ??= {})[m.size_id] = Number(m.value_mm);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}/medidas`} className="text-sm text-tinta-suave hover:text-tinta">
          ← Tabelas de medidas
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>{chart.name}</h1>
      </div>

      <section aria-labelledby="tamanhos" className="space-y-3">
        <h2 id="tamanhos" className={ui.h2}>
          Tamanhos
        </h2>
        <ul className="flex flex-wrap gap-2">
          {sizes.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${s.is_base ? "border-linha bg-linha/5" : "border-tinta/15 bg-white/70"}`}
            >
              <span className="font-mono font-medium">{s.label}</span>
              {s.is_base && <span className="text-xs text-linha">base</span>}
              {canEdit && (
                <form action={sizeAction} className="flex items-center">
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="chartId" value={chartId} />
                  <input type="hidden" name="sizeId" value={s.id} />
                  {i > 0 && (
                    <button name="op" value="up" className="px-1 text-tinta-suave hover:text-tinta" aria-label={`Mover ${s.label} para a esquerda`}>
                      ‹
                    </button>
                  )}
                  {i < sizes.length - 1 && (
                    <button name="op" value="down" className="px-1 text-tinta-suave hover:text-tinta" aria-label={`Mover ${s.label} para a direita`}>
                      ›
                    </button>
                  )}
                  {!s.is_base && (
                    <button name="op" value="base" className="px-1 text-xs text-tinta-suave hover:text-tinta">
                      tornar base
                    </button>
                  )}
                  {!s.is_base && (
                    <button name="op" value="remove" className="px-1 text-tinta-suave hover:text-linha" aria-label={`Remover ${s.label}`}>
                      ×
                    </button>
                  )}
                </form>
              )}
            </li>
          ))}
        </ul>
        {canEdit && <AddSizeForm orgId={orgId} chartId={chartId} />}
        {sizes.length > 0 && !sizes.some((s) => s.is_base) && (
          <p className="text-xs text-linha">Escolha um tamanho base: é nele que os moldes são desenhados.</p>
        )}
      </section>

      <section aria-labelledby="medidas" className="space-y-3">
        <h2 id="medidas" className={ui.h2}>
          Medidas
        </h2>
        <MeasurementGrid orgId={orgId} chartId={chartId} sizes={sizes} values={values} canEdit={canEdit} />
      </section>
    </div>
  );
}
