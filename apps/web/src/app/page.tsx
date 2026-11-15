import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Carretel, FitaMetrica, Manequim, RiscoEncaixe, RoloTecido, SimboloEmPartes, Tesoura } from "@/components/landing/art";
import { BrandLogo, BrandSymbol } from "@/components/landing/brand-mark";
import { SavingsCalculator } from "@/components/landing/calculator";
import { LandingMotion } from "@/components/landing/motion";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Alinhavo · prove antes de cortar",
  description:
    "Molde, prova 3D e encaixe no mesmo arquivo, direto no navegador. A cliente aprova por link. Para modelistas e confecções.",
};

/*
 * A página inicial pública (marca/README.md e as telas aprovadas em marca/landing/).
 * Versão em parallax: cada cena tem planos que andam em velocidades diferentes (components/landing/motion.tsx).
 * O HTML já é o estado final: sem JavaScript ou com "reduzir movimento", nada fica escondido.
 */

const rotulo = "font-mono text-[12px] tracking-[0.14em] uppercase text-tinta-suave";
const h2 = "font-display text-4xl leading-[1.02] font-semibold tracking-[-0.025em] sm:text-5xl lg:text-[3.4rem]";

/** Atraso de entrada (depois do carregamento) e ritmo da flutuação, por elemento. */
const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const flutua = (seg: number, graus = 0, atraso = 0) =>
  ({ "--f": `${seg}s`, "--a": `${graus}deg`, "--fd": `${-atraso}s` }) as CSSProperties;

/* O carregamento só aparece na primeira visita da sessão (marca no <html> antes de pintar). */
const INTRO = `try{if(sessionStorage.getItem("alv-intro"))document.documentElement.classList.add("alv-sem-intro");else sessionStorage.setItem("alv-intro","1")}catch(e){}`;

const MODULOS = [
  { nome: "Molde", texto: "Construção, gradação, margem de costura. Exporta DXF-AAMA e PDF em escala real.", status: "", cor: "lp-tag-papel" },
  { nome: "Prova", texto: "Manequim pela sua tabela de medidas, simulação de tecido, mapa de pressão e folga.", status: "", cor: "lp-tag-linha" },
  { nome: "Coleção", texto: "Cronograma, ficha técnica com consumo calculado e comentários da equipe.", status: "", cor: "lp-tag-fita" },
  { nome: "Encaixe", texto: "Risco automático, aproveitamento medido e saída DXF e PLT para o plotter.", status: "", cor: "lp-tag-giz" },
  { nome: "Scan", texto: "Molde de papel vira digital com a foto do celular e uma folha de marcadores.", status: "em teste", cor: "lp-tag-papel" },
  { nome: "Vitrine", texto: "Descrição de produto e ficha com IA.", status: "em breve", cor: "lp-tag-tinta" },
];

const PASSOS = [
  ["As partes do molde", "Frente, costas e saia saem do mesmo arquivo do desenho 2D."],
  ["Vestem o corpo pela sua tabela", "O manequim tem as medidas da sua tabela, tamanho por tamanho."],
  ["O alinhavo fecha a costura", "Você vê onde aperta e onde sobra antes do primeiro corte."],
] as const;

const PERGUNTAS = [
  {
    p: "Preciso instalar alguma coisa?",
    r: "Não. O Alinhavo roda no navegador do computador (Chrome ou Edge atualizados). A simulação 3D usa a placa de vídeo do próprio computador.",
  },
  {
    p: "Funciona com o meu plotter?",
    r: "O molde sai em DXF-AAMA, o padrão que plotters e cortadoras leem, e em PDF em escala 1:1 para imprimir em folhas A4. O risco do encaixe sai em DXF e em PLT (HPGL).",
  },
  {
    p: "A cliente precisa criar conta para aprovar?",
    r: "Não. Você manda um link que vale 7, 14 ou 30 dias. Ela vê a peça de frente, costas e lado, e aprova ou pede ajuste escrevendo o que quer mudar.",
  },
  {
    p: "E os moldes que eu já tenho no papel?",
    r: "O Scan transforma a foto do molde de papel em molde digital, com a ajuda de uma folha de marcadores impressa. Ele ainda está em fase de testes com fotos reais.",
  },
  {
    p: "Meus moldes ficam seguros?",
    r: "Cada empresa só enxerga os próprios moldes, coleções e riscos. Cada ajuste vira uma versão nova do molde: nada é sobrescrito.",
  },
  {
    p: "Dá para provar a grade inteira?",
    r: "Sim. A gradação é feita no molde e a Prova veste P, M e G lado a lado, cada um no seu corpo, comparando pressão e folga.",
  },
];

function Carregando() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO }} />
      <div className="lp-loader" aria-hidden="true">
        <SimboloEmPartes className="lp-loader-simbolo" />
        <p className="font-mono text-[12px] tracking-[0.14em] text-tinta-suave uppercase">Costurando as partes…</p>
        <div className="lp-loader-fita" />
        <p className="lp-loader-cm font-mono text-[13px]" />
      </div>
    </>
  );
}

function Notebook() {
  return (
    <figure className="lp-notebook">
      <div className="lp-lid">
        <video
          className={`lp-screen lp-motion`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/landing/prova-conjunto.jpg"
          aria-label="Tela real da Prova 3D do Alinhavo: o conjunto calça e top costurando no corpo, depois o mapa de pressão"
        >
          <source src="/landing/prova-conjunto.webm" type="video/webm" />
          <source src="/landing/prova-conjunto.mp4" type="video/mp4" />
        </video>
        <Image
          className={`lp-screen lp-still`}
          src="/landing/prova-conjunto.jpg"
          width={1280}
          height={800}
          alt="Tela real da Prova 3D do Alinhavo: conjunto calça e top em jeans no manequim"
          priority
        />
      </div>
      <div className="lp-base" aria-hidden="true" />
    </figure>
  );
}

/** Celular pequeno da abertura: a captura real da Prova, como chega para a cliente. */
function CelularMini() {
  return (
    <div className="lp-phone-mini" aria-hidden="true">
      <div>
        <Image src="/landing/captura-1.jpg" width={900} height={1200} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-x-2 bottom-2 rounded-md bg-tinta py-1 text-center text-[10px] font-medium text-papel">
          Aprovado ✓
        </span>
      </div>
    </div>
  );
}

function Celular() {
  const fotos = [
    ["/landing/captura-1.jpg", "Frente"],
    ["/landing/captura-2.jpg", "Costas"],
    ["/landing/captura-3.jpg", "Lado"],
  ] as const;
  return (
    <div className="lp-phone" role="img" aria-label="Celular com a página de aprovação do Alinhavo: a cliente vê frente, costas e lado e aprova">
      <div className="lp-glass text-tinta" aria-hidden="true">
        <div className="lp-island" />
        <div className="px-5 pt-14 text-[13px]">
          <p className="text-[10px] tracking-[0.08em] text-tinta-suave uppercase">Aprovação de protótipo</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">Conjunto calça + top</p>
          <p className="mt-0.5 text-[11.5px] text-tinta-suave">Versão 2 · M · Jeans · Em pé · vale até 28/11/2026</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {fotos.map(([src, nome]) => (
              <div key={nome}>
                <Image src={src} width={900} height={1200} alt="" className="aspect-[3/4] w-full rounded-md border border-tinta/15 object-cover" />
                <p className="text-center text-[10px] text-tinta-suave">{nome}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-tinta/10 bg-white p-3">
            <p className="text-xs font-medium">Sua resposta</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <span className="rounded-md bg-tinta py-2 text-center text-papel">Aprovar</span>
              <span className="rounded-md border border-tinta/20 py-2 text-center">Pedir ajustes</span>
            </div>
            <p className="mt-2.5 text-xs font-medium">Seu nome</p>
            <p className="mt-1 rounded-md border border-tinta/20 bg-white px-2.5 py-2">Ana</p>
            <p className="mt-2.5 text-xs font-medium">Comentário (opcional)</p>
            <p className="mt-1 h-11 rounded-md border border-tinta/20 bg-white px-2.5 py-2 text-tinta-suave">Ficou ótimo, pode cortar o piloto.</p>
            <p className="mt-2.5 rounded-md bg-tinta py-2 text-center font-medium text-papel">Enviar aprovação</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip">
      <Carregando />
      <div className="lp-progresso" aria-hidden="true" />
      <LandingMotion />

      {/* 1. Abertura: a mesa do ateliê em planos. */}
      <section data-cena="abertura" className="relative">
        <div data-speed="0.5" className="papel-milimetrado absolute inset-x-0 -top-[5%] h-[125%]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-10">
          <header className="flex h-20 items-center gap-8">
            <Link href="/" aria-label="Alinhavo, página inicial">
              <BrandLogo />
            </Link>
            <nav className="ml-auto hidden items-center gap-7 text-[15px] text-tinta-suave md:flex" aria-label="Seções">
              <a href="#como-funciona" className="hover:text-tinta">Como funciona</a>
              <a href="#calculadora" className="hover:text-tinta">Calculadora</a>
              <a href="#preco" className="hover:text-tinta">Preço</a>
              <a href="#perguntas" className="hover:text-tinta">Perguntas</a>
            </nav>
            <Link href="/entrar" className="ml-auto rounded-lg border border-tinta/25 bg-papel px-4 py-2 text-[15px] hover:border-tinta md:ml-0">
              Entrar
            </Link>
          </header>

          <div className="grid items-center gap-16 pt-10 pb-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:pt-16 lg:pb-24">
            <div className="relative z-10">
              <p className="lp-entra font-mono text-[13px] tracking-[0.14em] text-linha uppercase" style={d(0)}>
                Molde · Prova 3D · Encaixe
              </p>
              <h1 className="lp-entra mt-5 font-display text-[3.4rem] leading-[0.95] font-semibold tracking-[-0.03em] sm:text-7xl xl:text-[5.6rem]" style={d(0.08)}>
                Prove antes
                <br />
                de cortar.
              </h1>
              <span className="lp-entra alinhavo mt-7 w-44" style={d(0.16)} aria-hidden="true" />
              <p className="lp-entra mt-7 max-w-lg text-lg leading-relaxed text-tinta-suave sm:text-xl" style={d(0.22)}>
                Desenhe o molde, vista no corpo em 3D e veja onde aperta. O ajuste feito na prova volta para o molde.
                Tudo no navegador.
              </p>
              <div className="lp-entra mt-9 flex flex-wrap gap-3" style={d(0.3)}>
                <Link href="/experimentar" className="rounded-[10px] bg-linha px-6 py-3.5 font-medium text-white hover:bg-[#a93220]">
                  Experimentar sem cadastro →
                </Link>
                <a href="#preco" className="rounded-[10px] border-[1.5px] border-tinta bg-papel px-6 py-3.5 hover:bg-papel-escuro">
                  Ver o preço
                </a>
              </div>
              <p className="lp-entra mt-5 font-mono text-[13px] text-tinta-suave" style={d(0.36)}>
                Sem instalar · 1 molde grátis para sempre · 15 dias com tudo
              </p>
            </div>

            {/* Os planos: rolo de tecido e fita no fundo, notebook no meio, celular e ferramentas na frente. */}
            <div className="relative mx-2 sm:mx-6 lg:mx-0">
              <div data-speed="0.45" className="absolute -top-14 -right-2 w-[44%] sm:-top-20" aria-hidden="true">
                <div className="lp-entra" style={d(0.2)}>
                  <div className="lp-flutua" style={flutua(7, 2)}>
                    <RoloTecido className="w-full" />
                  </div>
                </div>
              </div>
              <div data-speed="0.3" className="lp-fita-abertura absolute top-[104%] left-[28%] w-[58%] -rotate-[3deg]" aria-hidden="true">
                <div className="lp-entra" style={d(0.28)}>
                  <FitaMetrica className="w-full" />
                </div>
              </div>
              <div data-speed="0.12" className="relative">
                <div className="lp-entra" style={d(0.1)}>
                  <div className="lp-flutua" style={flutua(6, 0.6)}>
                    <Notebook />
                  </div>
                </div>
              </div>
              <div data-speed="-0.35" className="absolute -bottom-12 -left-2 w-[26%] max-w-[150px] sm:-left-6">
                <div className="lp-entra" style={d(0.4)}>
                  <div className="lp-flutua" style={flutua(5, -3, 1.4)}>
                    <CelularMini />
                  </div>
                </div>
              </div>
              <div data-speed="-0.6" className="absolute -right-2 -bottom-14 w-[30%] max-w-[190px] sm:-right-6" aria-hidden="true">
                <div className="lp-entra" style={d(0.48)}>
                  <div className="lp-flutua" style={flutua(4.5, 5, 0.8)}>
                    <Tesoura className="w-full -rotate-12" />
                  </div>
                </div>
              </div>
              <div data-speed="-0.5" className="absolute -top-10 -left-3 w-[13%] max-w-[84px] sm:-left-8" aria-hidden="true">
                <div className="lp-entra" style={d(0.44)}>
                  <div className="lp-flutua" style={flutua(5.5, -4, 2)}>
                    <Carretel className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="relative -mt-6 mb-6 text-right font-mono text-xs text-tinta-suave lg:-mt-10">
            Tela real da Prova 3D do Alinhavo: o conjunto calça + top em jeans.
          </p>

          <div className="relative flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-tinta/15 py-7 text-[15px] text-tinta-suave">
            <span className={`${rotulo} text-[11px]`}>No mesmo arquivo</span>
            <span><b className="text-tinta">Molde</b> 2D</span>
            <span><b className="text-linha">Prova</b> 3D</span>
            <span><b className="text-tinta">Coleção</b> e ficha</span>
            <span><b className="text-tinta">Encaixe</b></span>
            <span><b className="text-tinta">Scan</b> do papel</span>
            <span className="font-mono text-sm lg:ml-auto">Exporta DXF-AAMA e PLT para o seu plotter</span>
          </div>
        </div>
      </section>

      {/* 2. O problema: a palavra gigante de jeans. */}
      <section data-cena="problema" className="relative overflow-hidden bg-tinta text-papel">
        <div className="mx-auto max-w-7xl px-5 pt-24 pb-24 sm:px-10 lg:pt-32">
          <p className="font-mono text-[12px] tracking-[0.14em] text-papel/60 uppercase">A conta que ninguém faz</p>
          <h2 className={`${h2} mt-5 max-w-3xl`}>Quantos pilotos você cortou esse mês?</h2>
          <p className="lp-gigante mt-10 font-display" aria-hidden="true">
            piloto
          </p>
          <ul className="relative z-10 mt-6 grid gap-6 sm:grid-cols-3">
            {(
              [
                ["Tecido", "Cada piloto refeito é tecido que vai para o retalho.", "-0.15"],
                ["Horas", "É corte e costura de novo, enquanto a produção espera.", "-0.4"],
                ["Semanas", "E a coleção atrasa até a cliente aprovar a peça.", "-0.65"],
              ] as const
            ).map(([t, texto, v]) => (
              <li key={t} data-speed={v} className="rounded-2xl border border-papel/15 bg-tinta/85 p-6 backdrop-blur-sm">
                <p className="border-l-2 border-linha pl-4 font-display text-3xl font-semibold">{t}</p>
                <p className="mt-2 text-papel/75">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. O manequim: as partes do molde vestem o corpo. */}
      <section id="como-funciona" data-cena="manequim" className="relative scroll-mt-4 overflow-x-clip">
        <div className="lp-palco mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-10 lg:h-svh lg:grid-cols-[0.95fr_1.05fr] lg:py-0">
          <div>
            <p className={rotulo}>A Prova</p>
            <h2 className={`${h2} mt-5`}>Veja a peça vestida antes de cortar o piloto.</h2>
            <ol className="mt-10 grid gap-5">
              {PASSOS.map(([t, texto], i) => (
                <li key={t} className="lp-passo flex gap-4">
                  <span className="mt-1 font-mono text-sm text-linha">0{i + 1}</span>
                  <div>
                    <p className="font-display text-xl font-semibold">{t}</p>
                    <p className="mt-0.5 text-tinta-suave">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]" style={{ perspective: "1200px" }}>
            <div className="lp-manequim">
              <Manequim className="h-auto max-h-[80svh] w-full" />
            </div>
            <div className="lp-ajuste-cartao absolute top-[16%] -right-4 w-40 rounded-xl border border-tinta/10 bg-white p-4 shadow-lg sm:-right-16 sm:w-44">
              <p className="font-mono text-[10px] tracking-[0.12em] text-tinta-suave uppercase">Na prova</p>
              <p className="mt-1 font-display text-2xl leading-tight font-semibold text-linha">As partes fecham.</p>
              <p className="mt-1 text-xs text-tinta-suave">Sem cortar um centímetro de tecido.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. O que só o Alinhavo faz: molde e prova reais, em planos. */}
      <section data-cena="alongou" className="relative">
        <div className="mx-auto max-w-7xl px-5 pt-8 pb-24 sm:px-10 lg:pt-24 lg:pb-28">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className={rotulo}>O que só o Alinhavo faz</p>
              <h2 className={`${h2} mt-5`}>
                Alongou 4 cm na prova.
                <br />O molde já sabe.
              </h2>
            </div>
            <p className="max-w-lg text-lg leading-relaxed text-tinta-suave">
              Em outros programas, o ajuste feito no 3D tem que ser medido e redesenhado no molde à mão. Aqui o 2D e o 3D são o
              mesmo arquivo: mexeu na prova, nasce a versão nova do molde.
            </p>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-[1.35fr_1fr] md:gap-24 lg:gap-40">
            <figure data-speed="0.15" className="papel-milimetrado relative overflow-hidden rounded-2xl border border-tinta/10 bg-white">
              <Image src="/landing/molde-conjunto.png" width={898} height={768} alt="Molde real do conjunto no editor do Alinhavo: frente e costas do top e da calça, com margem de costura" className="w-full" />
              <figcaption className="absolute bottom-3 left-4 rounded-md bg-white/90 px-2 py-1 font-mono text-xs text-tinta-suave">
                Molde · v1 → <b className="text-linha">v2</b>
              </figcaption>
            </figure>
            <figure data-speed="-0.2" className="relative overflow-hidden rounded-2xl border border-tinta/10 bg-papel">
              <Image src="/landing/captura-1.jpg" width={900} height={1200} alt="Prova 3D real: o mesmo conjunto vestido no manequim, em jeans" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-3 left-4 rounded-md bg-white/90 px-2 py-1 font-mono text-xs text-tinta-suave">Prova 3D · M · jeans</figcaption>
              <div className="absolute top-4 right-4 w-44 rounded-xl border border-tinta/10 bg-white p-4 shadow-lg">
                <p className="font-mono text-[10px] tracking-[0.12em] text-tinta-suave uppercase">Ajuste na prova</p>
                <p className="mt-1 font-display text-3xl font-semibold text-linha">+4,0 cm</p>
                <p className="text-xs text-tinta-suave">na barra da calça</p>
                <p className="mt-3 rounded-lg bg-tinta py-2 text-center text-xs text-papel">Salvar versão 2</p>
              </div>
            </figure>

            {/* As duas linhas entre o molde e a prova (só em tela larga). */}
            <svg className="pointer-events-none absolute inset-y-0 left-[57%] hidden w-[12%] md:block lg:left-[54%] lg:w-[16%]" viewBox="0 0 200 600" preserveAspectRatio="none" aria-hidden="true">
              <g className="lp-sew-back">
                <path d="M190 190 C 140 120, 60 120, 10 190" fill="none" stroke="var(--costura)" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
              </g>
              <g className="lp-sew">
                <path d="M10 400 C 60 480, 140 480, 190 400" fill="none" stroke="var(--linha)" strokeWidth="4" strokeLinecap="round" strokeDasharray="16 12" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px]">
            <span className="text-linha">— — molde → prova: o mesmo arquivo veste o corpo</span>
            <span className="text-costura">- - - ajuste → molde v2: a mudança volta medida</span>
          </div>
        </div>
      </section>

      {/* 5. O varal dos módulos: anda de lado. */}
      <section data-cena="varal" className="relative overflow-x-clip bg-papel-escuro">
        <div className="lp-varal-palco relative flex flex-col justify-center py-24 lg:h-svh lg:py-0">
          <p
            className="lp-varal-fundo pointer-events-none absolute bottom-[6%] left-0 font-display text-[22vw] leading-none font-semibold tracking-[-0.04em] whitespace-nowrap text-tinta/[0.06] lg:text-[16vw]"
            aria-hidden="true"
          >
            molde · prova · coleção · encaixe · scan · vitrine
          </p>
          <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-10">
            <p className={rotulo}>Módulos</p>
            <h2 className={`${h2} mt-5`}>Do traço ao corte, no mesmo molde.</h2>
            <p className="mt-4 font-mono text-[13px] text-tinta-suave lg:hidden">Arraste para o lado →</p>
          </div>
          <div className="lp-varal-janela relative mt-8">
            <ul className="lp-trilho relative flex w-max gap-5 px-5 pt-12 pb-10 sm:px-10 lg:gap-10">
              <li className="lp-varal-linha" aria-hidden="true" />
              {MODULOS.map((m, i) => (
                <li key={m.nome} className={`lp-etiqueta ${m.cor}`}>
                  <span className="lp-prendedor" aria-hidden="true" />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-xs opacity-70">0{i + 1}</span>
                    {m.status && <span className="rounded-full border border-current/40 px-2.5 py-0.5 font-mono text-[11px] opacity-80">{m.status}</span>}
                  </div>
                  <h3 className="mt-6 font-display text-4xl font-semibold tracking-[-0.02em]">{m.nome}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed opacity-85">{m.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. A cliente aprova: entra na diagonal, sobre o azul giz. */}
      <section data-cena="aprovar" className="relative overflow-x-clip bg-costura text-papel">
        <div className="lp-grade-clara absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-10 lg:grid-cols-[1fr_auto_0.8fr] lg:py-32">
          <div>
            <p className="font-mono text-[12px] tracking-[0.14em] text-papel/70 uppercase">Aprovação por link</p>
            <h2 className={`${h2} mt-5`}>“Me manda como fica no corpo.”</h2>
            <span className="alinhavo alinhavo-fita mt-7 w-40" aria-hidden="true" />
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-papel/85">
              Você manda um link. A cliente vê a peça vestida de frente, costas e lado, e aprova ou pede ajuste do celular. Sem
              conta, sem app, sem PDF perdido no WhatsApp.
            </p>
            <ul className="mt-7 grid gap-2.5">
              {["O link vence em 7, 14 ou 30 dias", "Pedido de ajuste já chega escrito", "A resposta aparece no produto, para toda a equipe"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-fita" aria-hidden="true">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-[280px] sm:w-[330px]">
            {/* Fotos de trás: andam mais rápido que o celular. */}
            <Image data-speed="-0.7" src="/landing/captura-2.jpg" width={900} height={1200} alt="" aria-hidden="true" className="lp-foto-voo absolute top-[6%] -left-[44%] hidden w-[46%] -rotate-[9deg] sm:block" />
            <Image data-speed="-0.35" src="/landing/captura-3.jpg" width={900} height={1200} alt="" aria-hidden="true" className="lp-foto-voo absolute top-[52%] -right-[42%] hidden w-[42%] rotate-[8deg] sm:block" />
            <div className="lp-celular-voo relative">
              <div className="lp-flutua" style={flutua(6, -1.2)}>
                <Celular />
              </div>
            </div>
          </div>
          <div className="lp-painel-voo rounded-2xl bg-white p-5 text-tinta shadow-[0_30px_60px_-25px_rgb(0_0_0/0.5)] lg:max-w-xs">
            <p className="font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">No seu painel</p>
            <p className="mt-2 font-semibold">Aprovado</p>
            <p className="text-sm text-tinta-suave">Respondido por Ana em 14/11/2026.</p>
            <p className="mt-1.5 text-sm">“Ficou ótimo, pode cortar o piloto.”</p>
            <p className="mt-2.5 font-mono text-[11px] text-linha">status do produto → aprovado</p>
          </div>
        </div>
      </section>

      {/* 7. Encaixe e ficha: as peças caem no tecido. */}
      <section data-cena="encaixe" className="relative overflow-x-clip bg-tinta text-papel">
        <div className="lp-grade-clara absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[12px] tracking-[0.14em] text-papel/60 uppercase">Encaixe e ficha técnica</p>
              <h2 className={`${h2} mt-5`}>Saiba o consumo antes de comprar o tecido.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Risco automático", "As peças da grade se encaixam sozinhas na largura do tecido, respeitando o fio e o sentido."],
                ["Aproveitamento medido", "Cada risco mostra a porcentagem de tecido usada. Sem chute."],
                ["Ficha com consumo calculado", "Tecido por peça e aviamentos saem do molde e do risco, não de digitação."],
                ["Direto para o plotter", "Molde em DXF-AAMA, risco em DXF e PLT, PDF em escala real."],
              ].map(([t, texto], i) => (
                <div key={t} data-speed={String(-0.1 * (i % 2 ? 2 : 1))} className="rounded-2xl border border-papel/15 bg-papel/[0.06] p-6">
                  <p className="font-display text-xl font-semibold">{t}</p>
                  <p className="mt-2 text-[15px] text-papel/75">{texto}</p>
                </div>
              ))}
            </div>
          </div>
          <figure className="lp-risco mt-16">
            <RiscoEncaixe className="w-full" />
            <figcaption className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-papel/70">
              <span>
                Peças no risco: <span className="lp-contador rounded bg-fita px-1.5 py-0.5 font-semibold text-tinta">8</span> de 8
              </span>
              <span>Desenho ilustrativo. No app, o aproveitamento de cada risco é medido.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Calculadora */}
      <section id="calculadora" className="papel-milimetrado scroll-mt-4 border-y border-tinta/10">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-10 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className={rotulo}>Faça a conta com os seus números</p>
              <h2 className={`${h2} mt-5`}>
                Quanto custa <span className="lp-marca">um piloto a mais</span>?
              </h2>
            </div>
            <p className="max-w-lg text-[17px] leading-relaxed text-tinta-suave">
              Não prometemos porcentagem mágica. Você diz quantos pilotos corta e quantos a prova 3D evitaria; a conta aparece
              inteira, sem letra miúda.
            </p>
          </div>
          <div className="mt-12">
            <SavingsCalculator />
          </div>
          <p className="mt-6 font-mono text-xs text-tinta-suave">
            Os valores iniciais são exemplos e mudam com o que você digita. Nenhum é resultado medido em cliente.
          </p>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="scroll-mt-4 bg-papel-escuro">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-10 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className={rotulo}>Preço aberto</p>
              <h2 className={`${h2} mt-5`}>
                Sem orçamento, <span className="lp-marca">sem taxa de entrada</span>.
              </h2>
            </div>
            <p className="max-w-lg text-[17px] leading-relaxed text-tinta-suave">
              O preço vai ficar aqui, à vista, por usuário. Você assina direto na plataforma, sem falar com vendedor e sem
              treinamento obrigatório.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-tinta/10 bg-white p-7">
              <p className="font-display text-2xl font-semibold">Grátis</p>
              <p className="mt-1 text-tinta-suave">Para conhecer com um molde de verdade.</p>
              <p className="mt-6 font-display text-4xl font-semibold">R$ 0</p>
              <ul className="mt-6 grid gap-2 text-[15px]">
                <li>1 molde salvo, para sempre</li>
                <li>1 usuário</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-linha bg-white p-7 lg:-translate-y-3 lg:shadow-[0_24px_50px_-28px_rgb(196_58_38/0.6)]">
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-semibold">Modelista</p>
                <span className="rounded-full bg-linha px-2.5 py-0.5 font-mono text-[11px] text-white">15 dias grátis</span>
              </div>
              <p className="mt-1 text-tinta-suave">Para quem presta modelagem.</p>
              <p className="mt-6 font-display text-4xl font-semibold">Em breve</p>
              <ul className="mt-6 grid gap-2 text-[15px]">
                <li>Molde e Prova 3D</li>
                <li>Aprovação por link</li>
                <li>Preço por usuário</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-tinta/10 bg-white p-7">
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-semibold">Confecção</p>
                <span className="rounded-full border border-tinta/25 px-2.5 py-0.5 font-mono text-[11px] text-tinta-suave">15 dias grátis</span>
              </div>
              <p className="mt-1 text-tinta-suave">Para a equipe, do desenvolvimento ao corte.</p>
              <p className="mt-6 font-display text-4xl font-semibold">Em breve</p>
              <ul className="mt-6 grid gap-2 text-[15px]">
                <li>Tudo do Modelista</li>
                <li>Coleção, ficha técnica e comentários</li>
                <li>Encaixe e fila de riscos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section id="perguntas" className="scroll-mt-4">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className={rotulo}>Perguntas</p>
            <h2 className={`${h2} mt-5`}>O que a gente mais escuta.</h2>
          </div>
          <div className="divide-y divide-tinta/15 border-y border-tinta/15">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                  {q.p}
                  <span className="font-mono text-linha transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-tinta-suave">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Fecho no vermelho da linha. */}
      <section data-cena="fecho" className="relative overflow-x-clip bg-linha text-papel">
        <div data-speed="0.35" className="pointer-events-none absolute top-10 right-[5%] hidden w-56 md:block" aria-hidden="true">
          <div className="lp-flutua" style={flutua(6, 6)}>
            <Tesoura className="w-full rotate-[20deg]" />
          </div>
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-10 px-5 py-24 sm:px-10 md:flex-row md:items-center lg:py-32">
          <div data-speed="-0.15" className="relative rounded-md border-2 border-dashed border-papel/70 p-8 pr-14">
            <BrandSymbol className="size-16" pieces="var(--papel)" stitch="var(--tinta)" />
            <p className="mt-6 font-display text-5xl leading-none font-semibold tracking-[-0.03em] sm:text-6xl">Prove antes de cortar.</p>
            <p className="mt-4 text-papel/90">Comece com um molde de exemplo, sem criar conta.</p>
          </div>
          <div className="flex flex-col gap-3 md:ml-auto">
            <Link href="/experimentar" className="rounded-[10px] bg-tinta px-7 py-4 text-center font-medium text-papel hover:bg-black">
              Experimentar sem cadastro →
            </Link>
            <Link href="/entrar" className="rounded-[10px] border-[1.5px] border-papel/70 px-7 py-4 text-center hover:border-papel">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </section>
      <footer className="bg-tinta text-sm text-papel/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-5 py-8 sm:px-10">
          <BrandLogo light />
          <span className="ml-auto">Paulo Tecnologia em Vendas LTDA · Blumenau/SC</span>
        </div>
      </footer>
    </main>
  );
}
