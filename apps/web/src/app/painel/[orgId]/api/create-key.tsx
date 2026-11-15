"use client";

import { useState } from "react";
import { ui } from "@/components/ui";
import { CopyLink } from "../copy-link";
import { createApiKey } from "./actions";

/** Cria uma chave e mostra o segredo uma vez só (o banco guarda só o hash). */
export function CreateKey({ orgId }: { orgId: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await createApiKey(orgId, name);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setSecret(r.secret);
    setName("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <label className="block min-w-48 flex-1">
          <span className={ui.label}>Nome da chave</span>
          <input
            className={ui.input}
            value={name}
            maxLength={80}
            placeholder='Ex.: "ERP", "Planilha de custos"'
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button type="submit" className={ui.buttonPrimary} disabled={busy || !name.trim()} data-api-create>
          {busy ? "Criando…" : "Criar chave"}
        </button>
      </form>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}
      {secret && (
        <div className={`${ui.success} space-y-2`} role="status" data-api-secret>
          <p className="text-sm font-medium">Copie a chave agora: ela não aparece de novo.</p>
          <CopyLink link={secret} label="Chave de API" />
          <p className="text-xs text-tinta-suave">Guarde num lugar seguro (no servidor do sistema que vai usar a API), nunca numa página pública.</p>
        </div>
      )}
    </div>
  );
}
