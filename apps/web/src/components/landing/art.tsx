/*
 * Desenhos da página inicial, no traço da marca (marca/README.md, seção 7): objetos do ateliê
 * em vez de foto de banco. Só cores da caixa de costura (papel, tinta, linha, giz, fita).
 * Todos são decorativos (aria-hidden); o que importa para quem não vê está no texto da página.
 */

/** Sarja do jeans: diagonais claras sobre o giz. Cada desenho que usa passa um id próprio. */
function Sarja({ id }: { id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <rect width="6" height="6" fill="var(--costura)" />
      <rect width="2" height="6" fill="var(--papel)" opacity="0.13" />
    </pattern>
  );
}

export function Tesoura({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <g fill="none" stroke="var(--tinta)" strokeWidth="7" strokeLinecap="round">
        <circle cx="34" cy="28" r="18" />
        <circle cx="34" cy="92" r="18" />
        <path d="M50 36 L100 60 M50 84 L100 60" />
      </g>
      <g fill="var(--tinta-suave)" stroke="var(--tinta)" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M96 54 L194 100 L100 67 Z" />
        <path d="M96 66 L194 20 L100 53 Z" />
      </g>
      <circle cx="100" cy="60" r="5.5" fill="var(--fita)" stroke="var(--tinta)" strokeWidth="2.5" />
    </svg>
  );
}

export function Carretel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 170" className={className} aria-hidden="true">
      <rect x="22" y="26" width="76" height="98" fill="var(--linha)" />
      <g stroke="var(--tinta)" strokeOpacity="0.22" strokeWidth="2">
        {[36, 46, 56, 66, 76, 86, 96, 106, 116].map((y) => (
          <path key={y} d={`M22 ${y} L98 ${y - 3}`} />
        ))}
      </g>
      <rect x="10" y="12" width="100" height="16" rx="5" fill="var(--tinta)" />
      <rect x="10" y="122" width="100" height="16" rx="5" fill="var(--tinta)" />
      {/* A linha que escapa do carretel vira o alinhavo. */}
      <path
        d="M98 70 C 130 70, 150 100, 132 130 C 118 152, 138 166, 156 160"
        fill="none"
        stroke="var(--linha)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="12 9"
      />
    </svg>
  );
}

export function RoloTecido({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 130" className={className} aria-hidden="true">
      <defs>
        <Sarja id="sarja-rolo" />
      </defs>
      <rect x="40" y="18" width="250" height="84" fill="url(#sarja-rolo)" stroke="var(--tinta)" strokeWidth="3" />
      {/* Pesponto amarelo, como no jeans. */}
      <path d="M48 30 L282 30 M48 90 L282 90" stroke="var(--fita)" strokeWidth="2.5" strokeDasharray="7 5" />
      {/* A aba de tecido que desenrola. */}
      <path d="M290 102 L316 124 L250 124 L232 102 Z" fill="url(#sarja-rolo)" stroke="var(--tinta)" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="40" cy="60" rx="20" ry="42" fill="var(--costura)" stroke="var(--tinta)" strokeWidth="3" />
      <g fill="none" stroke="var(--papel)" strokeOpacity="0.45" strokeWidth="2">
        <ellipse cx="40" cy="60" rx="13" ry="30" />
        <ellipse cx="40" cy="60" rx="7" ry="17" />
      </g>
      <ellipse cx="40" cy="60" rx="3" ry="7" fill="var(--tinta)" />
    </svg>
  );
}

/** Fita métrica reta, com marcação a cada centímetro e número a cada 10. */
export function FitaMetrica({ className = "", cm = 40 }: { className?: string; cm?: number }) {
  const passo = 10;
  const largura = cm * passo + 20;
  return (
    <svg viewBox={`0 0 ${largura} 34`} className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width={largura - 3} height="31" rx="3" fill="var(--fita)" stroke="var(--tinta)" strokeWidth="3" />
      <g stroke="var(--tinta)" strokeWidth="1.5">
        {Array.from({ length: cm + 1 }, (_, i) => (
          <path key={i} d={`M${10 + i * passo} 2 L${10 + i * passo} ${i % 10 === 0 ? 16 : i % 5 === 0 ? 12 : 8}`} />
        ))}
      </g>
      <g fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="9" textAnchor="middle">
        {Array.from({ length: Math.floor(cm / 10) + 1 }, (_, i) => (
          <text key={i} x={10 + i * 10 * passo} y="27">
            {i * 10}
          </text>
        ))}
      </g>
    </svg>
  );
}

/*
 * O manequim de costura e as quatro partes do molde que o vestem. As partes ficam no lugar no HTML
 * (é o que aparece sem animação); a página faz cada uma entrar de um lado com a rolagem.
 */
export const PARTES_MANEQUIM = [
  {
    id: "frente-esq",
    d: "M150 74 L136 74 C 120 76, 72 76, 58 94 C 48 112, 54 140, 58 160 C 64 195, 86 210, 88 232 L150 232 Z",
    fill: "url(#sarja-manequim)",
  },
  {
    id: "frente-dir",
    d: "M150 74 L164 74 C 180 76, 228 76, 242 94 C 252 112, 246 140, 242 160 C 236 195, 214 210, 212 232 L150 232 Z",
    fill: "url(#sarja-manequim)",
  },
  { id: "saia-esq", d: "M150 232 L88 232 C 86 255, 56 275, 58 305 L 46 404 L150 404 Z", fill: "var(--fita)" },
  { id: "saia-dir", d: "M150 232 L212 232 C 214 255, 244 275, 242 305 L 254 404 L150 404 Z", fill: "var(--fita)" },
] as const;

export function Manequim({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 530" className={className} aria-hidden="true">
      <defs>
        <Sarja id="sarja-manequim" />
      </defs>

      {/* Pé de três apoios e haste. */}
      <g stroke="var(--tinta)" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M150 470 L86 516 M150 470 L214 516 M150 470 L150 522" />
      </g>
      <rect x="144" y="320" width="12" height="154" rx="3" fill="var(--tinta)" />

      {/* Busto em algodão cru, com as linhas de princesa. */}
      <path
        d="M136 70 C 120 74, 70 74, 55 92 C 44 110, 52 140, 56 160 C 62 195, 84 210, 86 232 C 88 255, 58 275, 60 305 C 62 322, 80 332, 150 334 C 220 332, 238 322, 240 305 C 242 275, 212 255, 214 232 C 216 210, 238 195, 244 160 C 248 140, 256 110, 245 92 C 230 74, 180 74, 164 70 Z"
        fill="var(--papel-escuro)"
        stroke="var(--tinta)"
        strokeWidth="3"
      />
      <g fill="none" stroke="var(--tinta)" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="5 5">
        <path d="M110 80 C 100 140, 118 200, 116 330" />
        <path d="M190 80 C 200 140, 182 200, 184 330" />
        <path d="M86 232 C 120 240, 180 240, 214 232" />
      </g>
      <rect x="136" y="38" width="28" height="36" fill="var(--papel-escuro)" stroke="var(--tinta)" strokeWidth="3" />
      <ellipse cx="150" cy="38" rx="24" ry="8" fill="var(--tinta)" />
      <circle cx="150" cy="25" r="8" fill="var(--tinta)" />

      {/* As partes do molde. */}
      <g className="lp-partes">
        {PARTES_MANEQUIM.map((p) => (
          <path
            key={p.id}
            data-parte={p.id}
            d={p.d}
            fill={p.fill}
            stroke="var(--tinta)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
      </g>
      {/* Piques que casam na costura do meio. */}
      <g className="lp-piques" fill="var(--tinta)">
        <path d="M150 150 l-7 -6 l0 12 Z M150 150 l7 -6 l0 12 Z" />
        <path d="M150 318 l-7 -6 l0 12 Z M150 318 l7 -6 l0 12 Z" />
      </g>
      {/* O alinhavo que fecha a costura do meio. */}
      <path
        className="lp-costura-meio"
        d="M150 80 L150 400"
        stroke="var(--linha)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="14 10"
      />

      {/* A fita métrica no pescoço. */}
      <g fill="none" strokeLinecap="round">
        <path d="M134 60 C 112 80, 112 140, 118 210" stroke="var(--fita)" strokeWidth="12" />
        <path d="M134 60 C 112 80, 112 140, 118 210" stroke="var(--tinta)" strokeWidth="6" strokeDasharray="1.2 7" strokeOpacity="0.7" />
        <path d="M166 60 C 188 84, 186 160, 178 250" stroke="var(--fita)" strokeWidth="12" />
        <path d="M166 60 C 188 84, 186 160, 178 250" stroke="var(--tinta)" strokeWidth="6" strokeDasharray="1.2 7" strokeOpacity="0.7" />
      </g>
    </svg>
  );
}

/*
 * O risco do encaixe: oito partes de molde (papel) sobre o tecido (jeans). As posições formam um
 * encaixe plausível de calça e top; é ilustração, não saída do motor.
 */
export const PECAS_ENCAIXE = [
  "10,15 190,15 170,285 30,285",
  "200,15 330,15 350,285 180,285",
  "340,15 520,15 500,285 360,285",
  "530,15 620,15 620,140 530,140",
  "522,150 620,150 620,285 510,285",
  "630,15 785,15 785,120 630,120",
  "630,130 785,130 785,200 630,200",
  "630,210 785,210 785,285 630,285",
];

export function RiscoEncaixe({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 300" className={className} aria-hidden="true">
      <defs>
        <Sarja id="sarja-risco" />
      </defs>
      <rect width="800" height="300" rx="6" fill="url(#sarja-risco)" />
      <path d="M0 6 L800 6 M0 294 L800 294" stroke="var(--fita)" strokeWidth="2" strokeDasharray="7 5" />
      <g>
        {PECAS_ENCAIXE.map((pts, i) => (
          <g key={pts} data-peca={i}>
            <polygon points={pts} fill="var(--papel)" stroke="var(--tinta)" strokeWidth="2" strokeLinejoin="round" />
            <polygon points={pts} fill="none" stroke="var(--linha)" strokeWidth="1.6" strokeDasharray="6 5" style={{ transformBox: "fill-box", transformOrigin: "center", transform: "scale(0.9)" }} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** O símbolo partido nas duas partes do molde, para o carregamento juntar. */
export function SimboloEmPartes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <mask id="corte-loader" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d="M38 0 C36 34 66 52 62 100" fill="none" stroke="#000" strokeWidth="8" />
          <path d="M46.6 42.4 L40.3 49.5 L49.9 50.1 Z M51.6 39.4 L61.2 40.0 L54.9 47.1 Z" fill="#000" />
        </mask>
        <clipPath id="lado-esq">
          <path d="M0 0 L38 0 C36 34 66 52 62 100 L0 100 Z" />
        </clipPath>
        <clipPath id="lado-dir">
          <path d="M38 0 L100 0 L100 100 L62 100 C66 52 36 34 38 0 Z" />
        </clipPath>
      </defs>
      <g className="lp-loader-esq" clipPath="url(#lado-esq)">
        <rect x="6" y="6" width="88" height="88" rx="22" fill="var(--tinta)" mask="url(#corte-loader)" />
      </g>
      <g className="lp-loader-dir" clipPath="url(#lado-dir)">
        <rect x="6" y="6" width="88" height="88" rx="22" fill="var(--tinta)" mask="url(#corte-loader)" />
      </g>
      <path
        className="lp-loader-ponto"
        d="M39.04 14.38 C43.32 35.54 58.43 52.25 61.73 80.27"
        pathLength={100}
        fill="none"
        stroke="var(--linha)"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeDasharray="9.52 8.57"
      />
    </svg>
  );
}
