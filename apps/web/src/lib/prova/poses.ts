import type { BodyPose } from "@alinhavo/cloth";

/** Poses da Prova, na ordem da tela, com o que cada uma deixa avaliar. */
export const POSE_OPTIONS: { id: BodyPose; name: string; hint: string }[] = [
  { id: "em-pe", name: "Em pé", hint: "Postura neutra" },
  { id: "passo", name: "Passo", hint: "A perna ao caminhar" },
  { id: "braco-dobrado", name: "Braço dobrado", hint: "A manga com o cotovelo dobrado" },
  { id: "bracos-abertos", name: "Braços abertos", hint: "A cava e a lateral" },
];

export const POSE_NAME = Object.fromEntries(POSE_OPTIONS.map((p) => [p.id, p.name])) as Record<BodyPose, string>;

/** Saltos da tela, em mm (0 = descalço). */
export const HEEL_OPTIONS = [0, 30, 50, 80, 100, 120] as const;

export function heelName(mm: number): string {
  return mm <= 0 ? "Descalço" : `Salto de ${(mm / 10).toLocaleString("pt-BR")} cm`;
}
