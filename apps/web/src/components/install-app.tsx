"use client";

import { useEffect, useState } from "react";

/** O evento do Chrome e do Edge que abre a instalação nativa (ainda fora dos tipos do TypeScript). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "native" | "ios";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  // iPadOS se apresenta como Mac, mas tem toque.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Botão "Instalar app". No Chrome e no Edge abre a instalação nativa; no iPhone, que não tem esse botão,
 * mostra o caminho pelo menu Compartilhar. Some quando o app já está instalado ou quando o navegador
 * não instala (Firefox no computador, por exemplo).
 */
export function InstallApp({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    // O Safari do iPhone nunca dispara o evento: o modo vem na hora, num efeito (não no render, para não
    // diferenciar do HTML do servidor).
    const ios = isIos();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      setMode("native");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const t = ios ? window.setTimeout(() => setMode("ios"), 0) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(t);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    if (mode === "ios") {
      setShowIosHelp((v) => !v);
      return;
    }
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // O evento só vale uma vez (aceito ou recusado); recusado, o navegador dispara outro mais tarde.
    setPrompt(null);
    setMode("hidden");
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={install}
        aria-expanded={mode === "ios" ? showIosHelp : undefined}
        className="inline-flex items-center gap-1.5 rounded-md text-sm underline decoration-current/30 underline-offset-4 hover:decoration-current"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Instalar app
      </button>
      {mode === "ios" && showIosHelp && (
        <span
          role="note"
          className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-xl border border-tinta/15 bg-white p-3 text-[13px] leading-relaxed text-tinta shadow-lg"
        >
          No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta para cima) e depois em{" "}
          <b>Adicionar à Tela de Início</b>.
        </span>
      )}
    </span>
  );
}
