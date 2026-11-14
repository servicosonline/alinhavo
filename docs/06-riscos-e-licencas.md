# 06 · Riscos e licenças

## Riscos técnicos

| Risco | Impacto | Como reduzir |
|---|---|---|
| Simulação de tecido instável ou lenta | Alto: é o coração do produto | Começar a Fase 2 por uma prova de conceito isolada (um retângulo caindo sobre uma esfera, depois uma saia); medir fps em máquina modesta antes de construir a interface |
| WebGPU ausente em parte das máquinas | Médio | Fallback em WASM com malha mais grossa; aviso de desempenho |
| Precisão do DXF-AAMA | Alto: erro vira tecido perdido | Testes com arquivos de referência; validar em plotter real com um parceiro antes de vender |
| Realismo do caimento comparado ao físico | Médio | Calibrar presets com amostras reais (teste de caimento/drapeado) e deixar claro que é aproximação |
| Escopo enorme | Alto | MVP fechado na Fase 2; nada de Encaixe, Scan ou IA antes de validar a Prova com modelistas |

## Licenças e propriedade intelectual

- **Não copiar a marca, nomes de módulos, telas, ícones nem textos da Audaces.** Funcionalidade não é protegida; identidade visual e código são. O Alinhavo tem nome, fluxo e interface próprios.
- **Nome "Alinhavo":** antes de investir em marca, pesquisar no INPI (classes 9 e 42) e conferir domínio e redes sociais.
- **Corpo 3D:** não usar SMPL/SMPL-X (licença não comercial). Usar base com licença comercial livre, como os modelos do MakeHuman (saídas em CC0), e documentar a origem.
- **Encaixe:** Deepnest e SVGnest são referências úteis para estudo, mas o Deepnest é GPL; não copiar código. Implementar o próprio motor usando Clipper2 (licença Boost, permissiva) para as operações de polígono.
- **OpenCV.js:** Apache 2.0, uso comercial permitido.
- **Texturas e presets de tecido:** só de fontes com licença comercial (ex.: CC0) ou produzidas por nós.
- **IA:** conferir os termos de uso comercial do provedor de imagem escolhido antes da Fase 6.

## Riscos de negócio

- **Concorrência estabelecida** (Audaces no Brasil; CLO3D, Browzwear, Optitex e Gerber lá fora). Diferencial do Alinhavo: navegador, preço acessível, colaboração com o cliente por link, ajuste 3D que volta ao molde.
- **Confiança do modelista**: o profissional precisa ver o molde exportado bater com o papel. Programa piloto com 3 a 5 modelistas na Fase 1.
