"use client";

import { useState } from "react";
import { ui } from "@/components/ui";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={link} aria-label="Link do convite" className={`${ui.input} mt-0 font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className={ui.buttonGhost}
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
