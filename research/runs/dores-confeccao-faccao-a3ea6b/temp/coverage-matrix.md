## Coverage Matrix — query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "necessidades" | Sub-Q1, Sub-Q2, Sub-Q10; Section 9; Entities `required_fields: ["necessidades"]` | OK — cobre necessidades operacionais, financeiras, comerciais e tecnológicas | No |
| "dificuldades" | Sub-Q3, Sub-Q4, Sub-Q5, Sub-Q6, Sub-Q7, Sub-Q8, Sub-Q9; Sections 2–8; Entities `required_fields: ["dificuldades"]` | OK — cobre todas as dimensões de dor (capital, mão de obra, operação, modelagem/corte, comercial, fiscal, sistemas) | No |
| "proprietário" | Scope condition: foco em necessidades e dificuldades do proprietário; Entity: pequeno proprietário (MEI/ME/EPP) | OK — perspectiva do dono/gestor, não apenas do trabalhador | No |
| "confecção (fábrica de roupas)" | Sub-Q1; Entity: confecção de marca própria / verticalizada; Section 1 | OK — escopo completo de indústria de confecção do vestuário | No |
| "facção" | Sub-Q2, Sub-Q7, Sub-Q8; Entity: facção (costura terceirizada); Section 1, 6, 7 | OK — escopo explícito de prestadores terceirizados de costura/acabamento | No |
