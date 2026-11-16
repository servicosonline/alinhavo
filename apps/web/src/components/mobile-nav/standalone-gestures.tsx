"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { FULL_SCREEN, isEdgeSwipeBack, PULL_DISTANCE, pullOffset, pullReleased } from "@/lib/mobile-nav";

const noSubscribe = () => () => {};

/** App instalado (PWA): no navegador, voltar pela borda e puxar para atualizar já são do próprio navegador. */
function isStandalone(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Os dois gestos que o app instalado perde no iPhone: arrastar da borda esquerda volta e puxar o topo da página
 * para baixo atualiza (`router.refresh`, os dados do servidor sem recarregar a página). Desligados nas telas de
 * tela cheia, onde o dedo é do molde ou da Prova, e dentro de diálogos abertos.
 */
export function StandaloneGestures() {
  const path = usePathname();
  const router = useRouter();
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => false);
  const [pull, setPull] = useState(0);
  const [refreshing, startRefresh] = useTransition();
  const start = useRef<{ x: number; y: number; atTop: boolean } | null>(null);
  const enabled = standalone && !FULL_SCREEN.test(path);

  useEffect(() => {
    if (!enabled) return;
    const blocked = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest("dialog[open], canvas, input, textarea, select, [data-sem-gesto]");

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || blocked(e.target)) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, atTop: window.scrollY <= 0 };
    };
    const onMove = (e: TouchEvent) => {
      const s = start.current;
      if (!s?.atTop) return;
      const dy = e.touches[0].clientY - s.y;
      setPull(window.scrollY <= 0 ? pullOffset(dy) : 0);
    };
    const onEnd = (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      setPull(0);
      if (!s) return;
      const t = e.changedTouches[0];
      const end = { x: t.clientX, y: t.clientY };
      if (isEdgeSwipeBack(s, end)) {
        router.back();
        return;
      }
      if (s.atTop && window.scrollY <= 0 && pullReleased(end.y - s.y)) startRefresh(() => router.refresh());
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, router]);

  if (!enabled || (pull === 0 && !refreshing)) return null;
  const offset = refreshing ? PULL_DISTANCE * 0.6 : pull;
  const ready = pull >= PULL_DISTANCE;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <span className="grid size-10 place-items-center rounded-full border border-tinta/10 bg-white text-linha shadow-[0_8px_20px_-10px_rgb(29_27_24/0.5)]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-5 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${(pull / PULL_DISTANCE) * 270}deg)` }}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" />
        </svg>
        <span className="sr-only">{refreshing ? "Atualizando" : ready ? "Solte para atualizar" : "Puxe para atualizar"}</span>
      </span>
    </div>
  );
}
