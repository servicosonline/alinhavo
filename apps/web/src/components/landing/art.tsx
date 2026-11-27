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

/**
 * A tesoura, em duas metades que giram no pino (100, 60): `.lp-lamina-a` (argola de cima e a lâmina que
 * desce) e `.lp-lamina-b` (argola de baixo e a lâmina que sobe). O desenho parado é o mesmo de sempre;
 * para abrir e fechar, gire as duas em sentidos opostos com `svgOrigin: "100 60"` (components/landing/motion.tsx).
 */
export function Tesoura({ className = "" }: { className?: string }) {
  const cabo = { fill: "none", stroke: "var(--tinta)", strokeWidth: 7, strokeLinecap: "round" } as const;
  const lamina = { fill: "var(--tinta-suave)", stroke: "var(--tinta)", strokeWidth: 2.5, strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 200 120" className={`overflow-visible ${className}`} aria-hidden="true">
      <g className="lp-lamina-a">
        <circle cx="34" cy="28" r="18" {...cabo} />
        <path d="M50 36 L100 60" {...cabo} />
        <path d="M96 54 L194 100 L100 67 Z" {...lamina} />
      </g>
      <g className="lp-lamina-b">
        <circle cx="34" cy="92" r="18" {...cabo} />
        <path d="M50 84 L100 60" {...cabo} />
        <path d="M96 66 L194 20 L100 53 Z" {...lamina} />
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

/**
 * O símbolo partido nas duas partes do molde, para o carregamento juntar.
 */
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

/**
 * Rolo de tecido que se abre sobre a mesa com a rolagem:
 * `.lp-rolo-cilindro` rola para a direita enquanto `.lp-rolo-pano` revela o tecido desenrolado
 * com as partes do molde e a linha de fio pousadas por cima.
 */
export function RoloDesenrolando({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 920 260" className={`overflow-visible ${className}`} aria-hidden="true">
      <defs>
        <Sarja id="sarja-mesa" />
        <Sarja id="sarja-tubo" />
      </defs>
      {/* Pano estendido na mesa (parado aparece inteiro; com scroll abre da esquerda para a direita). */}
      <g className="lp-rolo-pano">
        <rect x="48" y="36" width="770" height="188" rx="6" fill="url(#sarja-mesa)" stroke="var(--tinta)" strokeWidth="3" />
        {/* Ourelas com pesponto amarelo */}
        <path d="M58 48 L808 48 M58 212 L808 212" stroke="var(--fita)" strokeWidth="2.5" strokeDasharray="8 6" />
        {/* Marcações de metragem na ourela */}
        {[140, 280, 420, 560, 700].map((x, i) => (
          <text
            key={x}
            x={x}
            y="64"
            fill="var(--papel)"
            fillOpacity="0.7"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="10"
          >
            {`${i + 1},0 m`}
          </text>
        ))}
        {/* Peças de molde pousadas sobre o tecido desenrolado */}
        <g className="lp-rolo-pecas">
          {/* Frente do corpete na dobra */}
          <g data-rolo-peca="0">
            <path
              d="M84 74 L236 74 L252 118 C228 134 224 166 244 196 L84 196 Z"
              fill="var(--papel)"
              stroke="var(--tinta)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M94 84 L228 84 L240 118 C218 132 214 162 232 186 L94 186 Z" fill="none" stroke="var(--linha)" strokeWidth="1.5" strokeDasharray="6 4" />
            <path d="M122 135 L198 135 M190 130 L198 135 L190 140" fill="none" stroke="var(--tinta)" strokeWidth="1.6" strokeLinecap="round" />
            <text x="122" y="126" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="10">FRENTE · 1× DOBRA</text>
          </g>
          {/* Costas */}
          <g data-rolo-peca="1">
            <path
              d="M278 74 L438 74 L450 196 L290 196 C302 158 298 118 278 74 Z"
              fill="var(--papel)"
              stroke="var(--tinta)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M290 84 L428 84 L438 186 L300 186" fill="none" stroke="var(--linha)" strokeWidth="1.5" strokeDasharray="6 4" />
            <path d="M330 135 L406 135 M398 130 L406 135 L398 140" fill="none" stroke="var(--tinta)" strokeWidth="1.6" strokeLinecap="round" />
            <text x="330" y="126" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="10">COSTAS · PAR</text>
          </g>
          {/* Manga com cabeça curva */}
          <g data-rolo-peca="2">
            <path
              d="M484 82 C522 64 574 64 612 82 L636 192 L468 192 Z"
              fill="var(--papel)"
              stroke="var(--tinta)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M492 92 C524 76 572 76 604 92 L624 182 L480 182 Z" fill="none" stroke="var(--linha)" strokeWidth="1.5" strokeDasharray="6 4" />
            <path d="M520 140 L586 140 M578 135 L586 140 L578 145" fill="none" stroke="var(--tinta)" strokeWidth="1.6" strokeLinecap="round" />
            <text x="512" y="128" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="10">MANGA · PAR</text>
          </g>
          {/* Gola / revel */}
          <g data-rolo-peca="3">
            <path
              d="M662 78 L788 78 L780 134 L670 134 Z"
              fill="var(--fita)"
              stroke="var(--tinta)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M666 148 L790 148 L782 194 L658 194 Z"
              fill="var(--papel)"
              stroke="var(--tinta)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <text x="684" y="110" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="10">CÓS · 89,4%</text>
          </g>
        </g>
      </g>
      {/* Cilindro do rolo na ponta direita, que gira e avança abrindo o tecido */}
      <g className="lp-rolo-cilindro">
        <ellipse cx="824" cy="130" rx="32" ry="108" fill="url(#sarja-tubo)" stroke="var(--tinta)" strokeWidth="3.2" />
        <ellipse cx="824" cy="130" rx="22" ry="76" fill="none" stroke="var(--papel)" strokeOpacity="0.5" strokeWidth="2" />
        <ellipse cx="824" cy="130" rx="13" ry="44" fill="var(--papel-escuro)" stroke="var(--tinta)" strokeWidth="2.5" />
        <g className="lp-rolo-miolo">
          <ellipse cx="824" cy="130" rx="5" ry="16" fill="var(--tinta)" />
          <path d="M824 92 L824 168 M808 130 L840 130" stroke="var(--linha)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Manequim com frente, lado e costas que giram com o scroll (`.lp-giro-anel`),
 * piques e costura animada que descem conforme a peça gira.
 */
export function ManequimGiro({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 420" className={`overflow-visible ${className}`} aria-hidden="true">
      <defs>
        <Sarja id="sarja-giro" />
      </defs>
      {/* Anel de giro 360° no chão do ateliê */}
      <ellipse
        className="lp-giro-anel"
        cx="160"
        cy="386"
        rx="122"
        ry="22"
        fill="none"
        stroke="var(--fita)"
        strokeWidth="2.5"
        strokeDasharray="10 7"
      />
      <path
        className="lp-giro-seta"
        d="M262 374 L282 384 L264 396"
        fill="none"
        stroke="var(--fita)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pedestal e haste */}
      <path d="M160 342 L114 388 M160 342 L206 388 M160 342 L160 394" stroke="var(--tinta)" strokeWidth="6" strokeLinecap="round" />
      <rect x="155" y="248" width="10" height="98" rx="3" fill="var(--tinta)" />

      {/* Silhueta lateral suave atrás (mostra que o volume 3D tem profundidade e costas) */}
      <g className="lp-giro-sombra" opacity="0.38">
        <path
          d="M82 68 C68 84 66 122 72 154 C76 178 64 218 58 278 L118 278 C114 218 106 178 108 150 C110 118 104 82 82 68 Z"
          fill="var(--papel-escuro)"
          stroke="var(--tinta)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M238 68 C252 84 254 122 248 154 C244 178 256 218 262 278 L202 278 C206 218 214 178 212 150 C210 118 216 82 238 68 Z"
          fill="var(--papel-escuro)"
          stroke="var(--tinta)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </g>

      {/* Busto principal que gira no eixo vertical */}
      <g className="lp-giro-corpo">
        <rect x="148" y="26" width="24" height="28" fill="var(--papel-escuro)" stroke="var(--tinta)" strokeWidth="2.5" />
        <ellipse cx="160" cy="26" rx="19" ry="6" fill="var(--tinta)" />
        {/* Corpete em sarja jeans */}
        <path
          d="M146 52 C128 56 90 58 78 74 C68 90 74 118 78 138 C84 166 102 178 104 196 L216 196 C218 178 236 166 242 138 C246 118 252 90 242 74 C230 58 192 56 174 52 Z"
          fill="url(#sarja-giro)"
          stroke="var(--tinta)"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* Saia / calça em fita amarela com pences */}
        <path
          d="M104 196 C100 220 78 242 74 298 L154 298 L160 236 L166 298 L246 298 C242 242 220 220 216 196 Z"
          fill="var(--fita)"
          stroke="var(--tinta)"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* Mapa de folga/tensão discreto na cintura (verde/terracota do ofício) */}
        <path
          className="lp-giro-tensao"
          d="M104 196 Q160 206 216 196"
          fill="none"
          stroke="var(--linha)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Costura central e linhas de princesa */}
        <path
          className="lp-giro-costura"
          d="M160 54 L160 236 M124 66 C118 118 126 158 126 196 M196 66 C202 118 194 158 194 196"
          fill="none"
          stroke="var(--papel)"
          strokeWidth="2.2"
          strokeDasharray="7 5"
        />
      </g>
      {/* Etiqueta de ângulo */}
      <g fontFamily="var(--font-geist-mono), monospace" fontSize="10" fill="var(--papel)">
        <rect x="112" y="398" width="96" height="18" rx="9" fill="var(--tinta)" stroke="var(--fita)" strokeWidth="1.5" />
        <text x="160" y="410" textAnchor="middle">GIRO 360° · 3 VISTAS</text>
      </g>
    </svg>
  );
}

/**
 * Cartão de entrega da peça pronta: caderno de oficina com molde graduado,
 * prova 3D aprovada, risco encaixado e ficha técnica fechada com carimbo de corte.
 */
export function FichaPronta({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 380 230" className={className} aria-hidden="true">
      <rect x="6" y="6" width="368" height="218" rx="10" fill="var(--papel)" stroke="var(--tinta)" strokeWidth="2.5" />
      <path d="M6 42 L374 42" stroke="var(--tinta)" strokeWidth="2" />
      {/* Cabeçalho da ordem de corte */}
      <circle cx="24" cy="24" r="5" fill="var(--linha)" />
      <text x="38" y="28" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="11" fontWeight="bold">
        REF 042 · CONJUNTO SARJA · PP–GG
      </text>
      <rect x="276" y="13" width="84" height="20" rx="4" fill="var(--fita)" stroke="var(--tinta)" strokeWidth="1.5" />
      <text x="318" y="27" textAnchor="middle" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="10" fontWeight="bold">
        LIBERADO
      </text>
      {/* Mini molde graduado em 4 tamanhos */}
      <g transform="translate(22, 58)">
        <rect width="148" height="112" rx="6" fill="var(--papel-escuro)" stroke="var(--tinta)" strokeWidth="1.6" />
        {[0, 4, 8, 12].map((off, i) => (
          <path
            key={off}
            d={`M${24 - off * 0.5} ${18 - off * 0.4} L${86 + off} ${18 - off * 0.4} L${96 + off} ${94 + off * 0.5} L${20 - off * 0.5} ${94 + off * 0.5} Z`}
            fill={i === 0 ? "var(--papel)" : "none"}
            stroke={i === 3 ? "var(--linha)" : "var(--tinta)"}
            strokeWidth={i === 0 ? "2" : "1.2"}
            strokeDasharray={i === 0 ? undefined : "4 3"}
          />
        ))}
        <text x="12" y="106" fill="var(--tinta)" fontFamily="var(--font-geist-mono), monospace" fontSize="9">
          DXF-AAMA · PDF 1:1
        </text>
      </g>
      {/* Mini checklist de entrega na direita */}
      <g transform="translate(186, 62)" fontFamily="var(--font-geist-mono), monospace" fontSize="10.5" fill="var(--tinta)">
        {[
          "1. Molde + grade PP–GG",
          "2. Prova 3D sem aperto",
          "3. Link aprovado (Ana)",
          "4. Risco 1,60 m · 88,4%",
          "5. Ficha + consumo real",
        ].map((item, i) => (
          <g key={item} transform={`translate(0, ${i * 22})`}>
            <rect x="0" y="-10" width="14" height="14" rx="3" fill="var(--fita)" stroke="var(--tinta)" strokeWidth="1.5" />
            <path d="M3 -3 L6 0 L11 -6" fill="none" stroke="var(--tinta)" strokeWidth="1.8" strokeLinecap="round" />
            <text x="22" y="1">{item}</text>
          </g>
        ))}
      </g>
      {/* Alinhavo de fechamento no rodapé da ficha */}
      <path d="M22 196 L358 196" stroke="var(--linha)" strokeWidth="2.5" strokeDasharray="8 6" strokeLinecap="round" />
      <text x="22" y="214" fill="var(--tinta-suave)" fontFamily="var(--font-geist-mono), monospace" fontSize="10">
        DO DESENHO AO TECIDO CORTADO · SEM PILOTO PERDIDO
      </text>
    </svg>
  );
}
