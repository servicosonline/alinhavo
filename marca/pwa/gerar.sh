#!/usr/bin/env bash
# Gera os ícones do app instalável (apps/web/public/pwa) a partir de apps/web/src/app/icon.svg
# (Chrome headless, sem servidor). Rode de novo se o ícone do site mudar.
cd "$(dirname "$0")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
OUT="../../apps/web/public/pwa"
mkdir -p "$OUT"
# A janela fica sempre em 512 (o Chrome headless não abre janela menor que ~500 px) e a escala da tela
# dá o tamanho final: 192 = 512 × 0,375.
gera() { # modo tamanho destino
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor="$(awk "BEGIN{print $2/512}")" \
    --default-background-color=00000000 --window-size=512,512 --virtual-time-budget=3000 \
    --screenshot="$(cygpath -w "$PWD/$OUT/$3")" "file:///$(cygpath -m "$PWD/icone.html")#$1" >/dev/null 2>&1
  echo "$OUT/$3"
}
gera normal 192 icon-192.png
gera normal 512 icon-512.png
gera maskable 192 maskable-192.png
gera maskable 512 maskable-512.png
