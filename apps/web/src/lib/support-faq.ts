/**
 * Perguntas frequentes do botão "Ajuda": a pessoa procura antes de abrir a conversa com o suporte. Puro.
 * Respostas curtas, com o caminho na tela. Mudou uma tela? Atualize a resposta aqui.
 */

export interface FaqItem {
  q: string;
  a: string;
  /** Palavras que a pessoa pode digitar e não estão na pergunta. */
  tags: string;
}

export const SUPPORT_FAQ: FaqItem[] = [
  {
    q: "Como começo um molde?",
    a: "Em Moldes, clique em Novo molde. Dá para começar de um exemplo (saia, calça ou conjunto) e ajustar, ou do zero com um retângulo e arrastar os pontos.",
    tags: "criar molde novo começar exemplo",
  },
  {
    q: "Como provo o molde em 3D?",
    a: "No editor, escolha em cada parte o lado do corpo (seção Na Prova) e clique em Provar. Ligue uma tabela de medidas ao molde para o manequim ter as medidas certas.",
    tags: "prova 3d manequim vestir simular",
  },
  {
    q: "A Prova está lenta ou travando.",
    a: "Use o Chrome ou o Edge atualizados. Na Prova, troque a qualidade para Leve. Feche outras abas pesadas. Computador com placa de vídeo ajuda bastante.",
    tags: "lento travando devagar pesado qualidade",
  },
  {
    q: "Como peço a aprovação da cliente?",
    a: "Na Prova, faça as capturas (frente, costas, lado) e clique em Pedir aprovação. Salve as alterações do editor antes. A cliente abre o link sem criar conta e aprova ou pede ajustes.",
    tags: "aprovar aprovação cliente link",
  },
  {
    q: "Como mando o andamento para a cliente?",
    a: "Na página do produto ou da coleção, clique em Enviar acompanhamento, escolha o que ela vê e mande o link (dá para mandar pelo WhatsApp).",
    tags: "acompanhamento cliente andamento link whatsapp",
  },
  {
    q: "Como exporto para o plotter?",
    a: "No editor, use Exportar: DXF-AAMA (plotters e cortadoras) ou PDF 1:1 em folhas A4. O risco do encaixe sai em DXF e PLT.",
    tags: "exportar plotter dxf pdf plt imprimir",
  },
  {
    q: "Como convido alguém da equipe?",
    a: "No início da organização, clique em Equipe, convites e API, aba Convidar. Escolha o papel: modelista, estilista, só leitura ou admin. O valor de cada papel e a mensalidade com o convite aparecem antes de enviar. Marque \"Pode criar organizações próprias\" se a pessoa puder ter organizações dela; dá para mudar depois na aba Equipe.",
    tags: "convidar equipe usuário pessoa papel preço valor criar organização",
  },
  {
    q: "Quanto tempo dura o teste grátis?",
    a: "15 dias com tudo liberado, sem cartão. O aviso na barra da organização mostra quantos dias faltam. O teste vale uma vez por pessoa: a segunda organização que você criar já começa sem teste.",
    tags: "teste grátis trial dias plano",
  },
  {
    q: "Como indico um amigo?",
    a: "Em Minha conta, na parte Indique e ganhe, copie o seu link ou mande pelo WhatsApp. Vale para conta nova criada pelo link em até 30 dias, e o desconto entra quando a pessoa fizer o primeiro pagamento. Se a parte não aparecer, o programa ainda não está aberto.",
    tags: "indicar indicação amigo desconto link convite ganhar",
  },
  {
    q: "Como faço o encaixe (risco)?",
    a: "Na página do produto, abra Encaixe, informe a largura do tecido e a quantidade por tamanho e clique em Encaixar. Salve o risco para a ficha técnica usar o aproveitamento medido.",
    tags: "encaixe risco aproveitamento tecido corte",
  },
  {
    q: "Esqueci a senha.",
    a: "Na tela de entrar, clique em Esqueci minha senha. Chega um link no e-mail para criar a nova.",
    tags: "senha esqueci entrar login",
  },
];

/** Sem acento e em minúsculas, para a busca achar "aprovacao" e "Aprovação". */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** As perguntas que combinam com o que a pessoa digitou (todas as palavras); vazio = todas. */
export function searchFaq(query: string, items: FaqItem[] = SUPPORT_FAQ): FaqItem[] {
  const words = norm(query).split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return items;
  return items.filter((i) => {
    const hay = norm(`${i.q} ${i.a} ${i.tags}`);
    return words.every((w) => hay.includes(w));
  });
}

export const THREAD_STATUS_LABEL: Record<string, string> = {
  aberta: "Esperando o suporte",
  respondida: "Respondida",
  fechada: "Fechada",
};
