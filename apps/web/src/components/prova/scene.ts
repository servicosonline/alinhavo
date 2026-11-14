import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { frontmostLine, nearestLine } from "@/lib/prova/edges";

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
  /** Posições da roupa como a simulação mandou (sem o afastamento visual). */
  private raw: Float32Array | null = null;
  private edgeLines: Uint32Array = new Uint32Array(0);
  private edgeOwner: Int32Array = new Int32Array(0);
  private selected: number | null = null;
  private highlight: THREE.Group | null = null;
  private pick: ((owner: number | null) => void) | null = null;
  private pointerStart: { x: number; y: number } | null = null;
  private raycaster = new THREE.Raycaster();

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

    // Clique (sem arrastar) escolhe a borda; arrastar continua girando a câmera.
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);

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
    this.raw = positions;
    this.updateHighlight();
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

  /**
   * Imagem da roupa para a aprovação (JPEG, 900 × 1200 px). "atual" usa a
   * câmera como está; frente, costas e lado giram em volta do corpo (a
   * esquerda do corpo fica em +X). O destaque de borda não sai na imagem, e
   * a câmera e o tamanho da tela voltam como estavam.
   */
  capture(angle: "atual" | "frente" | "costas" | "lado"): string {
    const W = 900;
    const H = 1200;
    const camPos = this.camera.position.clone();
    const target = this.controls.target.clone();
    const aspect = this.camera.aspect;
    const size = this.renderer.getSize(new THREE.Vector2());
    const pixelRatio = this.renderer.getPixelRatio();
    const highlightVisible = this.highlight?.visible ?? false;
    try {
      if (this.highlight) this.highlight.visible = false;
      if (angle !== "atual") {
        const d = 3.1;
        this.controls.target.set(0, 0.95, 0);
        if (angle === "frente") this.camera.position.set(0, 1.15, d);
        else if (angle === "costas") this.camera.position.set(0, 1.15, -d);
        else this.camera.position.set(d, 1.15, 0);
        this.camera.lookAt(this.controls.target);
      }
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(W, H, false);
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL("image/jpeg", 0.85);
    } finally {
      if (this.highlight) this.highlight.visible = highlightVisible;
      this.camera.position.copy(camPos);
      this.controls.target.copy(target);
      this.camera.lookAt(target);
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(size.x, size.y, false);
      this.controls.update();
    }
  }

  /** Bordas clicáveis (pares de vértices) e o segmento do molde de cada uma. Limpa a seleção. */
  setEdges(lines: Uint32Array, owner: Int32Array) {
    this.edgeLines = lines;
    this.edgeOwner = owner;
    this.setSelected(null);
  }

  /** Chamado com o índice do segmento escolhido (ou null, clique fora das bordas). */
  onPick(fn: ((owner: number | null) => void) | null) {
    this.pick = fn;
  }

  /** Destaca as bordas de um segmento do molde (as duas metades, se for peça dobrada). */
  setSelected(owner: number | null) {
    this.selected = owner;
    if (this.highlight) {
      this.world.remove(this.highlight);
      for (const child of this.highlight.children) {
        const obj = child as THREE.LineSegments | THREE.Points;
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
      this.highlight = null;
    }
    if (owner === null || !this.raw) return;
    const pairs: number[] = [];
    for (let i = 0; i < this.edgeOwner.length; i++) {
      if (this.edgeOwner[i] === owner) pairs.push(this.edgeLines[2 * i]!, this.edgeLines[2 * i + 1]!);
    }
    if (pairs.length === 0) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.raw.length), 3));
    geometry.setIndex(pairs);
    // Linha fina mais pontos grossos: a WebGL só desenha linha de 1 px.
    const color = 0xc2412d;
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, depthTest: false }));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color, size: 7, sizeAttenuation: false, depthTest: false }),
    );
    lines.renderOrder = points.renderOrder = 10;
    this.highlight = new THREE.Group();
    this.highlight.add(lines, points);
    this.world.add(this.highlight);
    this.updateHighlight();
  }

  private updateHighlight() {
    if (!this.highlight || !this.raw) return;
    const first = this.highlight.children[0] as THREE.LineSegments;
    const attr = first.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (attr.array.length !== this.raw.length) return;
    (attr.array as Float32Array).set(this.raw);
    attr.needsUpdate = true;
    first.geometry.computeBoundingSphere();
  }

  private onPointerDown = (e: PointerEvent) => {
    this.pointerStart = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start || !this.pick || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) return;
    this.pick(this.pickAt(e.clientX, e.clientY));
  };

  /** A borda sob o ponteiro: perto do ponto clicado no tecido ou, clicando fora dele, perto na tela. */
  private pickAt(clientX: number, clientY: number): number | null {
    const raw = this.raw;
    if (!raw || !this.garment || this.edgeLines.length === 0) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const bodyHit = this.body ? this.raycaster.intersectObject(this.body, false)[0] : undefined;
    const clothHit = this.raycaster.intersectObject(this.garment, false)[0];
    // Tecido atrás do corpo não está à vista: o clique foi no corpo.
    const hit = clothHit && (!bodyHit || clothHit.distance <= bodyHit.distance) ? clothHit : undefined;
    let line = -1;
    if (hit) {
      // Clique no tecido: só bordas perto dele na roupa (uma borda atrás pode estar perto na tela).
      const local = this.world.worldToLocal(hit.point.clone());
      line = nearestLine(raw, this.edgeLines, local, 60);
    } else {
      // Projeta as bordas na tela (em px) e procura a até 10 px do clique, a da frente primeiro.
      // Se o clique caiu no corpo, o que está atrás dele não conta (profundidade infinita).
      const hidden = bodyHit ? bodyHit.distance + 0.01 : Infinity;
      const screen = new Float32Array(raw.length);
      const depth = new Float32Array(raw.length / 3);
      const v = new THREE.Vector3();
      this.world.updateMatrixWorld();
      for (let i = 0; i < raw.length; i += 3) {
        v.set(raw[i]!, raw[i + 1]!, raw[i + 2]!).applyMatrix4(this.world.matrixWorld);
        const d = v.distanceTo(this.camera.position);
        depth[i / 3] = d > hidden ? Infinity : d;
        v.project(this.camera);
        screen[i] = ((v.x + 1) / 2) * rect.width;
        screen[i + 1] = ((1 - v.y) / 2) * rect.height;
      }
      line = frontmostLine(screen, depth, this.edgeLines, { x: clientX - rect.left, y: clientY - rect.top }, 10);
    }
    return line < 0 ? null : this.edgeOwner[line]!;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.setSelected(null);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
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
