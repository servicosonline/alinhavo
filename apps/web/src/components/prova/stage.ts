import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** Quanto a roupa é desenhada para fora da superfície dela, em mm (só visual). */
const GARMENT_LIFT = 4;

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
  private floor: THREE.Mesh;
  private frame = 0;
  private resize: ResizeObserver;

  constructor(
    private container: HTMLElement,
    ariaLabel: string,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf6f1e7);
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute("aria-label", ariaLabel);
    this.renderer.domElement.style.display = "block";
    container.appendChild(this.renderer.domElement);

    this.world.scale.setScalar(0.001);
    this.scene.add(this.world);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd6cbb5, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.5, 3, 2.5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-2, 2, -2);
    this.scene.add(rim);

    this.floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0xebe3d3, roughness: 1 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.setFloor(0.9, 0.9);
    this.scene.add(this.floor);

    this.camera.position.set(0.9, 1.25, 3.1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.95, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 6;
    this.controls.maxPolarAngle = Math.PI * 0.55;
    this.controls.update();

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(container);
    this.fit();
    const loop = () => {
      this.frame = requestAnimationFrame(loop);
      this.controls.update();
      this.beforeRender?.();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /** Chão elíptico, raios em X e em Z, em metros (o círculo deitado tem o Y local no Z). */
  setFloor(radiusX: number, radiusZ: number) {
    this.floor.scale.set(radiusX, radiusZ, 1);
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

  /** Chamado depois de a tela mudar de tamanho (a proporção já atualizada). */
  onResize: (() => void) | null = null;

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.controls.dispose();
    this.floor.geometry.dispose();
    (this.floor.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** Libera a geometria e o material de uma malha. */
export function disposeMesh(mesh: THREE.Mesh | null) {
  if (!mesh) return;
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

/** Malha do corpo. */
export function bodyMesh(positions: Float32Array, indices: Uint32Array): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xd9d2c5,
      roughness: 0.85,
      metalness: 0,
    }),
  );
}

/** Malha da roupa, já com as posições (pelo `liftGarment`). */
export function garmentMesh(positions: Float32Array, indices: Uint32Array, color: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions.length), 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
  );
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
 * volta à cor do tecido.
 */
export function paintGarment(mesh: THREE.Mesh, colors: Float32Array | null, fabricColor: string) {
  const material = mesh.material as THREE.MeshStandardMaterial;
  const geometry = mesh.geometry;
  if (colors) {
    const current = geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (current && current.array.length === colors.length) {
      (current.array as Float32Array).set(colors);
      current.needsUpdate = true;
    } else {
      geometry.setAttribute("color", new THREE.BufferAttribute(Float32Array.from(colors), 3));
    }
    material.color.set(0xffffff);
  } else {
    material.color.set(fabricColor);
  }
  if (material.vertexColors !== !!colors) {
    material.vertexColors = !!colors;
    material.needsUpdate = true;
  }
}
