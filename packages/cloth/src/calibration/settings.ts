/**
 * Malha e iterações em que os tecidos são calibrados. Precisam ser os da
 * Prova (`PROVA_MESH_SPACING` e `PROVA_ITERATIONS` no app; um teste do app
 * confere): a flexão e o esticamento são por aresta da malha, então o mesmo
 * valor dá outro tecido numa malha de outro tamanho. Mudou a Prova, mude
 * aqui e rode a calibração de novo (`docs/10-calibracao-tecidos.md`).
 */
export const CALIBRATION_SPACING = 30;
export const CALIBRATION_ITERATIONS = 2;
