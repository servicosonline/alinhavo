/**
 * Onde fica o caminho para instalar o app no iPhone e no iPad. A Apple não deixa um site abrir o
 * "Adicionar à Tela de Início": o máximo é apontar para o botão certo de cada navegador.
 *
 * - `safari-iphone`: Safari no iPhone, Compartilhar na barra de baixo (no iOS 26, dentro do "⋯").
 * - `top`: Safari no iPad e Chrome, Edge ou Firefox no iPhone, Compartilhar na barra de cima.
 * - `in-app`: navegador dentro de outro app (Instagram, Facebook…), que não instala: abrir no Safari.
 */
export type IosInstallPlace = "safari-iphone" | "top" | "in-app";

export function iosInstallPlace(userAgent: string, maxTouchPoints = 0, platform = ""): IosInstallPlace {
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|LinkedInApp/i.test(userAgent)) return "in-app";
  const ipad = /iPad/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
  if (ipad) return "top";
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)) return "top";
  return "safari-iphone";
}
