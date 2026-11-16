import Link from "next/link";
import { closeOnboarding } from "@/app/painel/conta/actions";
import type { OnboardingStep } from "@/lib/account";
import { ui } from "../ui";

/**
 * "Primeiros passos" no painel. Cada passo se marca sozinho pelo que a pessoa já fez (onboarding_progress
 * no banco); "Pular" esconde o cartão. Some quando tudo estiver feito.
 */
export function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return (
    <section aria-labelledby="primeiros-passos" className="rounded-2xl border-2 border-dashed border-linha/40 bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={ui.eyebrow}>
            Primeiros passos · {done} de {steps.length}
          </p>
          <h2 id="primeiros-passos" className="mt-1 font-display text-2xl font-semibold tracking-[-0.015em]">
            {next ? next.title : "Tudo pronto"}
          </h2>
          {next && <p className="mt-1 text-[15px] text-tinta-suave">{next.hint}</p>}
        </div>
        <form action={closeOnboarding}>
          <button type="submit" className="text-sm text-tinta-suave underline underline-offset-4 hover:text-tinta">
            Pular
          </button>
        </form>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-papel-escuro" aria-hidden="true">
        <div className="h-full rounded-full bg-linha transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition ${s.done ? "border-tinta/10 bg-papel text-tinta-suave" : s === next ? "border-linha/50 hover:bg-linha/5" : "border-tinta/10 hover:bg-papel"}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] ${s.done ? "bg-tinta text-papel" : "border border-tinta/25"}`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={s.done ? "line-through decoration-tinta/30" : ""}>{s.title}</span>
              <span className="sr-only">{s.done ? " (feito)" : " (a fazer)"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
