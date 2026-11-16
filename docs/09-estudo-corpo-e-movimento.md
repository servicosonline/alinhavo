# 09 · Estudo: corpo realista (MakeHuman) e movimento na Prova

Estudo de 16/11/2026 (Passo M da Fase 7). **O M1 já foi feito** (branch `audaces-item-6`); M2 e M3 seguem como plano.

## O que o M1 ensinou

- **Atrito contra a pele que anda é obrigatório.** Medido contra o mundo parado, o atrito arrastava a perna da calça para trás a cada passada e a calça caía correndo (74 cm). Com `Collider.surfaceStep` (quanto a pele anda, pelo osso mais perto), a calça fica no lugar.
- **A curva entre quadros-chave precisa ser monotônica.** A Catmull-Rom passava do ponto entre dois quadros iguais (sentado, parado) e afundava o corpo 7 cm.
- **O banco vai abaixo do ponto mais baixo do corpo**, medido pelo colisor (o bumbum sentado fica abaixo da coxa); com espaço para o tecido.
- Exploração (calça, top e camiseta nos 7 movimentos): o tecido entra no corpo no máximo 4 mm e as costuras abrem no máximo 4 mm; preparar leva de 6 a 36 s por movimento nesta máquina.

Pedido do Paulo: um **play** em que a pessoa escolhe o que o modelo faz: andar, correr, dançar, acenar, sentar, agachar e deitar.

## O que já temos

- **As poses do manequim já são ângulos de articulação** (`POSES` em `packages/cloth/src/body/mannequin.ts`): por braço, abertura, flexão e cotovelo; por perna, abertura, flexão e joelho. Animar um membro é variar esses ângulos no tempo. Hoje faltam o tronco (inclinar e girar), o quadril (sentar), o pescoço e a posição do corpo inteiro (andar para a frente, deitar).
- **O colisor é feito de formas simples**: tronco por seções superelípticas e membros por cones arredondados. Responder a uma pergunta custa ~1,2 µs, e montar o manequim inteiro numa pose nova custa ~3,5 ms.
- **O contrato `Body`** (`body/types.ts`) e o teste "cumpre o contrato do Collider" (`body.test.ts`) já são a porta para trocar de corpo sem mexer na roupa.

## Medição (nesta máquina, Node, com outros chats rodando)

| Roupa | Vértices | Custo de 1/60 s de simulação (20 subpassos, 2 iterações) |
|---|---|---|
| Calça de teste | 1.365 | ~30 ms |
| Camiseta de teste | 857 | ~34 ms |

**Conclusão:** a simulação roda cerca de **2× mais devagar que o tempo real**. Com o corpo em movimento, ela precisa de mais subpassos para o tecido não atravessar um membro rápido, como na corrida e na dança. **Não dá para simular ao vivo enquanto o vídeo toca.**

## Como o play funciona: "preparar e tocar"

1. A pessoa escolhe o movimento e aperta **Play**.
2. O Worker simula o movimento inteiro mais devagar que o tempo real, com uma barra "Preparando o movimento… 40%", e guarda as posições da roupa e do corpo em cada quadro, a 30 quadros por segundo.
3. Pronto isso, o movimento toca liso e em volta. Pausar, voltar e girar a câmera não custam nada.

Tamanho estimado: um clipe de 4 s da calça ocupa 1.365 vértices × 3 × 4 bytes × 120 quadros ≈ **2 MB** só da roupa, mais o corpo. O tempo de preparo fica em ~5 a 10 s por clipe num computador comum (mais no celular). O resultado fica guardado enquanto o molde, o tamanho e o tecido não mudam.

É o mesmo caminho do vídeo 360°, que já pausa a simulação para gravar. Com o clipe pronto, gravar o vídeo do movimento para a aprovação fica fácil.

## Licenças

- **MakeHuman:** as fontes oficiais dizem que os **assets são CC0** (malha base, targets, modificadores, peles, proxies, roupas, poses e expressões). Dá para usar num produto fechado e comercial, sem crédito, inclusive para montar um gerador de corpo próprio. **O código é AGPLv3 e não pode entrar**: usamos só os dados e escrevemos a leitura. O esqueleto e os pesos não aparecem nominalmente nas páginas de FAQ. Antes de usar, é preciso conferir a seção C do `LICENSE.md` do repositório oficial e guardar a origem e a licença de cada arquivo em `docs/06-riscos-e-licencas.md`. Não confundir com o MB-Lab/ManuelbastioniLAB, que é AGPL até nos dados.
  - [Are MakeHuman files free?](https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html) · [Is it really free? (MPFB)](https://static.makehumancommunity.org/mpfb/faq/is_it_really_free.html) · [Reusar os assets num gerador próprio](https://static.makehumancommunity.org/mpfb/faq/build_other_chargen.html) · [MB-Lab](https://en.wikipedia.org/wiki/MB-Lab)
- **Captura de movimento da CMU:** "free for all uses". Pode entrar num produto vendido, **mas não pode ser revendida, nem convertida**. Crédito só é pedido em artigo científico. Ou seja, os clipes vão dentro do app, convertidos para o nosso esqueleto, e nunca como arquivo para baixar.
  - [CMU Graphics Lab Motion Capture Database](https://mocap.cs.cmu.edu/)
- **Mixamo (Adobe): fica fora.** Os termos amarram o uso à conta Adobe e não deixam distribuir os arquivos de animação. Não vale o risco.
- **SMPL: continua proibido** (invariante 6).

## Plano proposto, em três fases

### M1 · Play no manequim de hoje (sem MakeHuman)
Entrega o pedido mais rápido e sem asset de fora.
- **Pose por quadro:** o manequim ganha tronco (inclinar e girar), quadril (sentar), pescoço e a posição do corpo inteiro. Os sete movimentos viram **clipes de quadros-chave escritos por nós**, com os ângulos no tempo e interpolação suave. Sem licença envolvida.
- **Colisor que se move:** a cada subpasso, o colisor da pose daquele instante. Para sentar, um assento entra como colisor, como o salto do sapato já entra. Para deitar, o corpo inteiro gira (colisor transformado), e o chão vira o apoio.
- **Transição:** a roupa assenta em pé (como hoje) e só depois o movimento começa, para as costuras fecharem antes.
- **Worker:** uma mensagem nova, `prepare-motion`, devolve os quadros e o progresso. A tela ganha o seletor "Movimento", o Play e a barra de preparo.
- **Testes:** cada clipe com a calça, a saia e a camiseta de teste. A roupa não atravessa o corpo mais que o limite de hoje, as costuras continuam fechadas e a calça fica no quadril ao agachar e ao sentar.
- **Riscos:** tecido atravessando braço ou perna na corrida (resolve com mais subpassos só nos clipes rápidos), a calça escorregando ao agachar (o atrito estático já ajuda) e o preparo lento no celular (lá, menos quadros por segundo).

### M2 · Corpo realista (MakeHuman)
- **Conversão fora do app:** um script em Node lê a malha base e um conjunto escolhido de targets (os que mexem nas 15 medidas e no tipo de corpo) e grava um arquivo compacto no app, com a origem e a licença de cada arquivo.
- **Ajuste às medidas:** os pesos dos targets são ajustados para bater busto, cintura, quadril e as outras medidas (mínimos quadrados), como o manequim bate hoje por construção.
- **Colisor:** o mesmo jeito rápido de hoje, com cápsulas e seções ajustadas à malha. Uma distância calculada direto na malha seria lenta demais. Precisa passar no teste do contrato do `Collider`.
- **Movimento:** a malha é deformada pelo esqueleto (pesos de pele CC0, a conferir) com os mesmos clipes do M1.
- **Tamanho:** é preciso limitar quantos targets entram, para o download não pesar.

### M3 · Movimentos capturados (CMU)
- Converter os clipes escolhidos (caminhada, corrida, dança, aceno, sentar, agachar, deitar) para o nosso esqueleto, fora do app, e trocar os quadros-chave escritos à mão do M1.
- Os clipes vão embutidos e nunca para baixar. A origem e o número de cada clipe ficam registrados.

## Recomendação

Começar pelo **M1**: ele entrega o play com os sete movimentos no manequim de hoje e monta o caminho (preparar e tocar, colisor que se move, clipes) que o M2 e o M3 só trocam por dentro. O M2 é o maior pedaço e merece uma fase própria, numa sessão separada.
