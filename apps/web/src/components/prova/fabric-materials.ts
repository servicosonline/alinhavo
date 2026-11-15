import * as THREE from "three";
import type { FabricId } from "@/lib/prova/protocol";
import type { RenderQuality } from "@/lib/prova/quality";
import { FABRIC_LOOK, heatherColor, heightToNormal, WEAVE_SIZE, weaveTile } from "@/lib/prova/weave";

/** Textura de cor do tecido (o mesclado), guardada em `userData` do material (a vista "Fio" troca o `map` e volta para ela). */
export const WEAVE_MAP_KEY = "weaveMap";

type WeaveTextures = { normal: THREE.DataTexture; color: THREE.DataTexture };

/**
 * Materiais de tecido da Prova. As texturas da trama são geradas uma vez por
 * tecido (por palco) e divididas entre os materiais; cada malha ganha
 * materiais próprios (a pintura dos mapas muda cor e `vertexColors` de cada
 * um). Os materiais vão embora com a malha (`disposeMesh`); as texturas, no
 * `dispose` daqui.
 */
export class FabricLibrary {
  private textures = new Map<FabricId, WeaveTextures>();

  constructor(private maxAnisotropy = 1) {}

  material(fabric: FabricId, color: string, quality: RenderQuality): THREE.MeshStandardMaterial {
    const look = FABRIC_LOOK[fabric];
    if (quality === "leve") {
      return new THREE.MeshStandardMaterial({ color, roughness: look.roughness, side: THREE.DoubleSide });
    }
    const tex = this.weave(fabric);
    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: look.roughness,
      sheen: look.sheen,
      sheenRoughness: look.sheenRoughness,
      sheenColor: new THREE.Color(0xffffff),
      map: tex.color,
      normalMap: tex.normal,
      normalScale: new THREE.Vector2(look.normalScale, look.normalScale),
      side: THREE.DoubleSide,
    });
    material.userData[WEAVE_MAP_KEY] = tex.color;
    return material;
  }

  private weave(fabric: FabricId): WeaveTextures {
    const cached = this.textures.get(fabric);
    if (cached) return cached;
    const look = FABRIC_LOOK[fabric];
    const tile = weaveTile(look.weave, look.threads, WEAVE_SIZE);
    const normal = this.texture(heightToNormal(tile.height, WEAVE_SIZE, 6), look.tileMm, THREE.NoColorSpace);
    // Cada tecido com a sua semente: dois tecidos lado a lado no look não repetem o mesmo desenho.
    const seed = fabric.length * 31 + fabric.charCodeAt(0);
    const color = this.texture(heatherColor(WEAVE_SIZE, look.heatherStreaks, look.heather, seed), look.heatherMm, THREE.SRGBColorSpace);
    const out = { normal, color };
    this.textures.set(fabric, out);
    return out;
  }

  private texture(data: Uint8Array, tileMm: number, colorSpace: THREE.ColorSpace): THREE.DataTexture {
    const texture = new THREE.DataTexture(data, WEAVE_SIZE, WEAVE_SIZE, THREE.RGBAFormat);
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // O UV da roupa está em mm de tecido: um ladrilho a cada tileMm.
    texture.repeat.set(1 / tileMm, 1 / tileMm);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = this.maxAnisotropy;
    texture.needsUpdate = true;
    return texture;
  }

  dispose() {
    for (const t of this.textures.values()) {
      t.normal.dispose();
      t.color.dispose();
    }
    this.textures.clear();
  }
}
