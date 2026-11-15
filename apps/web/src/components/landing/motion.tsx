"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * O movimento da página inicial (parallax e cenas presas à rolagem). Tudo o que está aqui parte do
 * estado final que o HTML já mostra: sem JavaScript, ou com "reduzir movimento" ligado no sistema,
 * a página aparece inteira e parada. No celular as cenas também ficam presas, com distâncias menores.
 *
 * Marcações no HTML:
 * - `data-cena="..."` numa seção: a cena (gatilho da rolagem).
 * - `data-speed="0.3"`: plano de parallax; positivo anda mais devagar que a página (fundo),
 *   negativo anda mais rápido (frente). `data-so="grande"`: só em tela larga.
 *
 * Duas passagens de seção "cobrem" a anterior presa: a seção de baixo sobe uma tela inteira
 * (margem negativa de `innerHeight`) e entra por cima da cena presa. Na horizontal ("Alongou"),
 * um deslocamento em Y anula a subida e ela só anda de lado; na diagonal (aprovação), ela sobe
 * e anda de lado ao mesmo tempo.
 */

/** A seção sobe uma tela para entrar por cima da anterior (recalculado a cada refresh). */
function cobrir(el: HTMLElement) {
  const ajusta = () => gsap.set(el, { marginTop: -window.innerHeight });
  ajusta();
  ScrollTrigger.addEventListener("refreshInit", ajusta);
  return () => {
    ScrollTrigger.removeEventListener("refreshInit", ajusta);
    gsap.set(el, { clearProps: "marginTop" });
  };
}

/** Abre e fecha a tesoura `vezes` vezes a partir de `inicio`, ao longo de `duracao` da linha do tempo. */
function picotar(tl: gsap.core.Timeline, tesoura: string, inicio: number, duracao: number, vezes: number) {
  const cada = duracao / (vezes * 2);
  tl.to(`${tesoura} .lp-lamina-a`, { rotation: -16, svgOrigin: "100 60", duration: cada, repeat: vezes * 2 - 1, yoyo: true, ease: "sine.inOut" }, inicio);
  tl.to(`${tesoura} .lp-lamina-b`, { rotation: 16, svgOrigin: "100 60", duration: cada, repeat: vezes * 2 - 1, yoyo: true, ease: "sine.inOut" }, inicio);
}

export function LandingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // A barra de endereço do celular muda a altura da tela ao rolar: sem isto as cenas presas pulam.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // A fita métrica do topo mostra quanto já foi lido: não é enfeite, vale sempre.
    const progresso = gsap.to(".lp-progresso", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });

    const mm = gsap.matchMedia();
    mm.add(
      {
        grande: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        pequeno: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const grande = Boolean(ctx.conditions?.grande);
        const fator = grande ? 1 : 0.45;
        const limpezas: (() => void)[] = [];

        // As margens das seções que cobrem vêm antes de qualquer gatilho: mudam onde tudo fica.
        const alongou = document.querySelector<HTMLElement>('[data-cena="alongou"]');
        const aprovar = document.querySelector<HTMLElement>('[data-cena="aprovar"]');
        if (alongou) limpezas.push(cobrir(alongou));
        if (aprovar) limpezas.push(cobrir(aprovar));

        // O palco do varal ocupa a tela inteira (no celular também), para a aprovação entrar por cima dele.
        const varalPalco = document.querySelector<HTMLElement>('[data-cena="varal"] .lp-varal-palco');
        const janela = document.querySelector<HTMLElement>(".lp-varal-janela");
        if (varalPalco) {
          const altura = () => gsap.set(varalPalco, { minHeight: window.innerHeight });
          altura();
          ScrollTrigger.addEventListener("refreshInit", altura);
          limpezas.push(() => {
            ScrollTrigger.removeEventListener("refreshInit", altura);
            gsap.set(varalPalco, { clearProps: "minHeight" });
          });
        }
        // Com movimento, o varal anda com a rolagem também no celular (sem arrastar).
        if (janela) gsap.set(janela, { overflow: "visible", scrollSnapType: "none" });

        // Os gatilhos são criados na ordem da página: os de baixo contam com o espaço das cenas presas.
        const parallax = (cena: string) => {
          const raiz = document.querySelector<HTMLElement>(`[data-cena="${cena}"]`);
          if (!raiz) return;
          const topo = cena === "abertura";
          raiz.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
            if (!grande && el.dataset.so === "grande") return;
            const v = Number(el.dataset.speed ?? 0) * fator * 160;
            gsap.fromTo(
              el,
              { y: topo ? 0 : -v },
              {
                y: topo ? v * 2 : v,
                ease: "none",
                scrollTrigger: { trigger: raiz, start: topo ? "top top" : "top bottom", end: "bottom top", scrub: true },
              },
            );
          });
        };

        /* 1. Abertura: mesa do ateliê em planos. */
        parallax("abertura");

        /* 1b. A tesoura do hero desce até a divisa e corta a borda da seção escura, da direita para a esquerda. */
        const tesoura = document.querySelector<HTMLElement>(".lp-tesoura-heroi");
        const problema = document.querySelector<HTMLElement>('[data-cena="problema"]');
        const reto = document.querySelector<HTMLElement>(".lp-picote-reto");
        if (tesoura && problema && reto) {
          // Medidas pelo centro (o giro muda a caixa, não o centro) e sem o deslocamento que a animação já aplicou.
          const medida = () => {
            const t = tesoura.getBoundingClientRect();
            const p = problema.getBoundingClientRect();
            const w = tesoura.offsetWidth;
            const cx = t.left + t.width / 2 - Number(gsap.getProperty(tesoura, "x"));
            const cy = t.top + t.height / 2 - Number(gsap.getProperty(tesoura, "y"));
            const ponta = cx - w / 2 - p.left; // virada (180°), a ponta fica na borda esquerda
            return { desce: p.top - cy, anda: -(cx + w / 2 - p.left) - 8, ponta, largura: p.width, w };
          };
          gsap.set(reto, { clipPath: "inset(0 0px 0 0)" });
          const tc = gsap.timeline({
            scrollTrigger: {
              trigger: '[data-cena="abertura"]',
              start: "top top",
              endTrigger: problema,
              end: grande ? "top 35%" : "top 45%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
          tc.set(reto, { clipPath: "inset(0 0px 0 0)" }, 0);
          // A tesoura tem -12° no desenho: 192° deixa as lâminas deitadas, apontando para a esquerda.
          tc.to(tesoura, { y: () => medida().desce, rotation: 192, duration: 1, ease: "power1.inOut" }, 0);
          tc.to(tesoura, { x: () => medida().anda, duration: 1.6, ease: "none" }, 1);
          tc.fromTo(
            reto,
            { clipPath: () => `inset(0 ${Math.max(0, medida().largura - medida().ponta)}px 0 0)` },
            { clipPath: () => `inset(0 ${medida().largura + medida().w}px 0 0)`, duration: 1.6, ease: "none", immediateRender: false },
            1,
          );
          picotar(tc, ".lp-tesoura-heroi", 1, 1.6, grande ? 7 : 5);
        }

        /* 2. O problema: a palavra gigante de jeans cresce e o tecido corre por dentro. */
        gsap.fromTo(
          ".lp-gigante",
          { scale: grande ? 0.84 : 0.92, backgroundPosition: "0% 50%" },
          {
            scale: grande ? 1.12 : 1.04,
            backgroundPosition: "100% 50%",
            ease: "none",
            scrollTrigger: { trigger: '[data-cena="problema"]', start: "top bottom", end: "bottom top", scrub: true },
          },
        );
        parallax("problema");

        /* 3. O manequim: as partes do molde chegam de lados diferentes e o alinhavo fecha a costura.
              Em tela larga a cena fica presa; no celular ela acompanha a rolagem e termina antes da passagem. */
        const palcoSel = '[data-cena="manequim"] .lp-palco';
        const palco = document.querySelector<HTMLElement>(palcoSel);
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: grande
            ? { trigger: palcoSel, start: "top top", end: () => `+=${window.innerHeight * 2.5}`, pin: true, scrub: 0.6, invalidateOnRefresh: true }
            : { trigger: palcoSel, start: "top 70%", end: "bottom bottom", scrub: 0.6 },
        });
        const passos = gsap.utils.toArray<HTMLElement>(`${palcoSel} .lp-passo`);
        passos.forEach((p) => gsap.set(p, { opacity: 0.3 }));
        tl.to(passos[0] ?? {}, { opacity: 1, duration: 0.3 }, 0);
        const voos: Record<string, gsap.TweenVars> = {
          "frente-esq": { x: grande ? -420 : -160, y: -140, rotation: -28 },
          "frente-dir": { x: grande ? 440 : 170, y: -180, rotation: 24 },
          "saia-esq": { x: grande ? -400 : -150, y: 220, rotation: 18 },
          "saia-dir": { x: grande ? 420 : 160, y: 260, rotation: -22 },
        };
        Object.entries(voos).forEach(([id, v], i) => {
          tl.from(`${palcoSel} [data-parte="${id}"]`, { ...v, opacity: 0, transformOrigin: "50% 50%", duration: 1 }, 0.1 + i * 0.3);
        });
        tl.to(passos[1] ?? {}, { opacity: 1, duration: 0.3 }, 1.3);
        tl.from(`${palcoSel} .lp-piques`, { opacity: 0, duration: 0.3 }, 1.6);
        tl.fromTo(
          `${palcoSel} .lp-costura-meio`,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "none" },
          1.8,
        );
        tl.to(passos[2] ?? {}, { opacity: 1, duration: 0.3 }, 1.9);
        tl.from(`${palcoSel} .lp-ajuste-cartao`, { y: 50, opacity: 0, scale: 0.9, duration: 0.6 }, 2.6);
        tl.fromTo(`${palcoSel} .lp-manequim`, { rotateY: -16 }, { rotateY: 8, duration: 3.4, ease: "none" }, 0);

        /* 3b. Passagem horizontal: a seção "Alongou" entra da direita por cima do manequim preso.
               Em tela larga, na mesma cena presa (a última tela de rolagem das 2,5); no celular, o palco
               fica preso pela base enquanto ela entra. */
        if (alongou && palco) {
          const entra = { xPercent: 0, y: 0, ease: "none" };
          const sai = { xPercent: 100, y: () => -window.innerHeight };
          if (grande) {
            const animado = tl.duration();
            const passagem = animado / 1.5; // 1 tela de rolagem, contra 1,5 da costura
            tl.fromTo(alongou, sai, { ...entra, duration: passagem }, animado);
            tl.to(palco.children, { xPercent: -18, opacity: 0.4, ease: "none", duration: passagem }, animado);
          } else {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: palco,
                  start: "bottom bottom",
                  end: () => `+=${window.innerHeight}`,
                  pin: true,
                  scrub: 0.4,
                  invalidateOnRefresh: true,
                },
              })
              .fromTo(alongou, sai, { ...entra, duration: 1 }, 0)
              .to(palco.children, { xPercent: -18, opacity: 0.4, ease: "none", duration: 1 }, 0);
          }
        }

        /* 4. O molde e a prova de verdade, em planos. */
        parallax("alongou");

        /* 5. O varal dos módulos anda de lado com a rolagem; no fim, a aprovação entra na diagonal por cima dele. */
        const trilho = document.querySelector<HTMLElement>(".lp-trilho");
        if (trilho && varalPalco) {
          const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth);
          const passagem = window.innerHeight / Math.max(1, distancia()); // na escala do trilho (duração 1)
          const tv = gsap.timeline({
            scrollTrigger: {
              trigger: varalPalco,
              start: "top top",
              end: () => `+=${distancia() + window.innerHeight}`,
              pin: true,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
          tv.to(trilho, { x: () => -distancia(), ease: "none", duration: 1 }, 0);
          tv.to(".lp-varal-fundo", { x: () => -distancia() * 0.45, ease: "none", duration: 1 }, 0);
          gsap.utils.toArray<HTMLElement>(".lp-etiqueta").forEach((el, i) => {
            const lado = i % 2 ? 1 : -1;
            tv.fromTo(el, { rotation: 6 * lado }, { rotation: -6 * lado, ease: "sine.inOut", duration: 1 }, 0);
          });
          if (aprovar) {
            // Sem compensar a subida: ela sobe e anda para a esquerda ao mesmo tempo (diagonal), com a borda inclinada.
            tv.fromTo(
              aprovar,
              { xPercent: 100, clipPath: "polygon(22% 0%, 100% 0%, 100% 100%, 0% 100%)" },
              { xPercent: 0, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", ease: "none", duration: passagem },
              1,
            );
            tv.to(varalPalco.children, { opacity: 0.5, ease: "none", duration: passagem }, 1);
          }
        }

        /* 6. A aprovação: as fotos de trás correm mais que o celular. */
        const ap = '[data-cena="aprovar"]';
        gsap.from(`${ap} .lp-celular-voo`, {
          x: grande ? -180 : -40,
          y: grande ? 220 : 90,
          rotation: -10,
          ease: "none",
          scrollTrigger: { trigger: ap, start: "top bottom", end: "center center", scrub: true },
        });
        gsap.from(`${ap} .lp-painel-voo`, {
          x: grande ? 240 : 40,
          y: grande ? -160 : 40,
          rotation: 8,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ap, start: "top 65%", end: "center 45%", scrub: true },
        });
        parallax("aprovar");

        /* 7. O encaixe: as peças caem de alturas diferentes e se encaixam no tecido. */
        const en = '[data-cena="encaixe"]';
        const contador = document.querySelector<HTMLElement>(`${en} .lp-contador`);
        const pecas = gsap.utils.toArray<SVGGElement>(`${en} [data-peca]`);
        const te = gsap.timeline({
          scrollTrigger: { trigger: `${en} .lp-risco`, start: "top 90%", end: "bottom 55%", scrub: 0.5 },
        });
        pecas.forEach((p, i) => {
          const lado = i % 2 ? 1 : -1;
          te.from(
            p,
            { y: -260 - (i % 3) * 90, x: 40 * lado, rotation: lado * (10 + i * 3), opacity: 0, transformOrigin: "50% 50%", duration: 1, ease: "power2.in" },
            i * 0.2,
          );
        });
        if (contador) {
          const n = { v: 0 };
          contador.textContent = "0";
          te.to(n, { v: pecas.length, duration: te.duration(), ease: "none", onUpdate: () => (contador.textContent = String(Math.floor(n.v))) }, 0);
        }
        parallax("encaixe");

        /* 8. Marca-texto amarelo que passa sobre a frase. */
        gsap.utils.toArray<HTMLElement>(".lp-marca").forEach((el) => {
          gsap.fromTo(
            el,
            { backgroundSize: "0% 100%" },
            { backgroundSize: "100% 100%", ease: "none", scrollTrigger: { trigger: el, start: "top 88%", end: "top 60%", scrub: true } },
          );
        });

        /* 9. Fecho: a tesoura chega e corta a palavra "cortar" ao meio; a metade de baixo cai um pouco. */
        parallax("fecho");
        const cortar = document.querySelector<HTMLElement>(".lp-cortar");
        if (cortar) {
          gsap.set(".lp-cortar-texto", { opacity: 0 });
          gsap.set([".lp-cortar-cima", ".lp-cortar-baixo", ".lp-cortar-risco"], { opacity: 1 });
          const tes = ".lp-cortar-tesoura";
          const larguraTesoura = () => document.querySelector<HTMLElement>(tes)?.offsetWidth ?? 60;
          const tf = gsap.timeline({
            // O fecho está no fim da página: a palavra nunca sobe muito. O corte termina quando a rolagem acaba.
            scrollTrigger: {
              trigger: cortar,
              start: "top bottom",
              end: () => ScrollTrigger.maxScroll(window) - 2,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
          tf.fromTo(
            tes,
            { opacity: 0, x: () => cortar.offsetWidth * 0.5, y: () => -cortar.offsetHeight * 1.6, rotation: 120 },
            { opacity: 1, x: 0, y: 0, rotation: 180, duration: 0.7, ease: "power2.out" },
            0,
          );
          tf.fromTo(".lp-cortar-risco", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "none" }, 0.7);
          tf.to(tes, { x: () => -(cortar.offsetWidth + larguraTesoura()), duration: 1.2, ease: "none" }, 0.7);
          picotar(tf, tes, 0.7, 1.2, 5);
          tf.to(".lp-cortar-baixo", { y: () => cortar.offsetHeight * 0.14, rotation: 4, transformOrigin: "0% 50%", duration: 0.9, ease: "power2.in" }, 1.1);
          tf.to(".lp-cortar-risco", { opacity: 0.35, duration: 0.3 }, 1.9);
          tf.to(tes, { opacity: 0, duration: 0.3 }, 1.9);
        }

        return () => limpezas.forEach((f) => f());
      },
    );

    return () => {
      mm.revert();
      progresso.scrollTrigger?.kill();
      progresso.kill();
    };
  }, []);

  return null;
}
