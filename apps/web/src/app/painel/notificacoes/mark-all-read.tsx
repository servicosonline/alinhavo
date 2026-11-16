"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "@/components/ui";
import { getBrowserClient } from "@/lib/supabase/client";

/** "Marcar todas como lidas" na central. */
export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={ui.buttonGhost}
      onClick={async () => {
        const supabase = getBrowserClient();
        if (!supabase) return;
        setBusy(true);
        await supabase.rpc("mark_notifications_read", { p_ids: null });
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? "Marcando…" : "Marcar todas como lidas"}
    </button>
  );
}
