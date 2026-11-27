"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { iosInstallPlace, type IosInstallPlace } from "@/lib/install-app";

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
 * Botão "Instalar app". No Chrome e no Edge (Android e computador) abre direto a confirmação nativa. No
 * iPhone a Apple não deixa site nenhum abrir o "Adicionar à Tela de Início": abre uma folha com os passos
 * e uma seta apontando para o Compartilhar do navegador em uso (`iosInstallPlace`). Some quando o app já
 * está instalado ou quando o navegador não instala (Firefox no computador, por exemplo).
 */
export function InstallApp({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [place, setPlace] = useState<IosInstallPlace | null>(null);

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
      setPlace(iosInstallPlace(navigator.userAgent, navigator.maxTouchPoints, navigator.platform));
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
        aria-haspopup={mode === "ios" ? "dialog" : undefined}
        className="inline-flex items-center gap-1.5 rounded-md text-sm underline decoration-current/30 underline-offset-4 hover:decoration-current"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Instalar app
      </button>
      {place && createPortal(<IosInstallSheet place={place} onClose={() => setPlace(null)} />, document.body)}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline size-5 align-[-4px] text-[#0a7aff]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="Compartilhar">
      <path d="M12 3v12M8 7l4-4 4 4M7 10H5v11h14V10h-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Folha do iPhone: os passos até "Adicionar à Tela de Início", com a seta no botão Compartilhar. */
function IosInstallSheet({ place, onClose }: { place: IosInstallPlace; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const bar = place === "safari-iphone" ? "de baixo" : "de cima";

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo" data-install-sheet={place}>
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-tinta/40" onClick={onClose} />
      {place !== "in-app" && (
        <span
          aria-hidden
          className={`pointer-events-none absolute z-10 text-4xl text-white drop-shadow motion-safe:animate-bounce ${
            place === "safari-iphone" ? "bottom-3 left-1/2 -translate-x-1/2" : "top-2 right-4"
          }`}
        >
          {place === "safari-iphone" ? "↓" : "↑"}
        </span>
      )}
      <div
        className={`absolute inset-x-3 rounded-2xl bg-white p-5 text-tinta shadow-xl ${
          place === "safari-iphone" ? "bottom-16" : place === "top" ? "top-14" : "bottom-6"
        }`}
      >
        <p id="instalar-titulo" className="font-medium">
          Instalar o Alinhavo
        </p>
        {place === "in-app" ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed">
            <p>Este navegador, dentro de outro app, não instala. Toque em ⋯ e escolha <b>Abrir no Safari</b>, ou copie o link e cole no Safari.</p>
            <button type="button" onClick={copyLink} className="rounded-md border border-tinta/20 px-3 py-1.5 text-sm hover:bg-papel">
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              Toque em Compartilhar <ShareIcon /> na barra {bar}
              {place === "safari-iphone" && <> (se não aparecer, toque antes em <b>⋯</b>)</>}.
            </li>
            <li>
              Role a lista e toque em <b>Adicionar à Tela de Início</b>.
            </li>
            <li>
              Confirme em <b>Adicionar</b>.
            </li>
          </ol>
        )}
        <p className="mt-3 text-xs text-tinta-suave">A Apple não deixa nenhum site abrir essa tela sozinho: são só esses toques.</p>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-md bg-tinta px-3 py-2 text-sm text-papel">
          Entendi
        </button>
      </div>
    </div>
  );
}