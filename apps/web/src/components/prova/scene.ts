import * as THREE from "three";
import type { Decal, Seat } from "@alinhavo/cloth";
import { frontmostLine, nearestLine } from "@/lib/prova/edges";
import { frameAt, frameOf } from "@/lib/prova/motion";
import type { ProvaPart } from "@/lib/prova/protocol";
import type { RenderQuality } from "@/lib/prova/quality";
import { turntableAngle, turntablePosition } from "@/lib/prova/video";
import { DecalLayer } from "./decal-layer";
import { grainGridTexture } from "./grain-texture";
import { bodyMesh, disposeMesh, garmentGroups, garmentMesh, liftGarment, paintGarment, Stage } from "./stage";

/**
 * Cena 3D da Prova de um tamanho: corpo, roupa, bordas clicáveis e capturas.
 * As posições chegam em mm (Y para cima); o palco (`Stage`) trabalha em metros.
 * Sem React: a página cria, alimenta e descarta.
 */
export class ProvaScene {
  private stage: Stage;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: Stage["controls"];
  private world: THREE.Group;
  private body: THREE.Mesh | null = null;
  private garment: THREE.Mesh | null = null;
  /** Acabamentos sobre a roupa (pesponto, zíper, etiqueta, estampa). */
  private decals: DecalLayer | null = null;
  /** Posições da roupa como a simulação mandou (sem o afastamento visual). */
  private raw: Float32Array | null = null;
  /** Movimento tocando: os quadros, quando começou e o último mostrado; e o corpo e a roupa parados, para voltar. */
  private motion: {
    garment: Float32Array;
    body: Float32Array;
    frames: number;
    fps: number;
    start: number;
    last: number;
    restBody: Float32Array | null;
    restGarment: Float32Array | null;
  } | null = null;
  /** O banco do "sentar" (só enquanto o movimento toca). */
  private seat: THREE.Mesh | null = null;
  private edgeLines: Uint32Array = new Uint32Array(0);
  private edgeOwner: Int32Array = new Int32Array(0);
  private selected: number | null = null;
  private highlight: THREE.Group | null = null;
  private pick: ((owner: number | null) => void) | null = null;
  private pointerStart: { x: number; y: number } | null = null;
  private raycaster = new THREE.Raycaster();
  /** Grade do fio (vista "Fio"), criada na primeira vez que aparece. */
  private grainTexture: THREE.Texture | null = null;
  private quality: RenderQuality = "alta";
  /** Roupas da malha atual e a cor do tecido (para refazer os materiais ao trocar a qualidade). */
  private parts: readonly ProvaPart[] = [];
  private color = "#ffffff";
  /** Última pintura (para repintar depois de refazer os materiais). */
  private lastPaint: { colors: Float32Array | null; grain: boolean } = { colors: null, grain: false };
  /** Foto do tecido pedida (para ignorar uma carga que chegou atrasada). */
  private photoKey = "";

  constructor(container: HTMLElement) {
    this.stage = new Stage(container, "Prova 3D: a roupa no manequim", { lockHorizontal: true });
    this.renderer = this.stage.renderer;
    this.scene = this.stage.scene;
    this.camera = this.stage.camera;
    this.controls = this.stage.controls;
    this.world = this.stage.world;

    // Clique (sem arrastar) escolhe a borda; arrastar continua girando a câmera.
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
  }

  private replace(old: THREE.Mesh | null, next: THREE.Mesh): THREE.Mesh {
    if (old) {
      this.world.remove(old);
      disposeMesh(old);
    }
    this.world.add(next);
    return next;
  }

  setBody(positions: Float32Array, indices: Uint32Array) {
    this.stopMotion(false);
    this.body = this.replace(this.body, bodyMesh(positions, indices));
  }

  /**
   * Toca o movimento em volta (quadros da roupa e do corpo, mm, como o Worker
   * mandou). A roupa e o corpo voltam como estavam em `stopMotion`.
   */
  playMotion(m: { garment: Float32Array; body: Float32Array; frames: number; fps: number; seat: Seat | null }) {
    this.stopMotion();
    if (m.frames < 1 || !this.garment) return;
    const bodyPos = this.body?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    this.motion = {
      ...m,
      start: performance.now(),
      last: -1,
      restBody: bodyPos ? Float32Array.from(bodyPos.array as Float32Array) : null,
      restGarment: this.raw ? Float32Array.from(this.raw) : null,
    };
    if (m.seat) {
      const s = m.seat;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(s.maxX - s.minX, s.top, s.maxZ - s.minZ),
        new THREE.MeshStandardMaterial({ color: 0xb9a184, roughness: 0.7, metalness: 0 }),
      );
      box.position.set((s.minX + s.maxX) / 2, s.top / 2, (s.minZ + s.maxZ) / 2);
      box.castShadow = true;
      box.receiveShadow = true;
      this.seat = box;
      this.world.add(box);
    }
    this.stage.animate = () => this.motionTick();
  }

  /** Para o movimento. `restore`: a roupa e o corpo voltam a como estavam antes de tocar. */
  stopMotion(restore = true) {
    const m = this.motion;
    this.motion = null;
    this.stage.animate = null;
    if (this.seat) {
      this.world.remove(this.seat);
      disposeMesh(this.seat);
      this.seat = null;
    }
    if (!m || !restore) return;
    if (m.restBody) this.setBodyPositions(m.restBody);
    if (m.restGarment) this.updateGarment(m.restGarment);
  }

  /** Se um movimento está tocando. */
  get playingMotion() {
    return this.motion !== null;
  }

  private motionTick() {
    const m = this.motion;
    if (!m) return;
    const index = frameAt(performance.now() - m.start, m.fps, m.frames);
    if (index === m.last) return;
    m.last = index;
    this.updateGarment(frameOf(m.garment, m.frames, index));
    this.setBodyPositions(frameOf(m.body, m.frames, index));
  }

  /** Novas posições do corpo, mesma topologia (o movimento). */
  private setBodyPositions(positions: Float32Array) {
    const attr = this.body?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!this.body || !attr || attr.array.length !== positions.length) return;
    (attr.array as Float32Array).set(positions);
    attr.needsUpdate = true;
    this.body.geometry.computeVertexNormals();
    this.body.geometry.computeBoundingSphere();
  }

  /**
   * `uv`: lugar de cada vértice no tecido plano, em mm; `parts`: as roupas
   * (cada uma com o material do seu tecido). Os dois vêm do Worker.
   */
  setGarment(positions: Float32Array, indices: Uint32Array, color: string, decals: readonly Decal[], uv: Float32Array, parts: readonly ProvaPart[]) {
    this.stopMotion(false);
    this.parts = parts;
    this.color = color;
    const groups = garmentGroups(this.stage.fabrics, parts, indices.length / 3, color, this.quality);
    this.garment = this.replace(this.garment, garmentMesh(positions, indices, groups, uv));
    if (this.decals) {
      this.world.remove(this.decals.group);
      this.decals.dispose();
    }
    this.decals = new DecalLayer(decals);
    this.world.add(this.decals.group);
    this.decals.update(this.garment);
    this.raw = positions;
    this.updateHighlight();
  }

  /**
   * Cores por vértice (mapa de pressão ou folga, 3 floats por vértice); null
   * volta à cor do tecido. `grain` mostra a grade do fio no lugar das cores.
   */
  setMapColors(colors: Float32Array | null, fabricColor: string, grain = false) {
    this.lastPaint = { colors, grain };
    if (!this.garment) return;
    this.color = fabricColor;
    if (grain && !this.grainTexture) this.grainTexture = grainGridTexture(this.renderer.capabilities.getMaxAnisotropy());
    paintGarment(this.garment, colors, fabricColor, grain ? this.grainTexture : null);
  }

  /**
   * Qualidade do desenho: sombra e pixels no palco, materiais refeitos na
   * roupa (quem chama repinta a vista depois).
   */
  setQuality(quality: RenderQuality) {
    if (quality === this.quality) return;
    this.quality = quality;
    this.stage.setQuality(quality);
    this.rebuildMaterials();
  }

  private rebuildMaterials() {
    if (!this.garment) return;
    const old = this.garment.material;
    const groups = garmentGroups(this.stage.fabrics, this.parts, this.garment.geometry.index!.count / 3, this.color, this.quality);
    this.garment.material = groups.map((g) => g.material);
    for (const m of Array.isArray(old) ? old : [old]) m.dispose();
  }

  /**
   * Foto do tecido cadastrado no molde em prova: `cm` é a largura real que a
   * foto mostra (o UV da roupa está em mm de tecido, então ela se repete a cada
   * `cm` × 10 mm, no fio). null volta ao mesclado do preset.
   */
  setFabricPhoto(photo: { dataUrl: string; cm: number } | null) {
    const key = photo ? `${photo.cm}:${photo.dataUrl.length}:${photo.dataUrl.slice(-32)}` : "";
    if (key === this.photoKey) return;
    this.photoKey = key;
    const apply = (texture: THREE.Texture | null) => {
      this.stage.fabrics.setPhoto(texture);
      this.rebuildMaterials();
      if (this.garment) paintGarment(this.garment, this.lastPaint.colors, this.color, this.lastPaint.grain ? this.grainTexture : null);
    };
    if (!photo) return apply(null);
    new THREE.TextureLoader().load(photo.dataUrl, (texture) => {
      if (this.photoKey !== key) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      const mm = Math.max(10, photo.cm * 10);
      texture.repeat.set(1 / mm, 1 / mm);
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      apply(texture);
    });
  }

  /** Novas posições da roupa (mesma topologia); o afastamento visual é o do `liftGarment`. */
  updateGarment(positions: Float32Array) {
    if (!this.garment || !liftGarment(this.garment, positions)) return;
    this.decals?.update(this.garment);
    this.raw = positions;
    this.updateHighlight();
  }

  /**
   * Imagem da roupa para a aprovação (JPEG, 900 × 1200 px). "atual" usa a
   * câmera como está; frente, costas e lado giram em volta do corpo (a
   * esquerda do corpo fica em +X). O destaque de borda não sai na imagem, e
   * a câmera e o tamanho da tela voltam como estavam.
   */
  /**
   * Vídeo 360°: a câmera dá uma volta em torno do corpo (começando de frente)
   * e o navegador grava a tela no tamanho do vídeo. O destaque de borda não
   * sai, os controles param e, no fim (ou num erro), câmera, tamanho e
   * controles voltam como estavam. `onProgress` recebe de 0 a 1.
   */
  recordTurntable(opts: {
    seconds: number;
    fps: number;
    width: number;
    height: number;
    bitrate: number;
    type: string;
    onProgress?: (fraction: number) => void;
  }): Promise<Blob> {
    const canvas = this.renderer.domElement;
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      return Promise.reject(new Error("Este navegador não grava vídeo da tela."));
    }
    const camPos = this.camera.position.clone();
    const target = this.controls.target.clone();
    const aspect = this.camera.aspect;
    const size = this.renderer.getSize(new THREE.Vector2());
    const pixelRatio = this.renderer.getPixelRatio();
    const highlightVisible = this.highlight?.visible ?? false;
    const restore = () => {
      this.stage.beforeRender = null;
      if (this.highlight) this.highlight.visible = highlightVisible;
      this.camera.position.copy(camPos);
      this.controls.target.copy(target);
      this.camera.lookAt(target);
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(size.x, size.y, false);
      this.controls.enabled = true;
      this.controls.update();
    };

    return new Promise<Blob>((resolve, reject) => {
      try {
        if (this.highlight) this.highlight.visible = false;
        this.controls.enabled = false;
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(opts.width, opts.height, false);
        this.camera.aspect = opts.width / opts.height;
        this.camera.updateProjectionMatrix();
        const look = new THREE.Vector3(0, 0.95, 0);
        this.controls.target.copy(look);

        const recorder = new MediaRecorder(canvas.captureStream(opts.fps), { mimeType: opts.type, videoBitsPerSecond: opts.bitrate });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          restore();
          if (chunks.length === 0) reject(new Error("A gravação saiu vazia."));
          else resolve(new Blob(chunks, { type: opts.type.split(";")[0] }));
        };
        recorder.onerror = () => {
          restore();
          reject(new Error("A gravação falhou."));
        };
        let start = -1;
        this.stage.beforeRender = () => {
          const now = performance.now();
          if (start < 0) start = now;
          const t = (now - start) / 1000;
          const p = turntablePosition(turntableAngle(t, opts.seconds), 3.1, 1.15);
          this.camera.position.set(p.x, p.y, p.z);
          this.camera.lookAt(look);
          opts.onProgress?.(Math.min(1, t / opts.seconds));
          if (t >= opts.seconds && recorder.state === "recording") {
            this.stage.beforeRender = null;
            // Um quadro a mais já desenhado na posição final antes de parar.
            requestAnimationFrame(() => recorder.stop());
          }
        };
        recorder.start(250);
      } catch (err) {
        restore();
        reject(err instanceof Error ? err : new Error("A gravação falhou."));
      }
    });
  }

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
    this.stopMotion(false);
    this.setSelected(null);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    disposeMesh(this.body);
    disposeMesh(this.garment);
    this.decals?.dispose();
    this.grainTexture?.dispose();
    this.stage.dispose();
  }
}
