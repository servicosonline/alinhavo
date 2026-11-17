/** Botão sobre a cena 3D que traz a câmera de volta ao enquadramento inicial (útil depois de mover com o dedo). */
export function CenterViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-centralizar
      className="absolute right-2 bottom-2 z-10 inline-flex items-center gap-1.5 rounded-full border border-tinta/15 bg-white/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur hover:bg-white"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
      </svg>
      Centralizar
    </button>
  );
}
