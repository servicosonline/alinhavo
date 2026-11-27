/**
 * Texto das linhas do registro de atividade (activity_log) para a tela. Puro.
 * A ação vem dos gatilhos do banco (migração registro_atividade) e do log_event.
 */

const PRODUCT_STATUS: Record<string, string> = {
  ideia: "ideia",
  modelagem: "modelagem",
  prova: "prova",
  aprovado: "aprovado",
  producao: "produção",
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function activityText(action: string, meta: Record<string, unknown>): string {
  switch (action) {
    case "molde_criado":
      return `criou o molde ${str(meta.nome)}`.trim();
    case "versao_salva":
      return `salvou a versão ${String(meta.versao ?? "")} de um molde${meta.origem === "prova" ? " (ajuste da Prova)" : meta.origem === "scan" ? " (Scan)" : ""}`;
    case "colecao_criada":
      return `criou a coleção ${str(meta.nome)}`.trim();
    case "produto_criado":
      return `criou o produto ${str(meta.nome)}`.trim();
    case "produto_status":
      return `mudou um produto de ${PRODUCT_STATUS[str(meta.de)] ?? str(meta.de)} para ${PRODUCT_STATUS[str(meta.para)] ?? str(meta.para)}`;
    case "aprovacao_pedida":
      return "pediu uma aprovação à cliente";
    case "aprovacao_decidida":
      return meta.status === "aprovado" ? "aprovou a peça pelo link" : "pediu ajustes pelo link";
    case "risco_salvo":
      return `salvou o risco ${String(meta.risco ?? "")}`.trim();
    case "ficha_gerada":
      return `gerou a ficha técnica ${String(meta.ficha ?? "")}`.trim();
    case "membro_entrou":
      return "entrou na organização";
    case "membro_saiu":
      return "saiu da organização";
    case "papel_mudou":
      return "teve o papel alterado";
    case "convite_criado":
      return "convidou uma pessoa";
    case "acompanhamento_criado":
      return "mandou um link de acompanhamento para a cliente";
    case "prova_aberta":
      return "abriu a Prova 3D";
    case "molde_exportado":
      return "exportou um molde";
    case "risco_exportado":
      return "baixou um risco";
    case "ficha_baixada":
      return "baixou uma ficha técnica";
    case "grade_aberta":
      return "provou a grade inteira";
    default:
      return action.replace(/_/g, " ");
  }
}

/** Quem fez: o e-mail curto da equipe, "A cliente" (sem conta) ou "Alguém" (pessoa que saiu). */
export type ActivityPerson = { email: string; first_name?: string | null; last_name?: string | null };

/** Quem fez: nome e sobrenome do perfil; sem nome, o começo do e-mail; quem saiu da equipe, "Alguém". */
export function activityWho(userId: string | null, people: Map<string, ActivityPerson>): string {
  if (!userId) return "A cliente";
  const p = people.get(userId);
  if (!p) return "Alguém";
  const name = [p.first_name, p.last_name].map((x) => x?.trim()).filter(Boolean).join(" ");
  return name || p.email.split("@")[0]!;
}
