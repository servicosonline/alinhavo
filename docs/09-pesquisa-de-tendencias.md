# 09 · Pesquisa de tendências (proposta, revisão 2 · 16/11/2026)

Proposta para levar ao Alinhavo o que uma estilista usa na WGSN (Fashion Design) para pesquisar tendência. **Ainda não aprovada**: escopo, ordem e preço são decisão do Paulo.

**O que mudou da revisão 1.** A estilista Camila Ogliari leu a primeira versão e apontou: "não teria a parte de pesquisa; quem pegar o programa teria que importar essas imagens". Ela tinha razão: a versão 1 começava por uma mesa de organização vazia, e a pesquisa (IA e sinais) só vinha depois, sem imagens. Esta revisão inverte a ordem: **a primeira entrega já é pesquisa, com imagens, sem a estilista importar nada**. A mesa de organização vem junto, como o lugar onde o que ela achou fica guardado.

## 1. O que a WGSN entrega, de verdade

Pelas páginas oficiais, pelo FAQ e pelos quatro vídeos de referência (cor, uso do Fashion Design, metodologia, desfiles):

| Camada | O que é | No Alinhavo |
|---|---|---|
| **Conteúdo editorial** | Relatórios de ~250 analistas: macrotendências, previsão por mercado e temporada, itens-chave, paletas. Cada relatório tem resumo, **provas com fonte**, paleta com código, imagens e CAD para baixar | Sem equipe de 250 pessoas e sem inventar previsão. Duas saídas: **IA que pesquisa com fonte** e um **relatório do mês escrito por uma estilista parceira** |
| **Imagens** | 14 milhões de fotos de desfile, feira, rua e vitrine | Fotos de desfile têm dono. Entram **fontes que permitem uso**: banco de fotos livre (Unsplash, Pexels), vitrine brasileira (Mercado Livre) e páginas da web como link. Desfile só com licença paga (Getty) ou parceria (Tagwalk) |
| **Dados** | Social, busca, e-commerce, painel de consumidores | **Sinais públicos com API oficial**: Pinterest Trends (Brasil) e as buscas da semana do Mercado Livre |
| **Ferramentas** | Banco de tendências, painel de desfiles, feed, assistente com IA, cor, mix, calendário | **Sim, ligadas à produção**: a pesquisa vira produto, molde, tecido e Prova 3D no mesmo arquivo |

## 2. Posicionamento

**A pesquisa começa e termina no Alinhavo.** A estilista abre a Pesquisa e já encontra o que olhar (relatório do mês, sinais da semana, busca de imagens e IA); salva o que interessa; monta a tendência; e dali cria o produto, escolhe a base de molde e vê a cor da tendência vestida no manequim.

Regras que não mudam: nenhuma tendência sem fonte e data; nenhum percentual de "acerto"; nenhuma imagem de terceiro sem licença ou crédito.

Público: confecção pequena e média, que não paga ~US$ 25 mil/ano na WGSN (o START custa R$ 299–429/mês e não tem os painéis). Conversa com o assento Estilista (R$ 59).

## 3. Como a estilista pesquisa (o que ela vê ao abrir)

Módulo **Pesquisa** (`/painel/[org]/pesquisa`), com uma caixa de busca no topo e cinco fontes. Ela escreve um tema, por exemplo "alfaiataria leve verão 27 feminino", e escolhe onde procurar:

| Fonte | O que traz | De onde vem |
|---|---|---|
| **IA com fontes** | Uma ficha de tendência pronta para revisar: resumo, motores da mudança, peças-chave, materiais, cores sugeridas e **provas com link**. Junto, cartões das páginas usadas (título, site, data, link) | Claude com busca na web e leitura de página; o servidor descarta o que não tem citação |
| **Imagens** | Grade de fotos de rua, estilo de vida, tecido e textura, com o crédito do fotógrafo | APIs do Unsplash e do Pexels (uso comercial permitido, crédito obrigatório) |
| **Vitrine Brasil** | Produtos à venda agora no tema: foto, preço, marca e link do anúncio | API do Mercado Livre (busca por categoria de moda; acesso a confirmar, ver §7) |
| **Sinais** | O que está subindo no Pinterest Brasil e nas buscas do Mercado Livre, com a curva das últimas semanas | Pinterest Trends e Mercado Livre `/trends`, coletados toda semana |
| **Relatório do mês** | Tendências da temporada escritas por uma estilista parceira do Alinhavo, com imagens licenciadas ou próprias | Conteúdo publicado pelo superadmin (como as Novidades) |

Em qualquer resultado, o botão **Salvar** leva o item para a mesa (abaixo), com a fonte e o crédito junto. Ela também pode continuar enviando as próprias fotos (celular, print, visita a loja), mas não precisa.

## 4. A mesa: onde a pesquisa vira coleção

| Recurso | O que faz |
|---|---|
| **Tendências** | Ficha da organização: nome, resumo, temporada, mercado, horizonte (curto / médio / longo), motores da mudança, provas (link, trecho, data, origem `ia`, `pessoa`, `sinal` ou `relatório`), paleta, materiais, silhuetas, imagens e estado *observar → testar → apostar → descartada*. Filtro por temporada, mercado, categoria e estado |
| **Referências** | Painel de imagens salvas (das fontes ou enviadas), agrupáveis por tendência, com crédito sempre à vista; exportação em PDF para apresentar |
| **Leitura das referências** | A IA marca em cada imagem: peça, silhueta, comprimento, cor, material aparente, estampa, detalhes. Um painel conta e compara ("vestido midi: 8% das referências do verão 26, 21% do verão 27"). Equivale ao painel de desfiles da WGSN, sobre o que a equipe juntou |
| **Paletas** | Cor tirada das imagens, guardada em hex e CIELAB; comparação com os tecidos cadastrados (os mais próximos pela distância de cor). Código Pantone só como texto que a estilista digita |
| **Cor na Prova 3D** | Vestir o molde, no manequim, com cada cor da paleta. A WGSN não tem isso |
| **Da tendência ao produto** | "Criar produto a partir da tendência": produto na coleção já com a tendência, a paleta e uma base de molde sugerida (saia, calça, short, blusa, vestido, camiseta, manga, que já existem). O desenho técnico plano já sai do molde |
| **Calendário comercial** | Datas do varejo brasileiro (Dia das Mães, Namorados, São João, volta às aulas, Black Friday, Natal, estações, Copa…) com o prazo de início calculado de trás para frente pelo **tempo de produção médio da própria confecção** (`production_stage_times`, já existe) |
| **Perguntar à pesquisa** (depois) | Perguntas sobre o acervo da organização, respondidas só com ele e com o link de cada item |
| **Plano de coleção** (depois) | Grade categoria × tendência × cor com quantidades-alvo, comparada ao que a coleção já tem; exporta planilha |

Fica fora: guias de cidade, aulas e consultoria (são conteúdo ou serviço humano).

## 5. Fases

Cada fase termina usável. A ordem garante que **ninguém abre a Pesquisa vazia**.

**P1 · Pesquisar dentro do Alinhavo**
Caixa de busca com **IA com fontes** (ficha + cartões das páginas), **Imagens** (Unsplash e Pexels), botão Salvar; Tendências, Referências e Paletas (extração de cor). Envio de fotos próprias também.
*Pronto quando:* uma estilista com a organização vazia, sem importar nada, pesquisa "alfaiataria leve verão 27", salva 10 imagens e 5 provas, aceita a ficha da IA como tendência e extrai uma paleta das imagens salvas. Toda prova abre a página citada e toda imagem mostra o crédito.

**P2 · Vitrine, sinais e leitura**
Vitrine Brasil (Mercado Livre, se o acesso se confirmar), Sinais (Pinterest Trends e Mercado Livre `/trends`, toda semana), feed da Pesquisa, leitura das referências por IA e o painel de atributos.
*Pronto quando:* a coleta roda sozinha por duas semanas e cada sinal mostra fonte, data e curva; 50 referências são marcadas pela IA e o painel compara duas temporadas.

**P3 · Da pesquisa ao molde**
Cor da paleta na Prova 3D, criar produto a partir da tendência (com base sugerida), calendário comercial com prazo retroativo.
*Pronto quando:* a partir de uma tendência, a estilista cria o produto na coleção e vê a calça-base vestida nas 5 cores da paleta; o calendário diz "para o Dia das Mães, comece a modelagem até 10/02" pelos dados da própria confecção.

**P4 · Relatório do mês**
Ferramenta do superadmin para publicar relatórios de tendência (texto, imagens com licença, paleta, provas) e a leitura na Pesquisa de cada cliente, com "salvar como tendência". **Pode subir para junto da P1** se a parceria com a estilista curadora fechar antes: a parte técnica é pequena (parecida com as Novidades); o trabalho é o conteúdo.

**P5 · Aprofundar**
Perguntar à pesquisa, plano de coleção, Google Trends (quando a API sair do alfa) e desfile licenciado (Getty ou Tagwalk), se contratado.

## 6. Arquitetura

Segue as regras atuais (RLS por organização, cálculo no navegador, IA e chaves só no servidor, reserva e limite por organização).

- **`packages/color`** (novo, TypeScript puro, testado como `geometry`): sRGB ↔ CIELAB, ΔE2000, extração de paleta por k-means em Worker, harmonias.
- **Busca externa** por Route Handlers do servidor (`/api/pesquisa/...`, conferindo o login como toda rota), com as chaves do Unsplash, do Pexels e do Mercado Livre em variáveis de ambiente do servidor. Cache curto das respostas para não estourar os limites (Pexels: 200 pedidos por hora no padrão, ampliado de graça com o crédito à vista).
- **Imagens externas ficam como link, não como cópia**: o Unsplash exige usar o endereço da própria API (hotlink) e chamar o endpoint de download quando a foto é usada; o Pexels proíbe cópia em massa. Referência salva guarda `source`, `source_url`, `image_url`, `credit_name`, `credit_url`. Só as fotos enviadas pela organização vão para o bucket privado `referencias`.
- **Banco** (migrações a partir de `20261116…`; toda tabela de negócio com `org_id`, RLS e teste em `tests-pglite/`):
  - `trends`, `trend_evidence` (url, trecho, data, origem), `trend_links` (tendência ↔ produto/coleção).
  - `references` (arquivo próprio ou link externo com crédito) e `reference_tags` (atributos, origem `ia | pessoa`).
  - `palettes` e `palette_colors` (hex, Lab, nome, código digitado opcional).
  - **Tabelas da plataforma** (sem `org_id`, leitura para quem tem conta, como `announcements`): `trend_signals` (fonte, região, termo, categoria, série, coletado em), `commercial_calendar` e `trend_reports` (relatório do mês, publicado só pelo superadmin por função `platform_*`, com auditoria).
  - `ai_generations.kind` ganha `pesquisa_tendencia`, `leitura_referencia` e `pergunta_pesquisa`, cada um com limite próprio em `private.ai_kind_limit` e na constante do app.
- **IA**, pelo caminho de `lib/ai/` (gateway, reserva, `finish_ai_generation`):
  - Pesquisa: Claude Opus 5.5 com as ferramentas de busca na web e leitura de página (devolvem citações) e saída estruturada; prova sem URL citada é descartada. A página tem `maxDuration` alto, como a da foto de catálogo.
  - Leitura das imagens: visão em lote pela API de lotes (cerca de metade do preço; resultado em até 24 h, normalmente bem antes); a tela mostra "lendo…" e atualiza pelo Realtime.
  - O fallback da OpenAI vale para texto, não para a pesquisa com busca (as citações vêm da ferramenta do Claude).
- **Coleta de sinais**: Edge Function `sinais-coleta` chamada pelo Supabase Cron uma vez por semana (como `webhooks-dispatch`), credenciais do Pinterest e do Mercado Livre em segredos da função. Uma coleta para a plataforma inteira.
- **Permissões**: buscar e salvar para quem edita produtos (`can_edit_products`: dono, admin, modelista, estilista); leitura para todos os membros.

## 7. Riscos e licenças

- **Fotos de desfile**: não entram sem licença. Nada de raspar Vogue Runway, TikTok ou Instagram. A página pública de acompanhamento da cliente não mostra referências de terceiros.
- **Unsplash**: uso comercial grátis, mas a API exige crédito ao fotógrafo e ao Unsplash com link, hotlink, chamar o download, não usar o nome no app e não "replicar o Unsplash" (a busca de imagens é uma parte da Pesquisa, não o produto). Pedir o limite de produção mostrando o crédito.
- **Pexels**: uso comercial grátis, crédito com link à vista na busca, proibido cópia em massa e uso para treinar IA (a leitura por IA é análise, não treino; confirmar com o Diretor Jurídico). Um site de terceiros diz que novas chaves estão suspensas; conferir em pexels.com/api.
- **Mercado Livre**: o `/trends` é oficial e pede token. A busca de anúncios para a Vitrine Brasil precisa ter o acesso e os termos de exibição confirmados antes da P2; se não for permitido, a Vitrine sai da proposta.
- **Pinterest**: app de desenvolvedor da empresa e aceite dos termos antes da P2.
- **Getty Images**: API só por contrato com a equipe comercial e, para desfile, conteúdo editorial (não comercial). **Tagwalk**: sem API pública; só por parceria. Os dois são decisão de custo.
- **Pantone e Coloro**: nada de biblioteca, conversão ou "equivalente" (os termos da Pantone pedem licença por escrito); só o código que a estilista digita.
- **Marcas da WGSN**: não usar "STEPIC™", "TrendCurve", "Pulse", "The Feed" nem textos deles.
- **Relatório do mês**: contrato com a estilista curadora (autoria, cessão de direitos, imagens usadas) passa pelo Diretor Jurídico antes de publicar.
- **IA que inventa tendência**: prova sem citação é descartada; a ficha mostra a data da busca; nenhum percentual de acerto.
- **Custo de IA**: a busca na web é cobrada por busca além dos tokens, e uma pesquisa faz várias. Limite próprio por organização e preço levantado na página oficial antes da P1 (Diretor de TI).

## 8. Decisões que ficam com o Paulo

1. Aprovar o posicionamento ("a pesquisa começa e termina no Alinhavo", sem previsão própria) e a nova ordem (P1 já é pesquisa).
2. Se a P1 entra antes das lacunas do Audaces que faltam (pose sentada, presets de costura, kit de aprovação).
3. **Relatório do mês**: convidar uma estilista curadora (a Camila é candidata natural), em que formato (por relatório, mensal, participação) e se ele entra junto com a P1.
4. Em que plano a Pesquisa entra e os limites mensais de IA por tipo (Comercial).
5. Criar as contas de desenvolvedor em nome da empresa: Unsplash e Pexels (antes da P1), Pinterest e Mercado Livre (antes da P2); inscrição no alfa da API do Google Trends.
6. Se vale orçar desfile licenciado (Getty ou Tagwalk) para a P5.
