"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * O movimento da página inicial (parallax e cenas presas à rolagem). Tudo o que está aqui parte do
 * estado final que o HTML já mostra: sem JavaScript, ou com "reduzir movimento" ligado no sistema,
 * a página aparece inteira e parada. No celular os planos andam menos e nada fica preso.
 *
 * Marcações no HTML:
 * - `data-cena="..."` numa seção: a cena (gatilho da rolagem).
 * - `data-speed="0.3"`: plano de parallax; positivo anda mais devagar que a página (fundo),
 *   negativo anda mais rápido (frente). `data-so="grande"`: só em tela larga.
 */
export function LandingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

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

        /* 3. O manequim: as partes do molde chegam de lados diferentes e o alinhavo fecha a costura. */
        const palco = '[data-cena="manequim"] .lp-palco';
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: grande
            ? { trigger: palco, start: "top top", end: "+=150%", pin: true, scrub: 0.6 }
            : { trigger: palco, start: "top 70%", end: "bottom 60%", scrub: 0.6 },
        });
        const passos = gsap.utils.toArray<HTMLElement>(`${palco} .lp-passo`);
        passos.forEach((p) => gsap.set(p, { opacity: 0.3 }));
        tl.to(passos[0] ?? {}, { opacity: 1, duration: 0.3 }, 0);
        const voos: Record<string, gsap.TweenVars> = {
          "frente-esq": { x: -420, y: -140, rotation: -28 },
          "frente-dir": { x: 440, y: -180, rotation: 24 },
          "saia-esq": { x: -400, y: 220, rotation: 18 },
          "saia-dir": { x: 420, y: 260, rotation: -22 },
        };
        Object.entries(voos).forEach(([id, v], i) => {
          tl.from(`${palco} [data-parte="${id}"]`, { ...v, opacity: 0, transformOrigin: "50% 50%", duration: 1 }, 0.1 + i * 0.3);
        });
        tl.to(passos[1] ?? {}, { opacity: 1, duration: 0.3 }, 1.3);
        tl.from(`${palco} .lp-piques`, { opacity: 0, duration: 0.3 }, 1.6);
        tl.fromTo(
          `${palco} .lp-costura-meio`,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "none" },
          1.8,
        );
        tl.to(passos[2] ?? {}, { opacity: 1, duration: 0.3 }, 1.9);
        tl.from(`${palco} .lp-ajuste-cartao`, { y: 50, opacity: 0, scale: 0.9, duration: 0.6 }, 2.6);
        tl.fromTo(`${palco} .lp-manequim`, { rotateY: -16 }, { rotateY: 8, duration: 3.4, ease: "none" }, 0);

        /* 4. O molde e a prova de verdade, em planos. */
        parallax("alongou");

        /* 5. O varal dos módulos anda de lado (no celular, a pessoa arrasta). */
        const trilho = document.querySelector<HTMLElement>(".lp-trilho");
        if (grande && trilho) {
          const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth);
          const tv = gsap.timeline({
            scrollTrigger: {
              trigger: '[data-cena="varal"] .lp-varal-palco',
              start: "top top",
              end: () => `+=${distancia()}`,
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
        }

        /* 6. A aprovação entra na diagonal; as fotos de trás correm mais que o celular. */
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

        /* 9. Fecho. */
        parallax("fecho");
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
