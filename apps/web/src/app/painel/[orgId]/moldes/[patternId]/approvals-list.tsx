import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { getOrigin } from "@/lib/origin";
import { approvalLink, formatDate, readSettings, settingsLabel, STATUS_LABEL } from "@/lib/prova/approval";
import type { createClient } from "@/lib/supabase/server";
import { CopyLink } from "../../copy-link";
import { revokeApproval } from "./prova/actions";

type Client = Awaited<ReturnType<typeof createClient>>;

const STATUS_STYLE = {
  pendente: "bg-papel-escuro text-tinta",
  aprovado: "bg-emerald-100 text-emerald-900",
  ajustes: "bg-linha/10 text-linha",
} as const;

/** Aprovações pedidas pela Prova: status, quem respondeu e o link (enquanto valer). */
export async function ApprovalsList({
  supabase,
  orgId,
  patternId,
  canEdit,
}: {
  supabase: Client;
  orgId: string;
  patternId: string;
  canEdit: boolean;
}) {
  const { data } = await supabase
    .from("approvals")
    .select("id, version_number, token, settings, status, reviewer_name, reviewer_comment, decided_at, expires_at, created_at")
    .eq("pattern_id", patternId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = data ?? [];
  if (rows.length === 0) return null;
  const origin = await getOrigin();
  // Data do servidor no momento da requisição (a página já é dinâmica: lê cookies).
  const now = new Date().toISOString();

  return (
    <section className={`${ui.card} space-y-3 p-4`} aria-labelledby="aprovacoes" data-approvals>
      <h2 id="aprovacoes" className={ui.h2}>
        Aprovações
      </h2>
      <ul className="divide-y divide-tinta/10">
        {rows.map((a) => {
          const expired = a.expires_at <= now;
          const details = settingsLabel(readSettings(a.settings));
          return (
            <li key={a.id} className="space-y-2 py-3" data-approval-row={a.status}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                  {a.status === "pendente" && expired ? "Venceu sem resposta" : STATUS_LABEL[a.status]}
                </span>
                <span>
                  Versão {a.version_number}
                  {details && ` · ${details}`}
                </span>
                <span className="text-xs text-tinta-suave">
                  pedida em {formatDate(a.created_at)}
                  {a.status === "pendente" && !expired && ` · vale até ${formatDate(a.expires_at)}`}
                </span>
              </div>
              {a.status !== "pendente" && (
                <p className="text-sm">
                  <strong>{a.reviewer_name}</strong>
                  {a.decided_at && <span className="text-tinta-suave"> em {formatDate(a.decided_at)}</span>}
                  {a.reviewer_comment && <span className="block whitespace-pre-line text-tinta-suave">“{a.reviewer_comment}”</span>}
                </p>
              )}
              {a.status === "pendente" && !expired && <CopyLink link={approvalLink(origin, a.token)} label="Link de aprovação" />}
              {canEdit && (
                <form action={revokeApproval}>
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="patternId" value={patternId} />
                  <input type="hidden" name="approvalId" value={a.id} />
                  <SubmitButton variant="ghost" pendingText="Apagando…">
                    {a.status === "pendente" && !expired ? "Cancelar link" : "Apagar"}
                  </SubmitButton>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
