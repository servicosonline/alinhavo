import { productThumbUrl } from "@/lib/product-photo";

/**
 * Miniatura quadrada do produto (lista, quadro, página do produto). A imagem vem da rota da miniatura,
 * que escolhe a fonte (foto enviada, catálogo, aprovação, desenho técnico ou iniciais) e só carrega quando
 * aparece na tela. `version` (a foto e a data de edição) troca o endereço quando a foto muda.
 */
export function ProductThumb({
  orgId,
  productId,
  version,
  size = 64,
  className = "",
}: {
  orgId: string;
  productId: string;
  version?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagem privada pela rota da miniatura (com a sessão); o otimizador do Next não tem a sessão
    <img
      src={productThumbUrl(orgId, productId, version)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      // Sem o arrastar nativo da imagem: no quadro, quem arrasta é o cartão.
      draggable={false}
      className={`shrink-0 rounded-md border border-tinta/10 bg-papel-escuro object-cover ${className}`}
      style={{ width: size, height: size }}
      data-product-thumb
    />
  );
}
