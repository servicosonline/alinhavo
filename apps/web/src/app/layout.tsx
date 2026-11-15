import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SOFT e WONK: o logo e os títulos usam a Fraunces macia (SOFT 100), ver marca/README.md.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const site = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  // As imagens de compartilhamento (opengraph-image.png, geradas por marca/compartilhar/gerar.sh) precisam
  // de endereço absoluto: o do site se estiver definido; senão o Next usa o da Vercel.
  ...(site ? { metadataBase: new URL(site) } : {}),
  title: "Alinhavo · prove antes de cortar",
  description:
    "Modelagem, prova virtual em 3D e encaixe para confecções, direto no navegador.",
  // App instalável no iPhone ("Adicionar à Tela de Início"); o resto vem de app/manifest.ts.
  appleWebApp: { capable: true, title: "Alinhavo", statusBarStyle: "default" },
  openGraph: {
    title: "Alinhavo · prove antes de cortar",
    description: "Desenhe o molde, vista no corpo em 3D e veja onde aperta. Tudo no navegador.",
    siteName: "Alinhavo",
    locale: "pt_BR",
    type: "website",
  },
};

/** Cor da barra do navegador e da janela do app instalado: o papel da marca. */
export const viewport: Viewport = { themeColor: "#f5efe3" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: a página inicial marca o <html> antes de pintar (carregamento só na 1ª visita).
    <html
      suppressHydrationWarning
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
