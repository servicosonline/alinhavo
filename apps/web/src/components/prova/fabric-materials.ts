import * as THREE from "three";
import type { FabricId } from "@/lib/prova/protocol";
import type { RenderQuality } from "@/lib/prova/quality";
import { FABRIC_LOOK, heatherColor, heightToNormal, WEAVE_SIZE, weaveTile } from "@/lib/prova/weave";

/** Textura de cor do tecido (o mesclado), guardada em `userData` do material (a vista "Fio" troca o `map` e volta para ela). */
export const WEAVE_MAP_KEY = "weaveMap";

type WeaveTextures = { normal: THREE.DataTexture; color: THREE.DataTexture };

/** Texturas PBR de scan real (normal + roughness), carregadas sob demanda. */
type ScannedTextures = { normal: THREE.Texture; roughness: THREE.Texture };

/** Presets que têm texturas escaneadas disponíveis em `/textures/fabrics/<preset>/`. */
const SCANNED_PRESETS: ReadonlySet<string> = new Set(["chiffon", "linho", "viscose", "jeans", "malha", "planoLeve"]);

/**
 * Materiais de tecido da Prova. As texturas da trama são geradas uma vez por
 * tecido (por palco) e divididas entre os materiais; cada malha ganha
 * materiais próprios (a pintura dos mapas muda cor e `vertexColors` de cada
 * um). Os materiais vão embora com a malha (`disposeMesh`); as texturas, no
 * `dispose` daqui.
 */
export class FabricLibrary {
  private textures = new Map<FabricId, WeaveTextures>();
  /** Texturas PBR de scan real, carregadas sob demanda e cacheadas. */
  private scannedCache = new Map<string, ScannedTextures | null>();
  private loader = new THREE.TextureLoader();
  /** Foto do tecido cadastrado (cor e estampa de verdade), só no molde em prova. */
  private photo: THREE.Texture | null = null;

  constructor(private maxAnisotropy = 1) {}

  /** Troca a foto do tecido (a anterior é descartada). Quem chama refaz os materiais. */
  setPhoto(photo: THREE.Texture | null) {
    if (this.photo && this.photo !== photo) this.photo.dispose();
    this.photo = photo;
  }

  /**
   * Carrega texturas PBR de scan real (`normal.webp` + `roughness.webp`) para um preset.
   * Retorna `null` se o preset não tiver scan ou se os arquivos não existirem.
   * O resultado é cacheado; chamadas subsequentes são síncronas (cache hit).
   */
  private loadScanned(fabric: FabricId): ScannedTextures | null {
    if (!SCANNED_PRESETS.has(fabric)) return null;
    const cached = this.scannedCache.get(fabric);
    if (cached !== undefined) return cached;

    // Tenta carregar; se falhar, marca como null (sem scan disponível).
    try {
      const look = FABRIC_LOOK[fabric];
      const base = `/textures/fabrics/${fabric}`;
      const normal = this.loader.load(`${base}/normal.webp`);
      const roughness = this.loader.load(`${base}/roughness.webp`);
      for (const t of [normal, roughness]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.NoColorSpace;
        t.repeat.set(1 / look.tileMm, 1 / look.tileMm);
        t.anisotropy = this.maxAnisotropy;
      }
      const out: ScannedTextures = { normal, roughness };
      this.scannedCache.set(fabric, out);
      return out;
    } catch {
      this.scannedCache.set(fabric, null);
      return null;
    }
  }

  /** `usePhoto`: a roupa do molde em prova, que veste a foto do tecido (se houver) no lugar do mesclado. */
  material(fabric: FabricId, color: string, quality: RenderQuality, usePhoto = false): THREE.MeshStandardMaterial {
    const look = FABRIC_LOOK[fabric];
    const photo = usePhoto ? this.photo : null;
    if (quality === "leve") {
      const material = new THREE.MeshStandardMaterial({ color, roughness: look.roughness, side: THREE.DoubleSide, map: photo });
      if (photo) material.userData[WEAVE_MAP_KEY] = photo;
      return material;
    }
    const tex = this.weave(fabric);
    const scanned = this.loadScanned(fabric);
    const map = photo ?? tex.color;
    // Scan real tem prioridade sobre a trama procedural para normal e roughness.
    const normalMap = scanned?.normal ?? tex.normal;
    const roughnessMap = scanned?.roughness ?? undefined;
    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: look.roughness,
      ...(roughnessMap ? { roughnessMap } : {}),
      sheen: look.sheen,
      sheenRoughness: look.sheenRoughness,
      sheenColor: new THREE.Color(0xffffff),
      map,
      normalMap,
      normalScale: new THREE.Vector2(look.normalScale, look.normalScale),
      side: THREE.DoubleSide,
      // Translucidez (SSS aproximado): só tecidos finos com `transmission` definido.
      // A cena está em metros (escala 0,001) e `attenuationDistance` em mm.
      transmission: look.transmission ?? 0,
      thickness: look.attenuationDistance !== undefined ? look.attenuationDistance * 0.001 : 0,
      attenuationDistance: look.attenuationDistance !== undefined ? look.attenuationDistance * 0.001 : Infinity,
      ...(look.attenuationColor ? { attenuationColor: new THREE.Color(look.attenuationColor) } : {}),
    });
    material.userData[WEAVE_MAP_KEY] = map;
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
    this.photo?.dispose();
    this.photo = null;
    for (const t of this.textures.values()) {
      t.normal.dispose();
      t.color.dispose();
    }
    this.textures.clear();
    for (const s of this.scannedCache.values()) {
      if (s) {
        s.normal.dispose();
        s.roughness.dispose();
      }
    }
    this.scannedCache.clear();
  }
}
