# 12 · Auditoria da Estilista (análise pelo código)

Data: 27/11/2026. Persona: `estilista-producao-moda`, perfil **"Eu-Equipe" de PME** (acumula estilo, compras, fichas e muitas vezes a modelagem). É o público do `docs/02-produto-alinhavo.md`.
Método: leitura do código em `apps/web/src`, `packages/export/src` e `supabase/migrations` (branch `bases-e-manequim`, commit `470767b`). **Não houve uso do app com login.** A usabilidade visual não foi avaliada.
Os critérios vêm da própria skill: as 14 tarefas, os 5 gates e as 5 regras de ouro para o Alinhavo. Itens marcados *a confirmar* não foram verificados no código.

## Veredito da estilista

> "Para a parte de molde, prova 3D e aprovação por link, o Alinhavo já me serve melhor que papel e WhatsApp. Mas ainda não contrato como **sistema da minha coleção**. Não consigo registrar as provas da piloto nem lacrar a peça. Não monto as variantes de cor que vão para a facção. E não tenho a coleção amarrada a mix e preço-alvo. Hoje ele é uma ferramenta da modelista que eu uso de carona."

Hoje ela **contrataria como complemento**, não como ferramenta principal. Os três bloqueios de compra estão no topo da lista de lacunas abaixo.

## O que já resolve (confirmado no código)

| Etapa da estilista | O que existe |
|---|---|
| Coleção e cronograma | Coleções com etapas (`milestones`) com prazo, responsável e situação (atrasada, próxima, concluída). Produtos em kanban/lista |
| Status do produto | `ideia → modelagem → prova → aprovado → producao` (`lib/collection.ts`) |
| Desenho técnico plano | Gerado do molde, frente e costas, sem IA (`packages/export/src/flat-sketch.ts`) |
| Ficha técnica | Abas Resumo, Materiais, Produção, Aprovações e Comentários. Aviamentos, operações, descrição técnica, tabela de medidas por tamanho, gerar e baixar a ficha (`tech-pack-parts.tsx`, `tech-pack.ts`) |
| Custo industrial | Tecido e aviamentos, mais costura/facção (`sewing_cents`), lavanderia (`laundry_cents`) e perda de corte (`waste_pct`) |
| Tecidos | R$/m e R$/kg (malharia), encolhimento no urdume e na trama |
| Prova e aprovação | Prova 3D, aprovação por link sem conta ("Pode cortar o piloto"), link de acompanhamento, comentários por produto |
| Catálogo | Foto do produto, fotos de catálogo e textos por IA |
| Papel na equipe | Papel `estilista` edita produtos (`private.can_edit_products`). Molde é com a modelista |

## Lacunas, em ordem de prioridade

### Bloqueiam a compra
1. **Diário de provas de caimento e lacre da piloto (Gate 4).** Não há registro das 1 a 3 provas (fio, assentamento, linha, equilíbrio, folga, tempo de vestir), nem foto alfinetada, nem lacre que trave a ficha definitiva. Em `apps/web/src` e nas migrações, a busca por `lacre|fitting|prova de caimento` não encontrou nada. "Piloto" só aparece na tela de Resultados (ROI) e na aprovação. *Já previsto:* docs/11, Frente 6 (Onda 3). **Sugestão: antecipar.**
2. **Variantes de cor (SKU) e Ordem de Corte visual para a facção.** A regra de ouro 3 da skill pede cards coloridos lado a lado por variante (tecido principal, forro, zíper, viés, linha) e avisos em destaque. O produto tem uma ação de tecido único (`setProductFabric`), e não há ordem de corte nem romaneio no código. *A confirmar:* a landing promete "variantes de tecido", mas não confirmei se isso existe na tela do produto. *Ordem de corte já prevista:* docs/11, Frente 5 (Onda 2). *Variantes por cor:* **lacuna nova.**
3. **Coleção sem mix, preço-alvo e teto de custo.** A busca por `mix|teto de custo|target_price` não encontrou nada. Ela não consegue montar a pirâmide básico/elaborado/fashion nem ver se a ficha estourou o preço-alvo. *Já previsto:* docs/11, Frente 6.

### Pesam muito na decisão
4. **Trava de encolhimento e de carryover (regra de ouro 2).** O encolhimento existe no tecido, mas não há alerta antes de produzir ("tecido sem teste de lavagem"). Também não há marcação de modelo reeditado com troca de tecido: a busca por `carryover|reedi` não encontrou nada. **Lacuna nova.**
5. **Ficha progressiva em 3 estágios (regra de ouro 1).** A ficha é uma só e não muda conforme o estágio. Desenvolvimento, piloto e definitiva poderiam usar o status do produto para pedir só o necessário em cada fase. **Lacuna nova.**
6. **Desenho técnico com cotas (callouts) e vista lateral.** O desenho deixa de fora as partes laterais e não tem cotas. *Já previsto:* docs/11, Frente 6.
7. **Texografia em 3 estágios e largura real do rolo (regra de ouro 4).** O encaixe existe, mas não confirmei se a ficha compara consumo estimado, medido na piloto e real no encaixe, nem se avisa desperdício acima de 15%. *A confirmar.*

### Desejáveis
8. **Cartela de cores, cartela de tecidos e moodboard (Gate 2).** A busca por `cartela|moodboard|pantone` não encontrou nada. A IA poderia entrar aqui (regra de ouro 5), e não só no catálogo.
9. **Briefing de superfície e lavanderia** (rapport, estampa localizada). Hoje há estampa e bordado no molde, mas não há briefing para o fornecedor.
10. **Banca de croquis (Gate 3),** com a decisão de produzir dentro ou comprar pronto (insourcing ou outsourcing).

## Objeções prováveis na venda (para Comercial e Marketing)
- "Onde eu anoto o que mudou na prova? Hoje fica na minha cabeça e no caderno."
- "A facção vai receber a peça em azul, mas tenho mais 3 cores. Como ela sabe o forro e o zíper de cada uma?"
- "Consigo ver se a coleção cabe no preço que o comercial pediu?"

## Próximo passo sugerido
Levar ao Diretor de Produto a proposta de antecipar os itens 1 a 3 e incluir no roadmap os itens 2 (variantes por cor), 4 e 5, que hoje não estão em `docs/11`. Depois, validar este documento com uma estilista real e com o app aberto, porque esta análise foi feita só pelo código.