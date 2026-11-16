/**
 * Roda a calibração: lê `calibration/medidas.json`, ajusta cada amostra,
 * faz a média por preset e grava `calibration/resultado.json`. Não muda
 * `fabrics.ts`: quem copia os valores é uma pessoa, depois de olhar os avisos.
 *
 *   npm run calibrate -w @alinhavo/cloth
 *
 * Roda pelo Vitest (é o executor de TypeScript que o pacote já tem), com a
 * configuração própria em `calibration/vitest.config.ts`; fica fora do
 * `npm test`, porque o nome não termina em `.test.ts`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { it } from "vitest";
import { FABRICS, type Fabric, type FabricPreset } from "../fabrics";
import { discDrape } from "./bench";
import { averageFabric, fitSample, type SampleFit } from "./fit";
import { readSamples } from "./measurements";
import { CALIBRATION_ITERATIONS, CALIBRATION_SPACING } from "./settings";

const dir = new URL("../../calibration/", import.meta.url);

it("ajusta os tecidos às medidas", () => {
  const samples = readSamples(JSON.parse(readFileSync(new URL("medidas.json", dir), "utf8")));
  const fits: SampleFit[] = [];
  for (const s of samples) {
    console.log(`ajustando ${s.id} (${s.preset})…`);
    fits.push(fitSample(s));
  }
  const presets = [...new Set(samples.map((s) => s.preset))] as FabricPreset[];
  const proposals = presets.map((id) => {
    const mine = fits.filter((_, i) => samples[i]!.preset === id);
    const proposed = averageFabric(FABRICS[id], mine.map((f) => f.fabric));
    // Quanto a malha de 30 mm esconde: o mesmo tecido numa malha de 10 mm.
    const coarse = discDrape(proposed);
    const fine = discDrape(proposed, { spacing: 10 });
    return {
      preset: id,
      amostras: mine.map((f) => f.sampleId),
      atual: FABRICS[id],
      proposto: round(proposed),
      disco: { ccMalhaDaProva: coarse.cc, ccMalha10mm: fine.cc, ondasMalhaDaProva: coarse.waves, ondasMalha10mm: fine.waves },
      avisos: mine.flatMap((f) => f.warnings.map((w) => `${f.sampleId}: ${w}`)),
    };
  });
  const out = {
    geradoEm: new Date().toISOString().slice(0, 10),
    malha: { espacamentoMm: CALIBRATION_SPACING, iteracoes: CALIBRATION_ITERATIONS },
    amostras: fits.map((f) => ({ ...f, fabric: round(f.fabric) })),
    presets: proposals,
  };
  writeFileSync(new URL("resultado.json", dir), `${JSON.stringify(out, null, 2)}\n`);
  if (samples.length === 0) console.log("Nenhuma amostra em medidas.json ainda (fase A do plano).");
  for (const p of proposals) {
    console.log(`\n${p.preset} (${p.amostras.length} amostra(s))`);
    console.log(`  flexão ${p.atual.bend.toExponential(2)} → ${p.proposto.bend.toExponential(2)}`);
    for (const k of ["warp", "weft", "bias"] as const) {
      console.log(`  esticamento ${k} ${p.atual.stretch[k].toExponential(2)} → ${p.proposto.stretch[k].toExponential(2)}`);
    }
    console.log(`  limite ${p.atual.maxStretch} → ${p.proposto.maxStretch}; gramatura ${p.atual.density} → ${p.proposto.density}`);
    console.log(`  disco: CC ${p.disco.ccMalhaDaProva.toFixed(2)} na malha da Prova, ${p.disco.ccMalha10mm.toFixed(2)} em 10 mm`);
    for (const a of p.avisos) console.log(`  ! ${a}`);
  }
  console.log("\nResultado em packages/cloth/calibration/resultado.json");
}, 3_600_000);

/** Três algarismos significativos: o resultado é para ler e copiar. */
function round(f: Fabric): Fabric {
  const r = (x: number) => Number(x.toPrecision(3));
  return {
    ...f,
    density: r(f.density),
    thickness: r(f.thickness),
    friction: r(f.friction),
    maxStretch: r(f.maxStretch),
    bend: r(f.bend),
    stretch: { warp: r(f.stretch.warp), weft: r(f.stretch.weft), bias: r(f.stretch.bias) },
  };
}
