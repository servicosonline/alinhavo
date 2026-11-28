# 11 · Roadmap Empírico das 3 Personas de Confecção (Modelista, Estilista e Dono/Facção)

Consolidação das auditorias empíricas realizadas com as skills `modelista-producao-moda`, `estilista-producao-moda` e `dono-confeccao-faccao` no Alinhavo.

## Frente 1 — Polimento Comercial & Demo (Onda 1)
- **Nome e sobrenome reais na Equipe e nos Comentários:** exibir `first_name` + `last_name` de `org_team` em Configurações › Equipe e nos Comentários do produto.
- **Posicionamento 3D das pernas em calças/bermudas de cortar par:** garantir que partes `cutPair` ancoradas na cintura/quadril que descem abaixo do gancho vistam cada perna (`esquerda` / `direita`) mesmo quando `placement.leg` não foi salvo explicitamente.

## Frente 2 — Cadastro de Tecidos para Malharia (R$/kg), Rendimento e Encolhimento (Onda 1)
- **Compra em R$/kg e conversão automática de rendimento:** cadastrar preço por quilo (`price_per_kg_cents`) além de R$/m, calculando rendimento $m/kg = \frac{1000}{g/m^2 \times largura(m)}$ e custo por metro equivalente.
- **Percentual de encolhimento (Urdume % e Trama %):** campos `shrinkage_warp_pct` e `shrinkage_weft_pct` no cadastro do tecido, exibidos na listagem e na Ficha Técnica.

## Frente 3 — Ficha Técnica Industrial: Custos de Facção/Lavanderia/Perda e Tabela de Medidas (Onda 1)
- **Custo Industrial Completo na Ficha Técnica:** custos por peça de Costura/Facção (`sewing_cents`), Lavanderia/Beneficiamento (`laundry_cents`) e Perda de Corte (`waste_pct`), somados ao tecido e aviamentos por tamanho.
- **Tabela de Medidas na Ficha Técnica:** incluir a grade de medidas de referência vinculada ao produto/molde no documento e no PDF da Ficha Técnica.

## Frente 4 — Evolução do Editor CAD 2D & Gradação (Onda 2)
- Validação de casamento de costuras (`openSeams`) em todos os tamanhos da grade.
- Sistema de piques (*notches*) no Editor 2D, PDF, Risco e DXF-AAMA (Layer 4).
- Edição numérica precisa de segmento, deslocamento $\Delta X/\Delta Y$ e rotação do fio ($0^\circ, 45^\circ, 90^\circ$).
- Ferramenta visual de pences (*darts*) e linhas internas.

## Frente 5 — Sala de Corte, Ordem de Corte e Romaneio de Facção (Onda 2)
- Controle explícito de giro no Encaixe ($0^\circ/180^\circ$ vs. sentido único vs. $90^\circ$).
- Calculadora de enfesto e Ordem de Corte imprimível a partir do risco.
- Romaneio de remessa e retorno de facção.

## Frente 6 — Gestão de Estilo, Diário de Provas e Mix de Coleção (Onda 3)
- Diário das provas de caimento (*fitting*) e lacre da peça-piloto.
- Anotações de cotas (*callouts*) no desenho técnico plano.
- Metas de mix e teto de custo na coleção.
