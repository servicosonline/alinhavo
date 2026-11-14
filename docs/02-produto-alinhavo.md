# 02 · Produto Alinhavo

## Para quem

- **Modelista**: constrói, gradua e testa moldes.
- **Estilista**: cria, monta looks, escolhe tecidos.
- **Gestor de produto/PCP**: acompanha a coleção, prazos e consumo de tecido.
- **Cliente da confecção** (quem terceiriza desenvolvimento): recebe link de aprovação.

Público inicial: confecções pequenas e médias e prestadores de modelagem, que hoje pagam caro por licença desktop ou trabalham no papel.

## Os seis módulos

Cada módulo do Audaces tem um correspondente, com nome próprio. Máquinas ficam de fora; no lugar delas entram exportações.

| Alinhavo | Equivale a | Resumo |
|---|---|---|
| **Coleção** | Isa PLM + ERP | Coleções, produtos, cronograma, ficha técnica, aprovações |
| **Molde** | Moldes | CAD 2D: construção, gradação, margem de costura, exportação |
| **Prova** | 3D | Manequim por tabela, simulação, mapa de pressão, tecido, poses, look, 360° |
| **Encaixe** | Encaixe + Supera | Encaixe automático, fila de encaixes, consumo por grade |
| **Scan** | Digiflash | Molde de papel → digital usando foto do celular |
| **Vitrine (IA)** | LooksMaker + Clickfy | Desenho técnico e texto da ficha por IA; fotos de catálogo depois |

### Coleção
- Coleções com cronograma (etapas, prazos, responsáveis) e alerta de atraso.
- Produto com status (ideia → modelagem → prova → aprovado → produção).
- Ficha técnica gerada a partir dos dados do molde, do tecido e dos aviamentos (consumo calculado, não digitado).
- Comentários e aprovação por link público com expiração (cliente não precisa de conta).
- Atualização em tempo real (Supabase Realtime) para toda a equipe.
- API e webhooks para ERP (produto aprovado, consumo, ordem de corte).

### Molde
- Editor 2D no navegador: pontos, retas, curvas Bézier, piques, fio, furos, textos.
- Tabela de medidas e grade de tamanhos por cliente.
- Gradação por regras nos pontos (deslocamento x/y por tamanho), com prévia da grade empilhada.
- Margem de costura automática com cantos configuráveis (Clipper2).
- Medição de costuras (conferir se as duas partes da costura têm o mesmo comprimento).
- Histórico de versões do molde.
- Exportação DXF-AAMA (padrão da indústria para plotter e corte), PDF em escala A4/A0 para impressão caseira, SVG.

### Prova (o coração do produto)
Segue o fluxo do vídeo, com uma melhoria central: **o ajuste feito na prova altera o molde de verdade**.
- Manequim paramétrico gerado das medidas da tabela; um por tamanho ou por cliente.
- Posicionamento das partes em pontos de encaixe do corpo (frente, costas, manga…).
- Costuras ligadas às do molde (definidas uma vez no Molde).
- Simulação de tecido em GPU (XPBD) com colisão contra o corpo.
- **Mapa de pressão** (tensão por triângulo, colorida do azul ao vermelho) e **mapa de folga** (distância ao corpo).
- Tecido em duas camadas: física (densidade, elasticidade nos dois sentidos e no viés, flexão, espessura, atrito) e visual (texturas PBR). Biblioteca com presets e acervo próprio.
- Pose inicial e pose final, com biblioteca de poses (em pé, passada, braço dobrado, sentado).
- **Ajuste bidirecional**: alongar 4 cm a barra ou encurtar 3 cm a alça na Prova gera uma alteração no molde 2D, que vira nova versão.
- Prova da grade inteira lado a lado.
- Look completo com várias peças e camadas.
- Acabamentos visuais: pesponto, zíper, estampa, etiqueta (decalques sobre a malha).
- Captura em vários ângulos e vídeo de giro 360° gerado no navegador; link de aprovação.

### Encaixe
- Encaixe automático das peças da grade numa largura de tecido, respeitando fio, rotação permitida e espelhamento.
- Prioridade por demanda (quantidade por tamanho).
- Aproveitamento (%) e consumo por peça, que alimentam a ficha técnica.
- Fila de encaixes: vários pedidos processados em segundo plano.
- Exportação DXF-AAMA e HPGL/PLT para plotter e cortadora.

### Scan
- Imprime-se uma folha (ou faixa) com marcadores ArUco; coloca-se o molde de papel sobre fundo contrastante e tira-se a foto.
- O app corrige perspectiva e escala, detecta o contorno e propõe piques e cantos.
- O modelista revisa e salva como molde editável.

### Vitrine (IA, depois do MVP)
- Texto da ficha técnica e descrição de produto gerados por um modelo de linguagem (ex.: Claude) a partir dos dados do produto.
- Desenho técnico plano gerado a partir do molde (vetorial, sem IA) e refinado.
- Fotos de catálogo com modelo gerado por IA, usando renderização da Prova como base (provedor de imagem a definir).

## O que entra no MVP

O MVP prova a tese "molde e prova no navegador, editando o mesmo arquivo":

| Entra | Fica para depois |
|---|---|
| Login, organização, convites | Scan |
| Coleção básica (lista, status, ficha simples) | Cronograma com alertas |
| Molde: editor, tabela de medidas, gradação, margem, DXF/PDF | Acabamentos 3D |
| Prova: manequim por medidas, costura, simulação, mapa de pressão, 3 tecidos, 2 poses | Look com várias camadas |
| Ajuste na Prova → nova versão do molde | Encaixe e fila de encaixes |
| Captura de imagem e link de aprovação | IA, ERP, vídeo 360° |
