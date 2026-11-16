import type { MetadataRoute } from "next";

/**
 * App instalável (PWA): com este manifesto o Chrome e o Edge oferecem "Instalar" no computador e no Android,
 * e o iPhone usa os dados ao "Adicionar à Tela de Início". Sem service worker por enquanto: o Chrome instala
 * sem ele, e um cache mal feito poderia mostrar dados velhos de quem está logado.
 * Ícones gerados por marca/pwa/gerar.sh.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/painel",
    name: "Alinhavo · prove antes de cortar",
    short_name: "Alinhavo",
    description: "Modelagem, prova virtual em 3D e encaixe para confecções.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#f5efe3",
    theme_color: "#f5efe3",
    categories: ["business", "productivity"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
