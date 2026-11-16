/**
 * Simulação do tecido da Prova 3D. Funções puras, sem React nem navegador,
 * para rodar também dentro de um Web Worker. Medidas em milímetros.
 */
export * from "./mesh";
export * from "./uv";
export * from "./fabrics";
export * from "./collider";
export * from "./simulation";
export * from "./layers";
export * from "./decals";
export * from "./place";
export * from "./maps";
export * from "./body/types";
export * from "./body/measurements";
export {
  BELLY_RANGE,
  createMannequin,
  HEEL_RANGE,
  LIMB_IDS,
  LIMB_WHOLE,
  type BodyConditions,
  type BodyOverrides,
  type LimbId,
} from "./body/mannequin";
export { CALIBRATION_ITERATIONS, CALIBRATION_SPACING } from "./calibration/settings";
