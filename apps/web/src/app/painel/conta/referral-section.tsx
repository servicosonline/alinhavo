import { ui } from "@/components/ui";
import { getOrigin } from "@/lib/origin";
import { REFERRAL_DAYS, REFERRAL_STATUS_LABEL, referralRules, whatsappShareUrl } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";
import { CopyLink } from "../[orgId]/copy-link";

const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

/**
 * "Indique e ganhe" em Minha conta: o link da pessoa, as regras do momento (configuradas pelo superadmin) e quem ela
 * indicou, com o e-mail mascarado. Com o programa desligado, não aparece.
 */
export async function ReferralSection({ cardClass }: { cardClass: string }) {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("referral_settings").select("*").maybeSingle();
  const rules = referralRules(settings);
  if (!rules) return null;
  const [{ data: code }, { data: referrals }, origin] = await Promise.all([supabase.rpc("my_referral_code"), supabase.rpc("my_referrals"), getOrigin()]);
  if (!code) return null;
  const link = `${origin}/i/${code}`;

  return (
    <section className={cardClass} aria-labelledby="conta-indicacao" data-referral>
      <h2 id="conta-indicacao" className={ui.eyebrow}>
        Indique e ganhe
      </h2>
      <div className="space-y-1 text-sm">
        {rules.referrer && <p>{rules.referrer}</p>}
        {rules.referred && <p>{rules.referred}</p>}
        <p className="text-xs text-tinta-suave">
          Vale para conta nova, criada pelo seu link em até {REFERRAL_DAYS} dias. O desconto entra quando a pessoa fizer o primeiro pagamento.
          Regras provisórias, sujeitas ao regulamento do programa.
        </p>
      </div>
      <CopyLink link={link} label="Seu link de indicação" />
      <a href={whatsappShareUrl(link)} target="_blank" rel="noreferrer" className={`${ui.buttonGhost} inline-flex`}>
        Mandar pelo WhatsApp
      </a>
      {referrals && referrals.length > 0 ? (
        <ul className="divide-y divide-tinta/10 border-t border-tinta/10 pt-2" data-referral-list>
          {referrals.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate font-mono text-xs">{r.email_hint}</span>
              <span className="flex items-center gap-2 text-xs text-tinta-suave">
                {dia.format(new Date(r.created_at))}
                <span className={r.status === "recusada" ? ui.tagAlert : ui.tag}>
                  {r.reward_status === "pendente" ? "Desconto garantido" : r.reward_status === "aplicado" ? "Desconto usado" : REFERRAL_STATUS_LABEL[r.status]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={ui.muted}>Ninguém criou conta pelo seu link ainda.</p>
      )}
    </section>
  );
}
