# Alinhavo · Manual de marca (v1, 14/11/2026)

> **Prove antes de cortar.**

As imagens estão em `imagens/` (13 pranchas, 1600 × 1000), os logos em `logo/` e o manual visual em `manual.html` (abre com dois cliques). Para gerar as imagens de novo depois de mexer no HTML: `bash gerar-imagens.sh`.

Esta identidade parte da semente que já estava no app (papel, tinta, linha vermelha, Fraunces e o mote "Prove antes de cortar") e transforma isso num sistema completo.

---

## 1. Plataforma

**Propósito.** Devolver ao ofício da modelagem o tempo e o tecido que o retrabalho rouba.

**Posicionamento.** Para modelistas autônomos e confecções pequenas e médias que ainda trabalham no papel ou pagam caro por licença desktop, o Alinhavo é o ateliê de desenvolvimento no navegador: molde, prova 3D e encaixe no mesmo arquivo. O ajuste feito na prova volta ao molde de verdade. Preço aberto, sem instalação, sem taxa de entrada.

**Promessa.** Prove antes de cortar.

**Pilares**
| Pilar | O que quer dizer | Prova |
|---|---|---|
| Do ofício | Fala a língua da mesa de corte | pique, fio, gradação, piloto, risco na interface |
| Um molde só | 2D e 3D editam o mesmo arquivo | ajuste da Prova gera nova versão do molde |
| Aberto | Sem barreira para começar | preço no site, navegador, aprovação por link sem conta |
| Medido | Número no lugar de adjetivo | cm com vírgula, consumo por grade, aproveitamento do risco |

**Personalidade.** A mestre-modelista que virou nerd de tecnologia. Arquétipo: Criadora + Sábia.
- precisa, **não** fria
- moderna, **não** "startup"
- acessível, **não** barata
- artesanal, **não** rústica

## 2. Para quem falamos (ICP)

Perfis tirados de `docs/02-produto-alinhavo.md` e da estratégia comercial do painel. **São hipóteses de trabalho** até as entrevistas com uma modelista e uma confecção de verdade.

1. **A modelista autônoma (porta de entrada).** Presta modelagem para várias marcas, trabalha no papel ou num CAD antigo, manda foto do piloto pelo WhatsApp. Dor: piloto refeito, cliente que aprova tarde. Gatilho: "Mais um piloto?". Pacote: Modelista.
2. **A confecção pequena e média (conta que cresce).** Dono ou PCP que acompanha coleção, prazo e consumo. Dor: tecido desperdiçado, coleção atrasada, ficha técnica digitada à mão. Gatilho: "Quanto tecido isso gasta?". Pacote: Confecção.
3. **A estilista / marca cliente (quem espalha).** Não usa o software, recebe o link de aprovação. Dor: aprovar sem ver a peça vestida. Gatilho: "Me manda como fica no corpo." Todo link de aprovação é uma vitrine do Alinhavo, então a página `/aprovar` precisa ser a peça mais bem-acabada da marca.

## 3. Tendências e território

O que muda em marca B2B em 2026 e como o Alinhavo responde:
- **Cansaço do genérico e da estética de IA** → materiais reais do ofício (papel de molde, giz, linha) e voz de oficina.
- **Marca como sistema** → as cores e fontes deste manual são os tokens do app (`apps/web/src/app/globals.css`).
- **Tipografia como identidade** → uma serifa macia (Fraunces) num setor de visual técnico.
- **Cor de marca separada da cor funcional** → o mapa de pressão (azul → vermelho) é só da Prova.
- **Ativos distintivos e prova** → o alinhavo e o pique sempre iguais; preço aberto e número medido.

**Território.** Leitura qualitativa: os softwares de modelagem tendem ao visual de engenharia e ao modelo fechado (orçamento, instalação, onboarding). O Alinhavo ocupa o quadrante livre: **calor de ateliê + modelo aberto**.

## 4. Logotipo

**Símbolo.** Uma peça cortada em duas partes do molde por uma costura curva (a cava). No meio, o **alinhavo** vermelho, o ponto provisório que une as partes para provar antes da costura definitiva. Dos dois lados, **dois piques** que casam, como no molde de verdade; juntos lembram um brilho, o momento em que a peça fecha.

**Nome.** "alinhavo" em minúsculas, Fraunces 600 com SOFT 100 e espaçamento −0,035em.

**Versões.** Horizontal (principal), vertical, só símbolo, negativo (papel sobre tinta), sobre vermelho (alinhavo em tinta) e 1 cor (carimbo, bordado, gravação).

**Regras**
- Respiro mínimo: a altura do "a" em volta de todo o logo.
- Tamanho mínimo: 96 px (25 mm) de largura no horizontal; símbolo a partir de 16 px. Abaixo de 24 px, o símbolo vai sem os piques.
- Não esticar, girar, trocar cores, trocar a fonte, pôr sombra, contorno ou degradê, nem aplicar sobre foto sem chapa de cor.

**Arquivos:** `logo/alinhavo-simbolo.svg` e `.png`, `logo/alinhavo-horizontal.svg` e `.png`.

## 5. Cores: a caixa de costura

| Nome | Hex | Papel | Uso |
|---|---|---|---|
| Papel | `#F5EFE3` | o papel de molde | fundo (60%) |
| Tinta | `#1D1B18` | o traço | texto, símbolo, botão principal (25%) |
| Linha | `#C43A26` | a linha do alinhavo | destaque, CTA, o tracejado (8%) |
| Giz | `#2B5C9B` | giz de alfaiate | links, cotas, medidas (4%) |
| Fita | `#EDB92E` | fita métrica | marca-texto, número em destaque (3%) |
| Algodão cru | `#E8DECB` | — | superfícies e fundos secundários |
| Grafite | `#5C564C` | — | texto de apoio |

Contraste (WCAG): Linha sobre Papel 4,6:1 e Giz sobre Papel 5,9:1, ambos AA para texto. Fita tem 1,6:1 sobre Papel: só com texto em Tinta por cima (9,5:1).

**Cor funcional (só no produto):** a escala do mapa de pressão e de folga da Prova (azul `#295CC7` → verde `#38A85C` → amarelo `#F2CC38` → vermelho `#D63326`, de `lib/prova/colors.ts`). Nunca usar em peça de marca.

**Diferença com o app hoje:** o app usa `--linha: #c2412d`, `--costura: #25639f` e `--papel: #f6f1e7`. Os valores deste manual são o ajuste fino deles. Trocar no `globals.css` é uma mudança pequena, que fica para quando você pedir.

## 6. Tipografia

| Função | Fonte | Uso |
|---|---|---|
| Títulos | **Fraunces** (SOFT 100, pesos 420–600) | títulos, frases de campanha, números grandes |
| Texto e interface | **Geist** (400, 500, 600) | botões, menus, parágrafos |
| Medidas | **Geist Mono** | cm, tamanhos, versões, rótulos técnicos |

Escala: H1 56 · H2 36 · H3 26 · texto 18/1,5 · apoio 14 · rótulo 13 mono em maiúsculas. As três fontes são gratuitas (Google Fonts, licença OFL) e já estão no app.

## 7. Grafismos e ícones

- **O alinhavo.** Tracejado vermelho (traço 16, vão 12, ponta redonda). Sublinha títulos, separa seções, liga ideias. No produto vira a animação de carregamento ("Costurando as partes…").
- **O pique.** Pequeno entalhe triangular: marca início de seção, item de lista, ponto de atenção.
- **Papel e cota.** Papel milimetrado em giz claro como fundo; cotas com número mono para mostrar o que se diz.
- **A peça.** Contornos de molde reais, com fio e piques, no lugar de clip-art de roupa ou foto de banco de imagens. São a "fotografia" da marca.
- **Ícones dos módulos** (Molde, Prova, Coleção, Encaixe, Scan, Vitrine): traço 1,6, cantos redondos, grade 24. O módulo ativo fica em Linha.

## 8. Voz

**Princípios:** do ofício · com número · curta · do lado de quem faz.

| Não dizemos | Dizemos |
|---|---|
| "Revolucione sua confecção com a solução mais disruptiva do mercado." | "Prove antes de cortar. Menos piloto, menos tecido no lixo." |
| "Potencialize o fit da sua coleção com nosso workflow inteligente." | "Veja a peça vestida antes de cortar o piloto." |
| "Erro 422: validação de entidade falhou." | "A costura não fecha: a frente tem 42,3 cm e as costas 41,8 cm." |
| "Fale com um consultor para saber o preço." | "O preço está aqui embaixo. Começa grátis, sem instalar nada." |

**Palavras proibidas:** revolucionar, disruptivo, potencializar, solução 360, workflow, fit (quando "caimento" ou "vestibilidade" servem).

**Frases-mãe:** "Prove antes de cortar." · "Do traço ao corte, no mesmo molde." · "O ajuste da prova volta pro molde."

## 9. Aplicações (pranchas 10 a 12)

- **Instagram e LinkedIn:** posts 4:5 (1080 × 1350) e story 9:16. Um assunto por peça, sempre com o alinhavo ou um molde real. Três formatos-base: pergunta da semana (papel), como funciona (tinta), sem letra miúda (linha). Os números dos posts de exemplo ilustram o formato; não são resultados medidos.
- **Produto:** barra com o logo, trilha "Coleção › Produto › Molde v4", ação principal em Tinta ("Provar"), mensagens de erro com o número que falta.
- **Site:** herói "Prove antes de cortar." com o CTA em Linha ("Começar grátis") e "Ver o preço" ao lado, porque preço aberto é argumento.
- **Ícone do app, avatar, cartão e etiqueta de brinde (hang tag)** com o alinhavo contornando a borda.

## 10. Antes de usar em público

1. **Registro do nome:** pesquisar "Alinhavo" no INPI (classe 9 e 42, software) e a disponibilidade do domínio e do @. O `alinhavo.app` e o `@alinhavo` das pranchas são ilustrativos.
2. **Vetorizar o nome** (converter o texto em curvas) quando o logo for para gráfica ou bordado; hoje o SVG horizontal usa a fonte Fraunces.
3. **Validar com o ICP:** mostrar as pranchas 10 e 11 a uma modelista e a uma confecção nas mesmas entrevistas de preço.
