-- Alinhavo · Onda 1 das 3 personas de confecção:
--   * Tecidos (public.fabrics): compra por quilo (price_per_kg_cents) para malharia
--     e percentuais de encolhimento no urdume/comprimento (shrinkage_warp_pct) e
--     na trama/largura (shrinkage_weft_pct).
--   * Produtos (public.products): custos operacionais por peça na ficha técnica
--     — costura/facção (sewing_cents), lavanderia/beneficiamento (laundry_cents)
--     e perda operacional/corte (waste_pct).
--
-- Regras:
--   * Preços sempre em centavos inteiros (sem ponto flutuante).
--   * Encolhimentos e perda de corte em percentual numérico de 0 a 50%.
--   * Mesma permissão de escrita das tabelas (private.can_edit_products via RLS);
--     GRANT explícito por coluna para authenticated.

alter table public.fabrics
  add column price_per_kg_cents integer check (price_per_kg_cents >= 0 and price_per_kg_cents < 100000000),
  add column shrinkage_warp_pct numeric(4, 1) check (shrinkage_warp_pct >= 0 and shrinkage_warp_pct <= 50),
  add column shrinkage_weft_pct numeric(4, 1) check (shrinkage_weft_pct >= 0 and shrinkage_weft_pct <= 50);

grant insert (price_per_kg_cents, shrinkage_warp_pct, shrinkage_weft_pct) on public.fabrics to authenticated;
grant update (price_per_kg_cents, shrinkage_warp_pct, shrinkage_weft_pct) on public.fabrics to authenticated;

alter table public.products
  add column sewing_cents integer check (sewing_cents >= 0 and sewing_cents < 100000000),
  add column laundry_cents integer check (laundry_cents >= 0 and laundry_cents < 100000000),
  add column waste_pct numeric(4, 1) check (waste_pct >= 0 and waste_pct <= 50);

grant insert (sewing_cents, laundry_cents, waste_pct) on public.products to authenticated;
grant update (sewing_cents, laundry_cents, waste_pct) on public.products to authenticated;
