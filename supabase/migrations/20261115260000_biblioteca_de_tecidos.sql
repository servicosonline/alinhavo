-- Biblioteca de tecidos da Prova: 12 presets (era 3) e o tecido cadastrado com
-- propriedades próprias e foto.
--
--   * preset: o comportamento de partida (packages/cloth/src/fabrics.ts).
--   * stretch_pct: quanto estica na trama (%), o limite do mapa de pressão.
--   * drape: caimento de 1 (armado) a 5 (fluido); 3 é o do preset.
--   * thickness_mm: espessura (até 2,5 mm, o que o colisor da Prova garante).
--   * texture / texture_cm: foto do tecido (data URL, a mesma regra da estampa
--     do molde: até 200 000 caracteres) e a largura real que ela mostra, em cm.
-- A gramatura que já existia (weight_gsm) passa a valer também na Prova.

alter table public.fabrics drop constraint fabrics_preset_check;
alter table public.fabrics add constraint fabrics_preset_check check (
  preset in ('malha', 'planoLeve', 'jeans', 'tricoline', 'viscose', 'linho', 'crepe', 'chiffon', 'sarja', 'jeansElastano', 'ribana', 'moletom')
);

alter table public.fabrics
  add column stretch_pct numeric(4, 1) check (stretch_pct between 1 and 100),
  add column drape smallint check (drape between 1 and 5),
  add column thickness_mm numeric(3, 1) check (thickness_mm between 0.1 and 2.5),
  add column texture text check (
    texture is null or (char_length(texture) <= 200000 and texture ~ '^data:image/(png|jpeg|webp);base64,')
  ),
  add column texture_cm numeric(5, 1) check (texture_cm between 1 and 300);

grant insert (stretch_pct, drape, thickness_mm, texture, texture_cm) on public.fabrics to authenticated;
grant update (stretch_pct, drape, thickness_mm, texture, texture_cm) on public.fabrics to authenticated;
