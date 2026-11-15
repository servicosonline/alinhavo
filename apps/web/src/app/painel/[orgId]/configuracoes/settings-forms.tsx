"use client";

import { useActionState } from "react";
import { ImageCropper } from "@/components/account/image-cropper";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { renameOrg, setOrgCover } from "./actions";

export function RenameOrgForm({ orgId, name }: { orgId: string; name: string }) {
  const [state, action, pending] = useActionState(renameOrg.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="grid max-w-md gap-3">
      <div>
        <label htmlFor="org-nome" className={ui.label}>
          Nome da organização
        </label>
        <input id="org-nome" name="name" defaultValue={name} maxLength={80} required className={ui.input} />
      </div>
      <div>
        <SubmitButton pendingText="Salvando…">Salvar nome</SubmitButton>
      </div>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className={ui.success} role="status">
          {state.ok}
        </p>
      )}
    </ActionForm>
  );
}

/** Capa quadrada (512 px) no bucket `org-capas`, pasta da organização. */
export function OrgCoverCropper({ orgId, hasCover }: { orgId: string; hasCover: boolean }) {
  return (
    <ImageCropper
      bucket="org-capas"
      folder={orgId}
      onSave={setOrgCover.bind(null, orgId)}
      hasImage={hasCover}
      size={512}
      maxBytes={300 * 1024}
      round={false}
      noun="capa"
    />
  );
}
