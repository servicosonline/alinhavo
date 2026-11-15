#!/usr/bin/env bash
# Gera uma PNG por prancha do manual (Chrome headless, sem servidor).
cd "$(dirname "$0")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
NOMES=(capa plataforma icp tendencias logo logo-usos cores tipografia grafismos voz social produto papelaria)
for i in "${!NOMES[@]}"; do
  n=$((i+1)); f=$(printf "imagens/%02d-%s.png" "$n" "${NOMES[$i]}")
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1600,1000 --virtual-time-budget=6000 \
    --screenshot="$(cygpath -w "$PWD/$f")" "file:///$(cygpath -m "$PWD/manual.html")#$n" >/dev/null 2>&1
  echo "$f"
done
