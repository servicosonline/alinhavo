import { polygonPerimeter, type Polygon } from "@alinhavo/geometry";

/** Frente de saia-base simplificada, em mm (meia peça, cintura em cima). */
const SAIA_FRENTE: Polygon = [
  { x: 0, y: 0 },
  { x: 180, y: 0 },
  { x: 205, y: 180 },
  { x: 230, y: 600 },
  { x: 0, y: 600 },
];

const MODULOS = [
  { nome: "Molde", texto: "Construção, gradação e margem de costura no navegador.", fase: "Fase 1" },
  { nome: "Prova", texto: "Manequim pela sua tabela, simulação de tecido e mapa de pressão.", fase: "Fase 2" },
  { nome: "Coleção", texto: "Cronograma, ficha técnica e aprovação por link.", fase: "Fase 3" },
  { nome: "Encaixe", texto: "Encaixe automático e consumo de tecido por grade.", fase: "Fase 4" },
  { nome: "Scan", texto: "Molde de papel vira digital com a foto do celular.", fase: "Fase 5" },
  { nome: "Vitrine", texto: "Ficha e descrição de produto com IA.", fase: "Fase 6" },
];

function formatMm(mm: number) {
  return `${Math.round(mm).toLocaleString("pt-BR")} mm`;
}

export default function Home() {
  const contorno = polygonPerimeter(SAIA_FRENTE);
  const pontos = SAIA_FRENTE.map((p) => `${p.x / 2},${p.y / 2}`).join(" ");

  return (
    <main className="papel-milimetrado flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:py-16">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl font-semibold tracking-tight">Alinhavo</span>
          <span className="rounded-full border border-tinta/20 px-3 py-1 text-xs text-tinta-suave">
            em construção
          </span>
        </header>

        <section className="mt-16 grid items-center gap-12 sm:mt-24 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Prove antes
              <br />
              de cortar.
            </h1>
            <p className="mt-6 max-w-md text-lg text-tinta-suave">
              Modelagem, prova virtual em 3D e encaixe para confecções. Tudo no
              navegador, no mesmo molde, do primeiro traço à mesa de corte.
            </p>
          </div>

          <figure className="mx-auto w-48 sm:w-56">
            <svg viewBox="-10 -10 135 320" className="w-full" role="img" aria-label="Molde de frente de saia">
              <polygon points={pontos} fill="white" stroke="var(--tinta)" strokeWidth="1.5" />
              <polygon
                points={pontos}
                fill="none"
                stroke="var(--linha)"
                strokeWidth="1.5"
                strokeDasharray="6 5"
                transform="translate(6 6) scale(0.9)"
              />
              <line x1="40" y1="60" x2="40" y2="240" stroke="var(--tinta-suave)" strokeWidth="1" />
            </svg>
            <figcaption className="mt-3 text-center font-mono text-xs text-tinta-suave">
              frente da saia
              <br />
              <span className="whitespace-nowrap">contorno {formatMm(contorno)}</span>
            </figcaption>
          </figure>
        </section>

        <section className="mt-20 sm:mt-28" aria-labelledby="modulos">
          <h2 id="modulos" className="text-sm font-medium uppercase tracking-widest text-tinta-suave">
            Módulos
          </h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-tinta/15 bg-tinta/15 sm:grid-cols-2 lg:grid-cols-3">
            {MODULOS.map((m) => (
              <li key={m.nome} className="bg-papel p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl font-semibold">{m.nome}</h3>
                  <span className="font-mono text-xs text-linha">{m.fase}</span>
                </div>
                <p className="mt-2 text-sm text-tinta-suave">{m.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-auto pt-16 text-xs text-tinta-suave">
          Alinhavo · Paulo Tech LTDA
        </footer>
      </div>
    </main>
  );
}
