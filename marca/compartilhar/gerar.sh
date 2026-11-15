#!/usr/bin/env bash
# Gera as imagens de compartilhamento (Open Graph, 1200 x 630) direto nas rotas do app (Chrome headless, sem servidor).
cd "$(dirname "$0")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
APP="../../apps/web/src/app"
gera() { # id destino
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1200,630 --virtual-time-budget=6000 \
    --screenshot="$(cygpath -w "$PWD/$2")" "file:///$(cygpath -m "$PWD/cartoes.html")#$1" >/dev/null 2>&1
  echo "$2"
}
gera c1 "$APP/opengraph-image.png"
gera c2 "$APP/aprovar/[token]/opengraph-image.png"
