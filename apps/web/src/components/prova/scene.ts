import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** Quanto a roupa é desenhada para fora da superfície dela, em mm (só visual). */
const GARMENT_LIFT = 4;

/**
 * Cena 3D da Prova: corpo, roupa, luz e chão. As posições chegam em mm
 * (Y para cima); a cena trabalha em metros, então o grupo tem escala 0,001.
 * Sem React: a página cria, alimenta e descarta.
 */
export class ProvaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  private controls: OrbitControls;
  private world = new THREE.Group();
  private body: THREE.Mesh | null = null;
  private garment: THREE.Mesh | null = null;
  private frame = 0;
  private resize: ResizeObserver;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf6f1e7);
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute("aria-label", "Prova 3D: a roupa no manequim");
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

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 48),
      new THREE.MeshStandardMaterial({ color: 0xebe3d3, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

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
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  private fit() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private replace(old: THREE.Mesh | null, next: THREE.Mesh): THREE.Mesh {
    if (old) {
      this.world.remove(old);
      old.geometry.dispose();
      (old.material as THREE.Material).dispose();
    }
    this.world.add(next);
    return next;
  }

  setBody(positions: Float32Array, indices: Uint32Array) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.85, metalness: 0 });
    this.body = this.replace(this.body, new THREE.Mesh(geometry, material));
  }

  setGarment(positions: Float32Array, indices: Uint32Array, color: string) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions.length), 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
    this.garment = this.replace(this.garment, new THREE.Mesh(geometry, material));
    this.updateGarment(positions);
  }

  /**
   * Cores por vértice (mapa de pressão ou folga, 3 floats por vértice); null
   * volta à cor do tecido.
   */
  setMapColors(colors: Float32Array | null, fabricColor: string) {
    if (!this.garment) return;
    const material = this.garment.material as THREE.MeshStandardMaterial;
    const geometry = this.garment.geometry;
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

  /**
   * Novas posições da roupa (mesma topologia). Só no desenho, a roupa sai
   * GARMENT_LIFT mm para fora da sua superfície: os triângulos são planos e,
   * entre vértices encostados no corpo, cortariam a curva dele (o corpo
   * apareceria através do tecido). A simulação não muda.
   */
  updateGarment(positions: Float32Array) {
    if (!this.garment) return;
    const geometry = this.garment.geometry;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    if (attr.array.length !== positions.length) return;
    const out = attr.array as Float32Array;
    out.set(positions);
    attr.needsUpdate = true;
    geometry.computeVertexNormals();
    // A normal aponta para um lado da superfície; o "fora" é o lado longe do eixo do corpo.
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
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.controls.dispose();
    for (const mesh of [this.body, this.garment]) {
      if (!mesh) continue;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
