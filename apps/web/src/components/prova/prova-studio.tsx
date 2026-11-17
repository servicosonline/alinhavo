"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FABRIC_PRESETS, type BodyConditions, type BodyKind, type BodyOverrides, type BodySex, type MapSummary } from "@alinhavo/cloth";
import { heat, LOOSE_MM } from "@/lib/prova/colors";
import type { ProvaEdges } from "@/lib/prova/edges";
import type { FabricId, FromWorker, PoseId, ProvaMaps, ProvaPart, ToWorker } from "@/lib/prova/protocol";
import { lookSetup, lookStart, type LookItem, type LookOption } from "@/lib/prova/look";
import { optionChoice, presetChoice, resolveFabric, type FabricPhoto, type ProvaFabricOption } from "@/lib/prova/fabric-options";
import type { SavedBodyLibrary } from "@/lib/prova/saved-bodies";
import { HEEL_OPTIONS, heelName, nearestHeel, POSE_OPTIONS } from "@/lib/prova/poses";
import { BODY_KIND_OPTIONS, BODY_SEX_OPTIONS } from "@/lib/prova/body-kind";
import { openZippersIn, zipperChoices } from "@/lib/prova/zippers";
import { WASHES, washable, type WashId } from "@/lib/prova/wash";
import { FABRIC_COLOR, garmentPaint } from "@/lib/prova/paint";
import { defaultQuality, deviceHints, QUALITIES, type RenderQuality } from "@/lib/prova/quality";
import { formatCm } from "@/lib/units";
import { ui } from "../ui";
import { addCaptures, type Capture } from "@/lib/prova/captures";
import { AdjustPanel, type ProvaSaveMode } from "./adjust-panel";
import { ApprovalRequest, type ApprovalRequester } from "./approval-request";
import { BodyPanel } from "./body-panel";
import { CapturesPanel } from "./captures-panel";
import { CenterViewButton } from "./center-view-button";
import { CatalogPhotoRequest, type CatalogPhotoRequester } from "./catalog-photo-request";
import { VideoPanel, type VideoPanelHandle } from "./video-panel";
import { ApprovalKit } from "./approval-kit";
import { KIT_ANGLES, kitCaptures, type KitResult } from "@/lib/prova/kit";
import { VIDEO_BITRATE, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_SECONDS, VIDEO_WIDTH, videoFileName } from "@/lib/prova/video";
import { GradeView } from "./grade-view";
import { FABRIC_NAME, LookPanel } from "./look-panel";
import type { ProvaScene } from "./scene";
import type { MotionId } from "@alinhavo/cloth";
import { MOTION_OPTIONS, motionProgressText } from "@/lib/prova/motion";

/** Biblioteca de tecidos (presets), na ordem do cloth. */
const PRESET_OPTIONS: { id: FabricId; name: string }[] = FABRIC_PRESETS.map((id) => ({ id, name: FABRIC_NAME[id] }));
/** Sem tecidos cadastrados (o /experimentar), só a biblioteca. */
const NO_FABRICS: ProvaFabricOption[] = [];
/** Sem roupas para o look, o painel do look não aparece. */
const NO_LOOK: LookOption[] = [];
/** Corpo só pela tabela (sem medida trocada na tela). */
const NO_BODY: BodyOverrides = {};
const NO_CONDITIONS: BodyConditions = {};
/** O aparelho não muda durante a página: nada a assinar. */
const noSubscribe = () => () => {};
/** Qualidade sugerida pelo aparelho; no servidor, "alta" (o cliente corrige ao hidratar). */
const useDeviceQuality = () =>
  useSyncExternalStore(
    noSubscribe,
    () => defaultQuality(deviceHints()),
    (): RenderQuality => "alta",
  );


/** Nome legível das medidas que o corpo pode estimar. */
const MEASUREMENT_NAME: Record<string, string> = {
  altura: "altura",
  busto: "busto",
  cintura: "cintura",
  quadril: "quadril",
  alturaDoQuadril: "altura do quadril",
  entrepernas: "entrepernas",
  comprimentoDoBraco: "comprimento do braço",
  punho: "punho",
  ombro: "ombro",
  larguraDasCostas: "largura das costas",
  pescoco: "pescoço",
  coxa: "coxa",
  joelho: "joelho",
  tornozelo: "tornozelo",
  braco: "braço",
};

/** "fio": grade de 5 cm desenhada no tecido plano (UV do molde), só em "Um tamanho". */
type View = "tecido" | "pressao" | "folga" | "fio";
/** Um tamanho (com ajuste, captura e aprovação) ou a grade inteira lado a lado (só ver). */
type Mode = "um" | "grade";
const MODES: { id: Mode; name: string }[] = [
  { id: "um", name: "Um tamanho" },
  { id: "grade", name: "Grade inteira" },
];
const VIEWS: { id: View; name: string }[] = [
  { id: "tecido", name: "Tecido" },
  { id: "pressao", name: "Pressão" },
  { id: "folga", name: "Folga" },
  { id: "fio", name: "Fio" },
];

/** Porcentagem em português (0,05 → "5%"). */
function percent(fraction: number, digits = 1) {
  return `${(fraction * 100).toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;
}

/** Barra com a escala de cores e o que cada ponta significa. */
function Legend({ view, fabricLimit }: { view: "pressao" | "folga"; fabricLimit: number }) {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const [r, g, b] = heat(t);
    return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}) ${t * 100}%`;
  });
  const [left, right] = view === "pressao" ? ["Sem tensão", `${percent(fabricLimit, 0)} (limite)`] : [`${formatCm(LOOSE_MM)} cm ou mais`, "Encostado"];
  return (
    <div className="space-y-1" data-legend={view}>
      <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${stops.join(", ")})` }} aria-hidden />
      <div className="flex justify-between text-[11px] text-tinta-suave">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

/** O movimento: parado, preparando no Worker (quadros prontos de quantos) ou tocando na cena. */
type MotionState = { kind: "idle" } | { kind: "preparing"; done: number; total: number } | { kind: "playing" };

/** A roupa precisa assentar em pé antes do movimento (a fase de costura e mais um segundo). */
const MOTION_SETTLE_S = 3;

type Status =
  | { kind: "loading" }
  | { kind: "running"; time: number; seamGap: number }
  | { kind: "paused"; time: number; seamGap: number }
  | { kind: "error"; message: string };

type Props = {
  doc: PatternDocument;
  /** Medidas por tamanho (nome da medida → mm). */
  measurementsBySize: Record<string, Record<string, number>>;
  /** O que fazer com um ajuste feito na Prova (salvar versão, só na tela ou só ver). */
  saveMode: ProvaSaveMode;
  /** Pedir aprovação por link (só no painel, para quem edita moldes). */
  approval?: ApprovalRequester;
  /** Gerar foto de catálogo por IA a partir de uma captura (só no painel, com produto ligado ao molde). */
  catalogPhoto?: CatalogPhotoRequester;
  /** Outras roupas que podem entrar no look (sem elas, não há look). */
  lookOptions?: LookOption[];
  /**
   * Tela dividida com o editor: os controles vão para este elemento (o painel
   * lateral do editor) e somem captura e vídeo, que ficam na página da Prova.
   * `null` = o elemento ainda está montando.
   */
  controlsTarget?: HTMLElement | null;
  /** Tecidos cadastrados pela confecção (com propriedades e foto); sem eles, só a biblioteca. */
  fabricOptions?: ProvaFabricOption[];
  /** Tecido cadastrado que já começa escolhido (o do produto ligado ao molde). */
  defaultFabricId?: string | null;
  /** Busca a foto de um tecido cadastrado (a lista vem sem elas, que são pesadas). */
  loadFabricPhoto?: (fabricId: string) => Promise<FabricPhoto | null>;
  /** Manequins salvos da organização (só no painel; sem isso, o painel do corpo não mostra a seção). */
  bodyLibrary?: SavedBodyLibrary;
};

export function ProvaStudio({ doc: sourceDoc, measurementsBySize, saveMode, approval, catalogPhoto, lookOptions = NO_LOOK, controlsTarget, fabricOptions = NO_FABRICS, defaultFabricId = null, loadFabricPhoto, bodyLibrary }: Props) {
  const split = controlsTarget !== undefined;
  // Molde em prova: começa no que veio da página e muda a cada ajuste aplicado.
  // Se a página mandar outro molde (versão nova salva), recomeça dele.
  const [work, setWork] = useState({ source: sourceDoc, doc: sourceDoc });
  if (work.source !== sourceDoc) setWork({ source: sourceDoc, doc: sourceDoc });
  const doc = work.source === sourceDoc ? work.doc : sourceDoc;
  const [edges, setEdges] = useState<ProvaEdges | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [captureNote, setCaptureNote] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ProvaScene | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [sizeChoice, setSize] = useState(doc.baseSize);
  // Na tela dividida a grade muda no editor: tamanho que saiu volta ao base.
  const size = doc.sizes.includes(sizeChoice) ? sizeChoice : doc.baseSize;
  // Tecido: um preset da biblioteca ("p:…") ou um cadastrado ("o:…"), que traz ajuste e foto.
  const [fabricChoice, setFabricChoice] = useState(() =>
    defaultFabricId && fabricOptions.some((o) => o.id === defaultFabricId) ? optionChoice(defaultFabricId) : presetChoice("planoLeve"),
  );
  const resolved = useMemo(() => resolveFabric(fabricChoice, fabricOptions), [fabricChoice, fabricOptions]);
  const fabric = resolved.preset;
  const fabricTuning = resolved.tuning;
  // Fotos buscadas ao escolher o tecido (id → foto; null = não tinha ou falhou).
  const [photos, setPhotos] = useState<Record<string, FabricPhoto | null>>({});
  const pendingId = resolved.photoPending && resolved.optionId && !(resolved.optionId in photos) ? resolved.optionId : null;
  useEffect(() => {
    if (!pendingId || !loadFabricPhoto) return;
    let alive = true;
    loadFabricPhoto(pendingId)
      .catch(() => null)
      .then((p) => alive && setPhotos((all) => ({ ...all, [pendingId]: p })));
    return () => {
      alive = false;
    };
  }, [pendingId, loadFabricPhoto]);
  const photo = resolved.photo ?? (resolved.optionId ? (photos[resolved.optionId] ?? null) : null);
  const photoRef = useRef(photo);
  const [pose, setPose] = useState<PoseId>("em-pe");
  const [bodyKind, setBodyKind] = useState<BodyKind>("manequim");
  const [sex, setSex] = useState<BodySex>("feminino");
  /** Salto, em mm (0 = descalço). Como as condições, vale em todos os tamanhos. */
  const [heel, setHeel] = useState(0);
  /** Zíperes abertos (ids); valem só os que o molde ainda tem. */
  const [openChosen, setOpenChosen] = useState<string[]>([]);
  const zippers = useMemo(() => zipperChoices(doc), [doc]);
  const openKey = openZippersIn(doc, openChosen).join(",");
  const openZippers = useMemo(() => (openKey ? openKey.split(",") : []), [openKey]);
  // Medidas do corpo trocadas na tela: valem para um tamanho; trocar o tamanho volta à tabela.
  const [bodyBy, setBodyBy] = useState<{ size: string; overrides: BodyOverrides }>({ size: doc.baseSize, overrides: NO_BODY });
  const body = bodyBy.size === size ? bodyBy.overrides : NO_BODY;
  const setBody = useCallback((overrides: BodyOverrides) => setBodyBy({ size, overrides }), [size]);
  const table = measurementsBySize[size] ?? NO_BODY;
  // Condições (membro cortado, gestante) são da pessoa, não do tamanho: ficam ao trocar o tamanho.
  const [conditions, setConditions] = useState<BodyConditions>(NO_CONDITIONS);
  const bodyConditions = useMemo<BodyConditions>(() => (heel > 0 ? { ...conditions, heel } : conditions), [conditions, heel]);
  // Manequim salvo: medidas (neste tamanho), condições e salto mudam juntos, uma remontagem só.
  const loadSavedBody = useCallback(
    (loaded: { overrides: BodyOverrides; conditions: BodyConditions; heel: number }) => {
      setBodyBy({ size, overrides: loaded.overrides });
      setConditions(loaded.conditions);
      setHeel(nearestHeel(loaded.heel));
    },
    [size],
  );
  const deviceQuality = useDeviceQuality();
  /** null = a do aparelho (`defaultQuality`), até a pessoa escolher. */
  const [chosenQuality, setChosenQuality] = useState<RenderQuality | null>(null);
  const quality = chosenQuality ?? deviceQuality;
  const qualityRef = useRef(quality);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [motion, setMotion] = useState<MotionId>("andar");
  const [motionState, setMotionState] = useState<MotionState>({ kind: "idle" });
  /** O último movimento pronto (tocar de novo não prepara de novo); some quando a Prova remonta. */
  const motionCacheRef = useRef<Extract<FromWorker, { type: "motion-ready" }> | null>(null);
  const [notes, setNotes] = useState<{ skipped: string[]; estimated: string[] }>({ skipped: [], estimated: [] });
  const [view, setView] = useState<View>("tecido");
  const [maps, setMaps] = useState<{ summary: MapSummary; fabricLimit: number } | null>(null);
  const [fabricLimit, setFabricLimit] = useState(0.05);
  const [mode, setMode] = useState<Mode>("um");
  const modeRef = useRef<Mode>("um");
  /** A Prova de um tamanho estava rodando quando a grade abriu (volta a rodar ao sair). */
  const resumeRef = useRef(false);
  const [look, setLook] = useState<LookItem[]>(() => lookStart("Este molde", "planoLeve"));
  const [lookNotes, setLookNotes] = useState<string[]>([]);
  // Camada do molde em prova e as outras roupas, para o Worker (estável entre renders).
  const { layer, extras } = useMemo(() => lookSetup(look, lookOptions), [look, lookOptions]);
  // Com a foto do tecido, a cor vem dela (o material fica branco para não tingir).
  const color = photo ? "#ffffff" : FABRIC_COLOR[fabric];
  const colorRef = useRef(color);
  /** Lavagem escolhida; vale só com jeans e sem a foto do tecido (a foto já traz a cor). */
  const [washChosen, setWashChosen] = useState<WashId>("crua");
  const wash: WashId = washable(fabric) && !photo ? washChosen : "crua";
  const washRef = useRef<{ id: WashId; fabricHex: string } | null>(null);
  const viewModeRef = useRef<View>("tecido");
  /** Últimos mapas recebidos, as roupas (com o look) e o total de vértices, para pintar ao trocar a vista. */
  const lastMapsRef = useRef<{ maps: ProvaMaps | null; fabricLimit: number; parts: ProvaPart[]; vertices: number }>({
    maps: null,
    fabricLimit: 0.05,
    parts: [],
    vertices: 0,
  });

  /** Pinta a roupa conforme a vista escolhida (cada roupa do look com a sua cor e o seu limite). Só lê refs: é estável. */
  const paint = useCallback((scene: ProvaScene | null) => {
    if (!scene) return;
    const { maps: m, parts, vertices } = lastMapsRef.current;
    const v = viewModeRef.current;
    scene.setMapColors(v === "fio" ? null : garmentPaint(v, m, parts, vertices, washRef.current), colorRef.current, v === "fio");
  }, []);

  // Cena e Worker: criados uma vez, descartados ao sair da página.
  useEffect(() => {
    let disposed = false;
    const worker = new Worker(new URL("../../lib/prova/prova.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    /** A cena carrega à parte: o último "pronto" fica guardado até ela existir. */
    let lastReady: Extract<FromWorker, { type: "ready" }> | null = null;
    const show = (scene: ProvaScene, msg: Extract<FromWorker, { type: "ready" }>) => {
      scene.setBody(msg.body.positions, msg.body.indices);
      scene.setGarment(msg.garment.positions, msg.garment.indices, colorRef.current, msg.decals, msg.garment.uv, msg.parts);
      scene.setEdges(msg.edges.lines, msg.edges.owner);
      paint(scene);
    };
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      const scene = sceneRef.current;
      if (msg.type === "ready") {
        lastReady = msg;
        // A Prova remontou: o movimento preparado era de outra roupa ou outro corpo.
        motionCacheRef.current = null;
        setMotionState({ kind: "idle" });
        lastMapsRef.current = { maps: null, fabricLimit: msg.fabricLimit, parts: msg.parts, vertices: msg.garment.positions.length / 3 };
        setMaps(null);
        setFabricLimit(msg.fabricLimit);
        setLookNotes(msg.lookNotes);
        setEdges(msg.edges);
        setSelected(null);
        if (scene) show(scene, msg);
        setNotes({ skipped: msg.skipped, estimated: msg.estimated });
        // Com a grade aberta, a Prova de um tamanho fica montada e parada (a CPU é da grade).
        if (modeRef.current === "grade") {
          resumeRef.current = true;
          setStatus({ kind: "paused", time: 0, seamGap: Infinity });
        } else {
          setStatus({ kind: "running", time: 0, seamGap: Infinity });
          worker.postMessage({ type: "play" } satisfies ToWorker);
        }
      } else if (msg.type === "frame") {
        scene?.updateGarment(msg.positions);
        if (msg.maps) {
          lastMapsRef.current = { ...lastMapsRef.current, maps: msg.maps };
          setMaps({ summary: msg.maps.summary, fabricLimit: lastMapsRef.current.fabricLimit });
          // O desbotado da lavagem segue o esticamento: repinta como os mapas.
          if (viewModeRef.current === "pressao" || viewModeRef.current === "folga" || (viewModeRef.current === "tecido" && washRef.current)) paint(scene);
        }
        setStatus((s) => (s.kind === "paused" ? s : { kind: "running", time: msg.time, seamGap: msg.seamGap }));
      } else if (msg.type === "motion-progress") {
        setMotionState({ kind: "preparing", done: msg.done, total: msg.total });
      } else if (msg.type === "motion-ready") {
        motionCacheRef.current = msg;
        scene?.playMotion(msg);
        setMotionState({ kind: "playing" });
      } else if (msg.type === "error") {
        setMotionState({ kind: "idle" });
        setStatus({ kind: "error", message: msg.message });
      }
    };
    import("./scene").then(({ ProvaScene }) => {
      if (disposed || !viewRef.current) return;
      const scene = new ProvaScene(viewRef.current);
      scene.setQuality(qualityRef.current);
      scene.setFabricPhoto(photoRef.current);
      sceneRef.current = scene;
      scene.onPick(setSelected);
      if (lastReady) show(scene, lastReady);
    });
    return () => {
      disposed = true;
      worker.terminate();
      workerRef.current = null;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [paint]);

  // Trocar tamanho, tecido, pose ou o molde monta a Prova de novo; as capturas antigas
  // mostram outra roupa, então saem (a aprovação guarda uma configuração só).
  const setupKey = `${size}|${fabric}|${pose}|${fabricChoice}|${heel}|${JSON.stringify(body)}|${JSON.stringify(conditions)}|${openKey}|${wash}|${look.map((i) => `${i.key}:${i.fabric}`).join(",")}`;
  const [capturedFor, setCapturedFor] = useState({ setupKey, doc, video: 0 });
  /** O vídeo 360° gravado (vai junto no pedido de aprovação). */
  const [video, setVideo] = useState<Blob | null>(null);
  if (capturedFor.setupKey !== setupKey || capturedFor.doc !== doc) {
    // O vídeo também mostra outra roupa: o painel recomeça (chave nova).
    setCapturedFor({ setupKey, doc, video: capturedFor.video + 1 });
    setCaptures([]);
    setCaptureNote(null);
    setVideo(null);
  }

  /** Grava a volta 360°: a simulação para durante a gravação (a roupa fica parada) e volta depois. */
  const recordVideo = async (type: string, onProgress: (f: number) => void) => {
    const scene = sceneRef.current;
    if (!scene) throw new Error("A Prova ainda está montando.");
    const worker = workerRef.current;
    const wasRunning = status.kind === "running";
    if (wasRunning) worker?.postMessage({ type: "pause" } satisfies ToWorker);
    try {
      return await scene.recordTurntable({
        seconds: VIDEO_SECONDS,
        fps: VIDEO_FPS,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        bitrate: VIDEO_BITRATE,
        type,
        onProgress,
      });
    } finally {
      if (wasRunning && modeRef.current === "um") worker?.postMessage({ type: "play" } satisfies ToWorker);
    }
  };

  const capture = (angles: Capture["angle"][]) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const shots = angles.map((angle) => ({ angle, dataUrl: scene.capture(angle) }));
    const { list, dropped } = addCaptures(captures, shots);
    setCaptures(list);
    setCaptureNote(dropped > 0 ? `${dropped === 1 ? "Uma imagem ficou" : `${dropped} imagens ficaram`} de fora (até 4, de até 150 KB).` : null);
  };

  const videoPanelRef = useRef<VideoPanelHandle>(null);
  const approvalRef = useRef<HTMLDivElement>(null);

  /** Kit de aprovação: frente, costas e lado (no lugar das capturas de antes) e o vídeo 360°. */
  const buildKit = async (): Promise<KitResult | null> => {
    const scene = sceneRef.current;
    if (!scene) return null;
    const { list, dropped } = kitCaptures(KIT_ANGLES.map((angle) => ({ angle, dataUrl: scene.capture(angle) })));
    setCaptures(list);
    setCaptureNote(null);
    const panel = videoPanelRef.current;
    const video = !panel?.supported ? "sem-suporte" : (await panel.record()) ? "ok" : "erro";
    return { captured: list.length, dropped, video };
  };

  /** Kit pronto: o "Gerar link" vem para a tela, com o foco nele. */
  const showApproval = () => {
    const submit = approvalRef.current?.querySelector<HTMLButtonElement>("[data-approval-submit]");
    submit?.scrollIntoView({ block: "center", behavior: "smooth" });
    submit?.focus({ preventScroll: true });
  };

  // Trocar tamanho, tecido, pose ou o look monta a Prova de novo.
  useEffect(() => {
    colorRef.current = color;
    const worker = workerRef.current;
    if (!worker) return;
    setStatus({ kind: "loading" });
    const measurements = measurementsBySize[size] ?? {};
    worker.postMessage({
      type: "init",
      setup: { doc, size, measurements, fabric, fabricTuning, pose, body, conditions: bodyConditions, bodyKind, sex, layer, extras, openZippers },
    } satisfies ToWorker);
  }, [doc, size, fabric, fabricTuning, pose, body, bodyConditions, bodyKind, sex, measurementsBySize, color, layer, extras, openZippers]);

  // A foto do tecido (ou a volta ao mesclado) muda só o material, não a simulação.
  useEffect(() => {
    photoRef.current = photo;
    sceneRef.current?.setFabricPhoto(photo);
  }, [photo]);

  // A borda escolhida (pelo clique ou pela lista) fica destacada na roupa.
  useEffect(() => {
    sceneRef.current?.setSelected(selected);
  }, [selected]);

  const applied = (next: PatternDocument, text: string) => {
    // Na tela dividida o molde volta pelo editor (vira o doc da página): mudar aqui remontaria duas vezes.
    if (saveMode.kind !== "editor") setWork({ source: sourceDoc, doc: next });
    setSelected(null);
    setNotice(text);
  };

  // Trocar a qualidade refaz os materiais da roupa e repinta (não remonta a Prova).
  useEffect(() => {
    qualityRef.current = quality;
    sceneRef.current?.setQuality(quality);
    paint(sceneRef.current);
  }, [quality, paint]);

  // Trocar a lavagem só repinta.
  useEffect(() => {
    washRef.current = wash === "crua" ? null : { id: wash, fabricHex: FABRIC_COLOR[fabric] };
    paint(sceneRef.current);
  }, [wash, fabric, paint]);

  // Trocar a vista só repinta (não remonta a Prova).
  useEffect(() => {
    viewModeRef.current = view;
    paint(sceneRef.current);
  }, [view, paint]);

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    modeRef.current = next;
    setMode(next);
    const worker = workerRef.current;
    if (next === "grade") {
      if (view === "fio") setView("tecido");
      resumeRef.current = status.kind === "running";
      if (status.kind === "running") {
        worker?.postMessage({ type: "pause" } satisfies ToWorker);
        setStatus({ kind: "paused", time: status.time, seamGap: status.seamGap });
      }
      return;
    }
    if (resumeRef.current && status.kind === "paused") {
      worker?.postMessage({ type: "play" } satisfies ToWorker);
      setStatus({ ...status, kind: "running" });
    }
    resumeRef.current = false;
  };

  const togglePlay = () => {
    const worker = workerRef.current;
    if (!worker) return;
    if (status.kind === "running") {
      worker.postMessage({ type: "pause" } satisfies ToWorker);
      setStatus({ kind: "paused", time: status.time, seamGap: status.seamGap });
    } else if (status.kind === "paused") {
      worker.postMessage({ type: "play" } satisfies ToWorker);
      setStatus({ ...status, kind: "running" });
    }
  };
  /** Play do movimento: toca o já preparado ou pede ao Worker (a simulação para enquanto prepara). */
  const playMotion = () => {
    const worker = workerRef.current;
    if (!worker || status.kind === "loading" || status.kind === "error") return;
    if (status.kind === "running") setStatus({ kind: "paused", time: status.time, seamGap: status.seamGap });
    const cached = motionCacheRef.current;
    if (cached && cached.motion === motion) {
      sceneRef.current?.playMotion(cached);
      setMotionState({ kind: "playing" });
      return;
    }
    worker.postMessage({ type: "motion", motion } satisfies ToWorker);
    setMotionState({ kind: "preparing", done: 0, total: 0 });
  };
  const stopMotion = () => {
    if (motionState.kind === "preparing") workerRef.current?.postMessage({ type: "motion-stop" } satisfies ToWorker);
    sceneRef.current?.stopMotion();
    setMotionState({ kind: "idle" });
  };
  const chooseMotion = (next: MotionId) => {
    if (motionState.kind !== "idle") stopMotion();
    setMotion(next);
  };
  const settled = (status.kind === "running" || status.kind === "paused") && status.time >= MOTION_SETTLE_S;

  const restart = () => {
    workerRef.current?.postMessage({
      type: "init",
      setup: { doc, size, measurements: measurementsBySize[size] ?? {}, fabric, fabricTuning, pose, body, conditions: bodyConditions, bodyKind, sex, layer, extras, openZippers },
    } satisfies ToWorker);
    setStatus({ kind: "loading" });
  };

  const stage = (
    <>
      {mode === "grade" && <GradeView doc={doc} measurementsBySize={measurementsBySize} fabric={fabric} pose={pose} bodyKind={bodyKind} sex={sex} color={color} view={view === "fio" ? "tecido" : view} layer={layer} extras={extras} quality={quality} />}
      <div
        ref={viewRef}
        className={`${mode === "grade" ? "hidden" : "relative"} h-[60vh] min-h-[22rem] overflow-hidden rounded-lg border border-tinta/15 bg-papel ${split ? "lg:h-[calc(100vh-15rem)]" : "lg:h-[calc(100vh-10rem)]"}`}
      >
        {status.kind === "loading" && (
          <p className="absolute inset-x-0 top-3 text-center text-xs text-tinta-suave" role="status">
            Montando a Prova…
          </p>
        )}
        <CenterViewButton onClick={() => sceneRef.current?.resetView()} />
      </div>
    </>
  );

  const controls = (
      <aside className="space-y-4" aria-label="Controles da Prova">
        <div className={`${ui.card} space-y-3 p-4`}>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Provar">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                data-mode={m.id}
                className={`rounded-md border px-2 py-1.5 text-sm ${mode === m.id ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
                onClick={() => changeMode(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className={`block text-xs ${bodyKind === "makehuman" ? "" : "col-span-2"}`}>
              <span className="font-medium">Corpo</span>
              <select className={`${ui.input} text-sm`} value={bodyKind} onChange={(e) => setBodyKind(e.target.value as BodyKind)} data-body-kind>
                {BODY_KIND_OPTIONS.map((k) => (
                  <option key={k.id} value={k.id} title={k.hint}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
            {bodyKind === "makehuman" && (
              <label className="block text-xs">
                <span className="font-medium">Base</span>
                <select className={`${ui.input} text-sm`} value={sex} onChange={(e) => setSex(e.target.value as BodySex)} data-body-sex>
                  {BODY_SEX_OPTIONS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="block text-xs">
            <span className="font-medium">Tamanho</span>
            <select className={`${ui.input} text-sm`} value={size} onChange={(e) => setSize(e.target.value)} disabled={mode === "grade"}>
              {doc.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {s === doc.baseSize ? " (base)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Tecido</span>
            <select className={`${ui.input} text-sm`} value={fabricChoice} onChange={(e) => setFabricChoice(e.target.value)} data-fabric-select>
              {fabricOptions.length > 0 && (
                <optgroup label="Tecidos da confecção">
                  {fabricOptions.map((o) => (
                    <option key={o.id} value={optionChoice(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Biblioteca">
                {PRESET_OPTIONS.map((f) => (
                  <option key={f.id} value={presetChoice(f.id)}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            </select>
            {fabricChoice.startsWith("o:") && (
              <span className="mt-1 block text-[11px] text-tinta-suave" data-fabric-note>
                Comportamento de {FABRIC_NAME[fabric]}
                {fabricTuning && Object.keys(fabricTuning).length > 0 ? ", ajustado pelo cadastro" : ""}
                {photo ? `; com a foto do tecido (${formatCm(photo.cm * 10)} cm)` : pendingId ? "; buscando a foto…" : ""}.
              </span>
            )}
          </label>
          <label className="block text-xs">
            <span className="font-medium">Pose</span>
            <select className={`${ui.input} text-sm`} value={pose} onChange={(e) => setPose(e.target.value as PoseId)} data-pose-select>
              {POSE_OPTIONS.map((p) => (
                <option key={p.id} value={p.id} title={p.hint}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Calçado</span>
            <select className={`${ui.input} text-sm`} value={heel} onChange={(e) => setHeel(Number(e.target.value))} data-heel-select>
              {HEEL_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {heelName(h)}
                </option>
              ))}
            </select>
          </label>
          {washable(fabric) && (
            <label className="block text-xs">
              <span className="font-medium">Lavagem</span>
              <select
                className={`${ui.input} text-sm`}
                value={wash}
                disabled={!!photo}
                onChange={(e) => setWashChosen(e.target.value as WashId)}
                data-wash-select
              >
                {WASHES.map((w) => (
                  <option key={w.id} value={w.id} title={w.hint}>
                    {w.name}
                  </option>
                ))}
              </select>
              {photo && <span className="mt-1 block text-[11px] text-tinta-suave">Com a foto do tecido, a cor vem da foto.</span>}
            </label>
          )}
          {zippers.length > 0 && (
            <fieldset className="space-y-1 text-xs" data-zippers>
              <legend className="font-medium">Zíper</legend>
              {zippers.map((z) => (
                <label key={z.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={openZippers.includes(z.id)}
                    onChange={(e) => setOpenChosen((prev) => (e.target.checked ? [...prev, z.id] : prev.filter((id) => id !== z.id)))}
                    data-zipper-open={z.id}
                  />
                  <span>{z.label}: aberto</span>
                </label>
              ))}
            </fieldset>
          )}
          <label className="block text-xs">
            <span className="font-medium">Qualidade</span>
            <select
              className={`${ui.input} text-sm`}
              value={quality}
              data-quality={quality}
              onChange={(e) => setChosenQuality(e.target.value as RenderQuality)}
            >
              {QUALITIES.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </label>
          {mode === "um" && (
            <div className="space-y-2 border-t border-tinta/10 pt-3 text-xs" data-motion={motionState.kind}>
              <label className="block">
                <span className="font-medium">Movimento</span>
                <select
                  className={`${ui.input} text-sm`}
                  value={motion}
                  onChange={(e) => chooseMotion(e.target.value as MotionId)}
                  data-motion-select
                >
                  {MOTION_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id} title={m.hint}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              {motionState.kind === "idle" ? (
                <button type="button" className={`${ui.buttonAccentSm} w-full`} onClick={playMotion} disabled={!settled} data-motion-play>
                  ▶ Play
                </button>
              ) : (
                <button type="button" className={`${ui.buttonGhost} w-full`} onClick={stopMotion} data-motion-stop>
                  ■ Parar
                </button>
              )}
              {motionState.kind === "preparing" && (
                <div className="space-y-1" role="status" aria-live="polite">
                  <p>{motionProgressText(motionState.done, motionState.total)}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-tinta/10">
                    <div
                      className="h-full bg-linha transition-[width]"
                      style={{ width: `${motionState.total > 0 ? Math.round((motionState.done / motionState.total) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-tinta-suave">O movimento é calculado antes e depois toca liso.</p>
                </div>
              )}
              {motionState.kind === "idle" && !settled && status.kind !== "error" && (
                <p className="text-tinta-suave">Espere a roupa assentar para o Play.</p>
              )}
            </div>
          )}
          <div className={`${mode === "grade" ? "hidden" : "grid"} grid-cols-2 gap-2`}>
            <button
              type="button"
              className={ui.buttonGhost}
              onClick={togglePlay}
              disabled={(status.kind !== "running" && status.kind !== "paused") || motionState.kind !== "idle"}
            >
              {status.kind === "paused" ? "Continuar" : "Pausar"}
            </button>
            <button type="button" className={ui.buttonGhost} onClick={restart} disabled={status.kind === "loading"}>
              Recomeçar
            </button>
          </div>
        </div>

        {mode === "um" && (
          <BodyPanel
            table={table}
            overrides={body}
            conditions={conditions}
            onChange={setBody}
            onConditions={setConditions}
            heel={heel}
            library={bodyLibrary}
            onLoadSaved={loadSavedBody}
            disabled={status.kind === "loading"}
          />
        )}

        {lookOptions.length > 0 && (
          <LookPanel look={look} options={lookOptions} mainFabric={fabric} onChange={setLook} disabled={status.kind === "loading"} />
        )}

        <div className={`${ui.card} space-y-3 p-4`}>
          <fieldset>
            <legend className="text-xs font-medium">Ver</legend>
            <div className={`mt-1 grid gap-1 ${mode === "grade" ? "grid-cols-3" : "grid-cols-4"}`} role="radiogroup" aria-label="Ver">
              {VIEWS.filter((v) => mode === "um" || v.id !== "fio").map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={view === v.id}
                  data-view={v.id}
                  className={`rounded-md border px-2 py-1.5 text-sm ${view === v.id ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
                  onClick={() => setView(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </fieldset>
          {view === "fio" && (
            <p className="text-xs text-tinta-suave" data-grain-note>
              Quadrados de 5 cm desenhados no tecido plano, com a seta no fio. Onde o quadrado vira losango, o tecido está enviesado; onde
              estica, está esticado.
            </p>
          )}
          {(view === "pressao" || view === "folga") && <Legend view={view} fabricLimit={fabricLimit} />}
          {(view === "pressao" || view === "folga") && mode === "um" && (
            <div className="space-y-1 text-xs" data-map-summary>
              {!maps ? (
                <p className="text-tinta-suave">Calculando o mapa…</p>
              ) : view === "pressao" ? (
                <>
                  <p data-high-stretch={maps.summary.highStretch.toFixed(4)}>
                    Pressão alta: {percent(maps.summary.highStretch)} ({percent(maps.summary.highStretch / maps.fabricLimit, 0)} do limite do
                    tecido); 98% da roupa fica abaixo disso.
                  </p>
                  <p data-near-limit={maps.summary.areaNearLimit.toFixed(4)}>
                    Área perto do limite (acima de 80%): {percent(maps.summary.areaNearLimit, 0)} da roupa.
                  </p>
                </>
              ) : (
                <p data-clearance={`${maps.summary.minClearance.toFixed(1)}-${maps.summary.maxClearance.toFixed(1)}`}>
                  Folga de {formatCm(maps.summary.minClearance)} a {formatCm(maps.summary.maxClearance)} cm até o corpo.
                </p>
              )}
            </div>
          )}
        </div>

        {mode === "grade" ? (
          <p className="text-xs text-tinta-suave" data-grade-note>
            Cada tamanho veste o manequim com as medidas da sua linha na tabela. Para ajustar o molde, capturar imagens ou pedir aprovação,
            volte para Um tamanho.
          </p>
        ) : (
          <>
        {!split && (
        <CapturesPanel
          captures={captures}
          onCapture={capture}
          onRemove={(i) => {
            setCaptures(captures.filter((_, k) => k !== i));
            setCaptureNote(null);
          }}
          disabled={status.kind !== "running" && status.kind !== "paused"}
          note={captureNote}
        >
          {approval && !approval.blocked && (
            <ApprovalKit
              key={capturedFor.video}
              build={buildKit}
              onReady={showApproval}
              disabled={status.kind !== "running" && status.kind !== "paused"}
            />
          )}
          {approval && (
            <div ref={approvalRef}>
              <ApprovalRequest requester={approval} settings={{ size, fabric: resolved.name, pose }} captures={captures} video={video} />
            </div>
          )}
          {catalogPhoto && <CatalogPhotoRequest requester={catalogPhoto} captures={captures} />}
        </CapturesPanel>
        )}

        {!split && (
        <VideoPanel
          key={capturedFor.video}
          ref={videoPanelRef}
          record={recordVideo}
          fileName={(type) => videoFileName("prova", size, type)}
          disabled={status.kind !== "running" && status.kind !== "paused"}
          onChange={setVideo}
        />
        )}

        <AdjustPanel
          doc={doc}
          edges={edges?.list ?? []}
          selected={selected}
          onSelect={setSelected}
          mode={saveMode}
          onApplied={applied}
          disabled={status.kind === "loading" || status.kind === "error"}
        />
        {notice && (
          <p className={`${ui.success} text-xs`} role="status" data-adjust-notice>
            {notice}
          </p>
        )}

        <div className={`${ui.card} space-y-2 p-4 text-xs`} role="status" aria-live="polite" data-prova-status={status.kind}>
          {status.kind === "loading" && <p>Montando o corpo e as peças…</p>}
          {(status.kind === "running" || status.kind === "paused") && (
            <>
              <p>
                {status.kind === "paused" ? "Pausado" : "Simulando"} · {status.time.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s
              </p>
              <p data-seam-gap={Number.isFinite(status.seamGap) ? status.seamGap.toFixed(2) : ""}>
                {!Number.isFinite(status.seamGap)
                  ? "Costurando…"
                  : status.seamGap < 1
                    ? "Costuras fechadas."
                    : `Costuras fechando: maior vão de ${formatCm(status.seamGap)} cm.`}
              </p>
            </>
          )}
          {status.kind === "error" && <p className="text-linha">{status.message}</p>}
          {lookNotes.map((n) => (
            <p key={n} className="text-tinta-suave" data-look-note>
              {n}
            </p>
          ))}
          {notes.skipped.length > 0 && (
            <p className="text-tinta-suave">Fora da Prova (sem posição no corpo): {notes.skipped.join(", ")}.</p>
          )}
          {notes.estimated.length > 0 && (
            <p className="text-tinta-suave">
              Medidas estimadas pela altura: {notes.estimated.map((k) => MEASUREMENT_NAME[k] ?? k).join(", ")}.
            </p>
          )}
        </div>
          </>
        )}
        <p className="text-xs text-tinta-suave">
          Arraste para girar; segure o botão do meio (ou o direito) e arraste para subir e descer; a roda ou dois dedos aproximam.{mode === "um" ? " Clique numa borda para ajustar o molde." : ""}
        </p>
      </aside>
  );

  if (split) {
    return (
      <div className="min-w-0" data-prova-split>
        {stage}
        {controlsTarget && createPortal(controls, controlsTarget)}
      </div>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
      {stage}
      {controls}
    </div>
  );
}
