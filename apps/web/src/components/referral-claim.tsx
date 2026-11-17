"use client";

import { useEffect, useRef } from "react";
import { claimReferralFromCookie } from "@/app/painel/referral-actions";

/** Liga a indicação guardada pelo link (uma vez por carga do painel; o servidor apaga o cookie). Não desenha nada. */
export function ReferralClaim() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void claimReferralFromCookie();
  }, []);
  return null;
}
