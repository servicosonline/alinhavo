import Link from "next/link";
import { PLAN_LOCK_TEXT, type PlanFeature } from "@/lib/plans";
import { ui } from "./ui";

/** Aviso de recurso fora do plano da organização, com o caminho para os planos. O banco bloqueia de verdade. */
export function PlanLock({ feature, className = "" }: { feature: PlanFeature; className?: string }) {
  return (
    <p className={`${ui.success} ${className}`} role="note" data-plan-lock={feature}>
      {PLAN_LOCK_TEXT[feature]}{" "}
      <Link href="/#preco" className={ui.link}>
        Ver os planos
      </Link>
    </p>
  );
}
