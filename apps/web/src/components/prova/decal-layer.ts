import * as THREE from "three";
import { decalPositions, type Decal } from "@alinhavo/cloth";

/** Quanto o acabamento fica acima da roupa desenhada, em mm (só visual, para não sumir dentro do tecido). */
const DECAL_LIFT = 1.5;
/** Cor da linha do pesponto (linha de pesponto contrastante, como no jeans). */
const STITCH_COLOR = 0xd9b45a;

/** Textura da etiqueta: fundo claro e o texto centrado, na proporção do retângulo. */
function labelTexture(text: string, aspect: number): THREE.CanvasTexture {
  const h = 128;
  const w = Math.max(32, Math.min(2048, Math.round(h * aspect)));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbf8f1";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c9c0b0";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = "#2b2823";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 64;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > w * 0.85) {
    size -= 4;
    ctx.font = `600 ${size}px system-ui, sans-serif`;
  }
  ctx.fillText(text, w / 2, h / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type Item = { decal: Decal; object: THREE.Line | THREE.Mesh; positions: Float32Array; dashed: boolean };

/**
 * Acabamentos desenhados sobre a roupa: linhas (pesponto, dentes do zíper) e
 * malhas (faixa do zíper, etiqueta, estampa) cujos pontos seguem a roupa
 * desenhada (`update`, a cada quadro). Mesmo grupo de coordenadas da roupa (mm).
 */
export class DecalLayer {
  readonly group = new THREE.Group();
  private items: Item[] = [];
  private textures: THREE.Texture[] = [];
  private normal = new Float32Array(0);

  constructor(decals: readonly Decal[]) {
    for (const decal of decals) {
      const positions = new Float32Array(decal.weights.length);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      let object: THREE.Line | THREE.Mesh;
      let dashed = false;
      if (decal.mode === "line") {
        dashed = decal.kind === "pesponto";
        const material = dashed
          ? new THREE.LineDashedMaterial({ color: STITCH_COLOR, dashSize: 4, gapSize: 2.5 })
          : new THREE.LineBasicMaterial({ color: 0xbdbdbd });
        object = new THREE.Line(geometry, material);
      } else {
        geometry.setIndex(new THREE.BufferAttribute(decal.indices ?? new Uint32Array(0), 1));
        if (decal.uv) geometry.setAttribute("uv", new THREE.BufferAttribute(decal.uv, 2));
        const material = new THREE.MeshStandardMaterial({
          color: decal.kind === "ziper" ? 0x3a3835 : 0xffffff,
          roughness: decal.kind === "ziper" ? 0.5 : 0.85,
          metalness: decal.kind === "ziper" ? 0.3 : 0,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        if (decal.kind === "etiqueta") {
          const texture = labelTexture(decal.text || "Etiqueta", decal.aspect ?? 2);
          this.textures.push(texture);
          material.map = texture;
        } else if (decal.kind === "estampa" && decal.image) {
          const texture = new THREE.TextureLoader().load(decal.image);
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textures.push(texture);
          material.map = texture;
          material.transparent = true;
          material.alphaTest = 0.05;
        }
        object = new THREE.Mesh(geometry, material);
      }
      object.renderOrder = 2;
      object.frustumCulled = false; // os pontos mudam a cada quadro
      this.group.add(object);
      this.items.push({ decal, object, positions, dashed });
    }
  }

  /** Acompanha a roupa desenhada (posições já afastadas do corpo e normais recalculadas). */
  update(garment: THREE.Mesh) {
    if (this.items.length === 0) return;
    const pos = garment.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    const nrm = garment.geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
    if (!pos || !nrm) return;
    const p = pos.array as Float32Array;
    const n = nrm.array as Float32Array;
    for (const item of this.items) {
      const out = decalPositions(item.decal, p, item.positions);
      if (this.normal.length < out.length) this.normal = new Float32Array(out.length);
      const normal = decalPositions(item.decal, n, this.normal);
      for (let k = 0; k < out.length; k += 3) {
        // Para fora: o lado da normal longe do eixo do corpo (como o afastamento da roupa).
        const sign = normal[k]! * out[k]! + normal[k + 2]! * out[k + 2]! >= 0 ? 1 : -1;
        const len = Math.hypot(normal[k]!, normal[k + 1]!, normal[k + 2]!) || 1;
        out[k] = out[k]! + (normal[k]! / len) * DECAL_LIFT * sign;
        out[k + 1] = out[k + 1]! + (normal[k + 1]! / len) * DECAL_LIFT * sign;
        out[k + 2] = out[k + 2]! + (normal[k + 2]! / len) * DECAL_LIFT * sign;
      }
      const geometry = item.object.geometry;
      (geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      if (item.dashed) (item.object as THREE.Line).computeLineDistances();
      if (item.decal.mode === "mesh") geometry.computeVertexNormals();
    }
  }

  dispose() {
    for (const { object } of this.items) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
    for (const t of this.textures) t.dispose();
    this.items = [];
    this.group.clear();
  }
}
