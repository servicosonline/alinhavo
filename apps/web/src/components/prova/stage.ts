import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { clampLook } from "@/lib/prova/camera";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { ProvaPart } from "@/lib/prova/protocol";
import type { RenderQuality } from "@/lib/prova/quality";
import { FabricLibrary, WEAVE_MAP_KEY } from "./fabric-materials";

/** Quanto a roupa é desenhada para fora da superfície dela, em mm (só visual). */
const GARMENT_LIFT = 4;

/** Força da luz de ambiente (reflexo da sala); o resto vem da luz principal. */
const ENVIRONMENT_INTENSITY = 0.4;

/** Folga da caixa de sombra da luz principal além do chão, em metros. */
const SHADOW_MARGIN = 0.4;

/**
 * Palco das cenas da Prova (um tamanho e grade inteira): renderer, luz, chão,
 * câmera com órbita e o laço de desenho. Os dados chegam em mm (Y para cima);
 * a cena trabalha em metros, então `world` tem escala 0,001.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  readonly controls: OrbitControls;
  readonly world = new THREE.Group();
  /** Materiais de tecido (texturas da trama divididas pelas malhas deste palco). */
  readonly fabrics: FabricLibrary;
  private quality: RenderQuality = "alta";
  private floor: THREE.Mesh;
  private key: THREE.DirectionalLight;
  private environment: THREE.Texture;
  private frame = 0;
  private resize: ResizeObserver;
  private home = { position: new THREE.Vector3(), target: new THREE.Vector3() };

  constructor(
    private container: HTMLElement,
    ariaLabel: string,
    /** Botão do meio move só para cima e para baixo (o corpo fica no centro). Sem isso, também para o lado (grade). */
    options: { lockHorizontal?: boolean } = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf6f1e7);
    // Tone mapping "PBR Neutral" (Khronos): feito para foto de produto, quase
    // não muda a cor do tecido (o AgX e o ACES desbotam ou puxam o matiz).
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute("aria-label", ariaLabel);
    this.renderer.domElement.style.display = "block";
    container.appendChild(this.renderer.domElement);
    this.fabrics = new FabricLibrary(this.renderer.capabilities.getMaxAnisotropy());

    this.world.scale.setScalar(0.001);
    this.scene.add(this.world);

    // Luz de estúdio: ambiente refletido de uma sala clara (RoomEnvironment,
    // do próprio three, sem arquivo), luz principal com sombra e contraluz.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = ENVIRONMENT_INTENSITY;

    this.key = new THREE.DirectionalLight(0xfff6ea, 2.6);
    this.key.position.set(1.2, 3, 2);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.012;
    this.key.shadow.radius = 4;
    this.key.shadow.camera.near = 0.5;
    this.key.shadow.camera.far = 7;
    this.scene.add(this.key);
    this.scene.add(this.key.target);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(-2, 2.2, -2.2);
    this.scene.add(rim);

    this.floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0xebe3d3, roughness: 1 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.setFloor(0.9, 0.9);
    this.scene.add(this.floor);

    this.camera.position.set(0.9, 1.25, 3.1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.95, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 6;
    this.controls.maxPolarAngle = Math.PI * 0.55;
    // Botão do meio move a câmera (o padrão do three é aproximar, que já é da roda).
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    // Toque: um dedo gira e dois dedos aproximam e movem a câmera para qualquer lado. Enquanto o dedo
    // está na cena a página não rola (a cena tem 60% da altura do celular: rola-se pelo resto da tela).
    const canvas = this.renderer.domElement;
    canvas.style.touchAction = "none";
    canvas.style.overscrollBehavior = "contain";
    // O Safari antigo ignora o touch-action em parte: segura a rolagem também pelo evento de toque.
    canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    // Com o mouse, a Prova de um tamanho só move para cima e para baixo; com o dedo, move livre
    // (o botão "Centralizar" traz o corpo de volta).
    let touching = false;
    canvas.addEventListener("pointerdown", (e) => {
      touching = e.pointerType === "touch";
    });
    const lockAxis = options.lockHorizontal ? { x: 0, z: 0 } : null;
    // No Windows, o clique do meio abre a rolagem automática da página por cima da Prova.
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 1) e.preventDefault();
    });
    this.controls.addEventListener("change", () => clampLook(this.controls.target, this.camera.position, touching ? null : lockAxis));
    this.controls.update();
    this.saveHome();

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(container);
    this.fit();
    const loop = () => {
      this.frame = requestAnimationFrame(loop);
      this.controls.update();
      this.animate?.();
      this.beforeRender?.();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /** Guarda a câmera de agora como o enquadramento inicial (o que "Centralizar" devolve). */
  saveHome() {
    this.home = { position: this.camera.position.clone(), target: this.controls.target.clone() };
  }

  /** Volta a câmera ao enquadramento inicial. */
  resetView() {
    this.camera.position.copy(this.home.position);
    this.controls.target.copy(this.home.target);
    this.controls.update();
  }

  /** Chão elíptico, raios em X e em Z, em metros (o círculo deitado tem o Y local no Z). */
  setFloor(radiusX: number, radiusZ: number) {
    this.floor.scale.set(radiusX, radiusZ, 1);
    // A caixa da sombra acompanha o chão (na grade, a fileira de corpos).
    const shadow = this.key.shadow.camera;
    const half = Math.max(radiusX, radiusZ) + SHADOW_MARGIN;
    shadow.left = -half;
    shadow.right = half;
    shadow.top = half;
    shadow.bottom = -half;
    shadow.updateProjectionMatrix();
  }

  /**
   * "leve" desliga a sombra e desenha com menos pixels. Os materiais da roupa
   * são de quem monta a malha (`FabricLibrary.material` com a qualidade).
   */
  setQuality(quality: RenderQuality) {
    if (quality === this.quality) return;
    this.quality = quality;
    const alta = quality === "alta";
    this.renderer.shadowMap.enabled = alta;
    this.key.castShadow = alta;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, alta ? 2 : 1.25));
    // Ligar ou desligar a sombra muda os shaders de todos os materiais.
    this.scene.traverse((obj) => {
      const material = (obj as THREE.Mesh).material;
      if (!material) return;
      for (const m of Array.isArray(material) ? material : [material]) m.needsUpdate = true;
    });
    this.fit();
  }

  /** Largura ÷ altura da tela. */
  get aspect() {
    return this.camera.aspect;
  }

  private fit() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize?.();
  }

  /** Chamado a cada quadro, depois dos controles e antes de desenhar (ex.: a volta do vídeo 360°). */
  beforeRender: (() => void) | null = null;
  /** Animação da cena (o movimento tocando), chamada antes de `beforeRender`: a gravação do vídeo pega o movimento junto. */
  animate: (() => void) | null = null;

  /** Chamado depois de a tela mudar de tamanho (a proporção já atualizada). */
  onResize: (() => void) | null = null;

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.controls.dispose();
    this.floor.geometry.dispose();
    (this.floor.material as THREE.Material).dispose();
    this.key.shadow.dispose();
    this.environment.dispose();
    this.fabrics.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** Libera a geometria e o material de uma malha. */
export function disposeMesh(mesh: THREE.Mesh | null) {
  if (!mesh) return;
  mesh.geometry.dispose();
  const material = mesh.material;
  for (const m of Array.isArray(material) ? material : [material]) m.dispose();
}

/** Malha do corpo. */
export function bodyMesh(positions: Float32Array, indices: Uint32Array): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xd9d2c5,
      roughness: 0.85,
      metalness: 0,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Os triângulos de uma roupa do look (do `ProvaPart`) e o material dela. */
export type GarmentGroup = { triStart: number; triCount: number; material: THREE.Material };

/**
 * Um grupo por roupa, com o material do tecido dela. Sem roupas (não
 * deveria acontecer), a malha inteira com o tecido padrão.
 */
export function garmentGroups(
  fabrics: FabricLibrary,
  parts: readonly Pick<ProvaPart, "triStart" | "triCount" | "fabric" | "main">[],
  triangleCount: number,
  color: string,
  quality: RenderQuality,
): GarmentGroup[] {
  if (parts.length === 0) return [{ triStart: 0, triCount: triangleCount, material: fabrics.material("planoLeve", color, quality) }];
  return parts.map((p) => ({ triStart: p.triStart, triCount: p.triCount, material: fabrics.material(p.fabric, color, quality, p.main) }));
}

/**
 * Malha da roupa, já com as posições (pelo `liftGarment`). `uv` (2 floats por
 * vértice, em mm no tecido plano) é fixo: a topologia não muda na simulação.
 * Cada roupa do look é um grupo de triângulos com o material do seu tecido.
 */
export function garmentMesh(positions: Float32Array, indices: Uint32Array, groups: readonly GarmentGroup[], uv?: Float32Array): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions.length), 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  if (uv && uv.length === (positions.length / 3) * 2) geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  groups.forEach((g, i) => geometry.addGroup(g.triStart * 3, g.triCount * 3, i));
  const mesh = new THREE.Mesh(
    geometry,
    groups.map((g) => g.material),
  );
  // A roupa faz sombra no corpo e no chão, mas não recebe: é uma malha fina
  // dos dois lados e, recebendo, a frente ficava toda na sombra dela mesma
  // (granulado ou a saia inteira escura, conforme o bias).
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  liftGarment(mesh, positions);
  return mesh;
}

/**
 * Novas posições da roupa (mesma topologia). Só no desenho, a roupa sai
 * GARMENT_LIFT mm para fora da sua superfície: os triângulos são planos e,
 * entre vértices encostados no corpo, cortariam a curva dele (o corpo
 * apareceria através do tecido). A simulação não muda. O "fora" é o lado
 * longe do eixo do corpo (X = Z = 0 nas coordenadas da malha).
 * Devolve false se a topologia não bate (posições de outra roupa).
 */
export function liftGarment(mesh: THREE.Mesh, positions: Float32Array): boolean {
  const geometry = mesh.geometry;
  const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
  if (attr.array.length !== positions.length) return false;
  const out = attr.array as Float32Array;
  out.set(positions);
  attr.needsUpdate = true;
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const n = normals.array as Float32Array;
  for (let i = 0; i < out.length; i += 3) {
    const outward = n[i]! * out[i]! + n[i + 2]! * out[i + 2]! >= 0 ? 1 : -1;
    out[i] = out[i]! + n[i]! * GARMENT_LIFT * outward;
    out[i + 1] = out[i + 1]! + n[i + 1]! * GARMENT_LIFT * outward;
    out[i + 2] = out[i + 2]! + n[i + 2]! * GARMENT_LIFT * outward;
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return true;
}

/**
 * Cores por vértice (mapa de pressão ou folga, 3 floats por vértice); null
 * volta à cor do tecido. Com `map` (textura no UV do molde, ex.: a grade do
 * fio), a textura aparece na cor dela, sem a cor do tecido nem a trama por
 * cima; sem ele, cada material volta à textura da trama dele (se tiver).
 */
export function paintGarment(mesh: THREE.Mesh, colors: Float32Array | null, fabricColor: string, map: THREE.Texture | null = null) {
  const geometry = mesh.geometry;
  const textured = !!map && !!geometry.getAttribute("uv");
  if (colors && !textured) {
    const current = geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (current && current.array.length === colors.length) {
      (current.array as Float32Array).set(colors);
      current.needsUpdate = true;
    } else {
      geometry.setAttribute("color", new THREE.BufferAttribute(Float32Array.from(colors), 3));
    }
  }
  const vertexColors = !!colors && !textured;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of materials) {
    const material = m as THREE.MeshStandardMaterial;
    const nextMap = textured ? map : ((material.userData[WEAVE_MAP_KEY] as THREE.Texture | undefined) ?? null);
    if (material.map !== nextMap) {
      material.map = nextMap;
      material.needsUpdate = true;
    }
    material.color.set(textured || vertexColors ? 0xffffff : fabricColor);
    if (material.vertexColors !== vertexColors) {
      material.vertexColors = vertexColors;
      material.needsUpdate = true;
    }
  }
}
