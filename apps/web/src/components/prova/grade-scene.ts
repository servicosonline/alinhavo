import * as THREE from "three";
import type { Decal } from "@alinhavo/cloth";
import { GRADE_SPACING_MM, gradeCameraDistance, gradeOffsets } from "@/lib/prova/grade";
import { DecalLayer } from "./decal-layer";
import { bodyMesh, disposeMesh, garmentMesh, liftGarment, paintGarment, Stage } from "./stage";

type Slot = {
  group: THREE.Group;
  body: THREE.Mesh | null;
  garment: THREE.Mesh | null;
  decals: DecalLayer | null;
  label: THREE.Sprite;
};

/** Plaquinha com o nome do tamanho (textura de canvas), em mm. */
function labelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2b2823";
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 112, 24);
  ctx.fill();
  ctx.fillStyle = "#f6f1e7";
  ctx.font = "600 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.length > 6 ? `${text.slice(0, 6)}…` : text, 128, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(200, 100, 1);
  sprite.renderOrder = 5;
  return sprite;
}

/**
 * Cena 3D da grade inteira: um corpo e uma roupa por tamanho, lado a lado em X,
 * com o nome do tamanho acima da cabeça. Cada tamanho vive num grupo deslocado,
 * então as posições continuam no sistema do corpo (o afastamento visual da
 * roupa depende disso). Sem React: a tela cria, alimenta e descarta.
 */
export class GradeScene {
  private stage: Stage;
  private slots: Slot[] = [];

  constructor(container: HTMLElement) {
    this.stage = new Stage(container, "Prova 3D da grade: um manequim por tamanho, lado a lado");
    // Tela de outro tamanho (celular girado, painel aberto): a fileira volta a caber.
    this.stage.onResize = () => this.frameRow();
  }

  /** Câmera de frente, afastada o bastante para a fileira caber na largura da tela. */
  private frameRow() {
    const count = this.slots.length;
    if (count === 0) return;
    const d = gradeCameraDistance(count, this.stage.aspect);
    const { camera, controls } = this.stage;
    controls.target.set(0, 0.95, 0);
    camera.position.set(0, 1.2, d);
    controls.maxDistance = Math.max(6, d * 1.6);
    controls.update();
  }

  /** Recomeça com um lugar por tamanho (na ordem da grade) e enquadra a fileira de frente. */
  setSizes(sizes: readonly string[]) {
    this.clear();
    const offsets = gradeOffsets(sizes.length);
    this.slots = sizes.map((size, i) => {
      const group = new THREE.Group();
      group.position.x = offsets[i]!;
      const label = labelSprite(size);
      label.position.set(0, 1950, 0);
      group.add(label);
      this.stage.world.add(group);
      return { group, body: null, garment: null, decals: null, label };
    });
    const halfRow = ((sizes.length - 1) * GRADE_SPACING_MM) / 2000;
    this.stage.setFloor(halfRow + 0.9, 0.9);
    this.frameRow();
  }

  private replace(group: THREE.Group, old: THREE.Mesh | null, next: THREE.Mesh) {
    if (old) {
      group.remove(old);
      disposeMesh(old);
    }
    group.add(next);
    return next;
  }

  setBody(i: number, positions: Float32Array, indices: Uint32Array) {
    const slot = this.slots[i];
    if (!slot) return;
    slot.body = this.replace(slot.group, slot.body, bodyMesh(positions, indices));
    // A plaquinha fica um pouco acima da cabeça deste corpo.
    slot.body.geometry.computeBoundingBox();
    slot.label.position.y = (slot.body.geometry.boundingBox?.max.y ?? 1800) + 150;
  }

  /** A roupa de um tamanho e os acabamentos sobre ela. */
  setGarment(i: number, positions: Float32Array, indices: Uint32Array, color: string, decals: readonly Decal[] = []) {
    const slot = this.slots[i];
    if (!slot) return;
    slot.garment = this.replace(slot.group, slot.garment, garmentMesh(positions, indices, color));
    if (slot.decals) {
      slot.group.remove(slot.decals.group);
      slot.decals.dispose();
    }
    slot.decals = new DecalLayer(decals);
    slot.group.add(slot.decals.group);
    slot.decals.update(slot.garment);
  }

  updateGarment(i: number, positions: Float32Array) {
    const slot = this.slots[i];
    if (slot?.garment && liftGarment(slot.garment, positions)) slot.decals?.update(slot.garment);
  }

  /** Cores por vértice de um tamanho (mapa); null volta à cor do tecido. */
  setMapColors(i: number, colors: Float32Array | null, fabricColor: string) {
    const garment = this.slots[i]?.garment;
    if (garment) paintGarment(garment, colors, fabricColor);
  }

  private clear() {
    for (const slot of this.slots) {
      this.stage.world.remove(slot.group);
      disposeMesh(slot.body);
      disposeMesh(slot.garment);
      slot.decals?.dispose();
      const material = slot.label.material;
      material.map?.dispose();
      material.dispose();
    }
    this.slots = [];
  }

  dispose() {
    this.clear();
    this.stage.dispose();
  }
}
