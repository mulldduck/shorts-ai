"use client";

import { toPng } from "html-to-image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Platform = "youtube" | "tiktok" | "instagram";
type Genre = "horror" | "info" | "romance" | "story" | "money" | "daily" | "vlog";
type CaptionPosition = "top" | "upper" | "middle" | "lower" | "bottom";
type CaptionSize = "small" | "medium" | "large";
type CaptionColor = "white" | "yellow" | "red" | "purple";
type CaptionBg = "none" | "dark";
type SceneEffect = "zoom" | "shake" | "fade" | "slide" | "none";
type BackgroundType = "solid" | "uploadedImage" | "uploadedVideo" | "generatedImage" | "sceneImage" | "sceneVideo";
type SfxTiming = "sceneStart" | "impact" | "none";
type ThumbnailPosition = "top" | "middle" | "bottom";
type ThumbnailBgStyle = "dark" | "blur" | "none";
type VoiceStyle = "alloy" | "verse" | "nova" | "shimmer" | "echo";

type Scene = {
  start: number;
  end: number;
  caption: string;
  subCaption: string;
  visual: string;
  effect: SceneEffect;
  backgroundType: BackgroundType;
  captionPosition: CaptionPosition;
  captionSize: CaptionSize;
  captionColor: CaptionColor;
  captionBg: CaptionBg;
  imageUrl?: string;
  sceneImageUrl?: string;
  sceneImageName?: string;
  sceneVideoUrl?: string;
  sceneVideoName?: string;
  videoClipStart?: number;
  videoClipEnd?: number;
  sfxEnabled?: boolean;
  sfxLabel?: string;
  sfxTiming?: SfxTiming;
};

type ThumbnailSettings = {
  text: string;
  subText: string;
  sceneIndex: number;
  textColor: CaptionColor;
  position: ThumbnailPosition;
  bgStyle: ThumbnailBgStyle;
};

type GeneratedShorts = {
  title: string;
  thumbnailText: string;
  script: string;
  duration: number;
  bgm: string;
  captionStyle: string;
  scenes: Scene[];
  thumbnail?: ThumbnailSettings;
};

type RecommendedCut = {
  title: string;
  start: number;
  end: number;
};

type SavedProject = {
  savedAt: string;
  platform: Platform;
  genre: Genre;
  topic: string;
  target: string;
  mood: string;
  imageFileName: string;
  imagePreviewUrl: string;
  imageBase64: string;
  videoFileName: string;
  videoPreviewUrl: string;
  cutTitle: string;
  cutStart: number;
  cutEnd: number;
  videoDuration: number;
  recommendedCuts: RecommendedCut[];
  bgmFileName: string;
  bgmUrl: string;
  bgmVolume: number;
  sfxFileName: string;
  sfxUrl: string;
  sfxVolume: number;
  voiceStyle: VoiceStyle;
  narrationUrl: string;
  result: GeneratedShorts | null;
  scenes: Scene[];
  thumbnail: ThumbnailSettings;
  autoSortTimeline: boolean;
};

const PROJECT_STORAGE_KEY = "shortslab-current-project";

const platformOptions: { value: Platform; label: string }[] = [
  { value: "youtube", label: "유튜브 쇼츠" },
  { value: "tiktok", label: "틱톡" },
  { value: "instagram", label: "인스타 릴스" },
];

const genreOptions: { value: Genre; label: string }[] = [
  { value: "horror", label: "공포 / 미스터리" },
  { value: "info", label: "정보성" },
  { value: "romance", label: "연애" },
  { value: "story", label: "썰" },
  { value: "money", label: "경제" },
  { value: "daily", label: "일상" },
  { value: "vlog", label: "브이로그" },
];

const shortsTemplates: {
  id: string;
  emoji: string;
  title: string;
  description: string;
  genre: Genre;
  topic: string;
  target: string;
  mood: string;
}[] = [
  {
    id: "horror",
    emoji: "🔥",
    title: "공포 미스터리",
    description: "긴장감 있는 쇼츠 썰 구조",
    genre: "horror",
    topic: "새벽 편의점에서 겪은 소름돋는 실화",
    target: "10~20대 공포/미스터리 쇼츠 시청자",
    mood: "긴장감 있고 몰입감 있게, 마지막에 반전",
  },
  {
    id: "money",
    emoji: "📈",
    title: "경제 쇼츠",
    description: "조회수 잘 나오는 정보형 스타일",
    genre: "money",
    topic: "사회초년생이 절대 하면 안 되는 소비습관",
    target: "20~30대 직장인과 사회초년생",
    mood: "짧고 강렬하게 핵심 전달",
  },
  {
    id: "romance",
    emoji: "💕",
    title: "연애 썰",
    description: "감정 몰입형 스토리",
    genre: "romance",
    topic: "전남친에게 1년 만에 연락이 왔다",
    target: "10~30대 연애썰 좋아하는 시청자",
    mood: "감정적으로 몰입되게, 마지막에 여운",
  },
  {
    id: "info",
    emoji: "🧠",
    title: "정보형 릴스",
    description: "짧고 중독성 있는 지식 콘텐츠",
    genre: "info",
    topic: "90%가 모르는 아이폰 숨겨진 기능",
    target: "짧은 정보 콘텐츠를 좋아하는 일반 유저",
    mood: "빠르고 임팩트 있게",
  },
  {
    id: "vlog",
    emoji: "🎥",
    title: "감성 브이로그",
    description: "무드 중심 감성 영상",
    genre: "vlog",
    topic: "혼자 떠난 부산 1박 2일",
    target: "감성 영상과 여행 브이로그를 좋아하는 사람",
    mood: "따뜻하고 시네마틱하게",
  },
];

const captionPositionOptions: { value: CaptionPosition; label: string }[] = [
  { value: "top", label: "상단" },
  { value: "upper", label: "상중단" },
  { value: "middle", label: "중앙" },
  { value: "lower", label: "하중단" },
  { value: "bottom", label: "하단" },
];

const captionSizeOptions: { value: CaptionSize; label: string }[] = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" },
];

const captionColorOptions: { value: CaptionColor; label: string }[] = [
  { value: "white", label: "흰색" },
  { value: "yellow", label: "노랑" },
  { value: "red", label: "빨강" },
  { value: "purple", label: "보라" },
];

const effectOptions: { value: SceneEffect; label: string }[] = [
  { value: "zoom", label: "줌인" },
  { value: "shake", label: "흔들림" },
  { value: "fade", label: "페이드" },
  { value: "slide", label: "슬라이드" },
  { value: "none", label: "없음" },
];

const defaultThumbnail: ThumbnailSettings = {
  text: "궁금하면 끝까지 보세요",
  subText: "AI 추천 썸네일",
  sceneIndex: 0,
  textColor: "yellow",
  position: "middle",
  bgStyle: "dark",
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-400";
const selectClass = inputClass;
const panelClass =
  "rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur";

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getSceneDuration(scene: Scene) {
  return round1(Math.max(0.5, scene.end - scene.start));
}

function getTotalDuration(scenes: Scene[]) {
  if (scenes.length === 0) return 0;
  return round1(Math.max(...scenes.map((scene) => scene.end)));
}

function recalcScenesByDuration(scenes: Scene[]) {
  let cursor = 0;
  return scenes.map((scene) => {
    const duration = getSceneDuration(scene);
    const next = { ...scene, start: round1(cursor), end: round1(cursor + duration) };
    cursor += duration;
    return next;
  });
}

function getFallbackScene(): Scene {
  return {
    start: 0,
    end: 3,
    caption: "AI 쇼츠랩",
    subCaption: "주제를 입력하고 쇼츠를 생성해보세요",
    visual: "기본 배경",
    effect: "zoom",
    backgroundType: "solid",
    captionPosition: "bottom",
    captionSize: "medium",
    captionColor: "white",
    captionBg: "dark",
    sfxEnabled: false,
    sfxLabel: "",
    sfxTiming: "none",
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("파일을 읽을 수 없습니다."));
    };
    reader.onerror = () => reject(new Error("파일 읽기에 실패했습니다."));
    reader.readAsDataURL(file);
  });
}

async function uploadMediaFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload-media", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.url) {
    throw new Error(data.error || "파일 업로드에 실패했습니다.");
  }

  return data as { url: string; fileName: string };
}

function getTextColorClass(color: CaptionColor) {
  if (color === "yellow") return "text-yellow-300";
  if (color === "red") return "text-red-400";
  if (color === "purple") return "text-purple-300";
  return "text-white";
}

function getCaptionPositionClass(position: CaptionPosition) {
  if (position === "top") return "top-[8%]";
  if (position === "upper") return "top-[25%]";
  if (position === "middle") return "top-1/2 -translate-y-1/2";
  if (position === "lower") return "bottom-[25%]";
  return "bottom-[8%]";
}

function getThumbnailPositionClass(position: ThumbnailPosition) {
  if (position === "top") return "top-[12%]";
  if (position === "bottom") return "bottom-[12%]";
  return "top-1/2 -translate-y-1/2";
}

function getCaptionSizeClass(size: CaptionSize) {
  if (size === "small") return "text-xl";
  if (size === "large") return "text-3xl";
  return "text-2xl";
}

function StatusPill({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: "purple" | "green" | "yellow" | "zinc" | "red" | "blue";
}) {
  const color =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "yellow"
        ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
        : tone === "red"
          ? "border-red-400/20 bg-red-400/10 text-red-200"
          : tone === "blue"
            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
            : tone === "zinc"
              ? "border-white/10 bg-white/5 text-zinc-300"
              : "border-purple-400/20 bg-purple-400/10 text-purple-200";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${color}`}>{children}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export default function Home() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [genre, setGenre] = useState<Genre>("horror");
  const [topic, setTopic] = useState("");
  const [target, setTarget] = useState("");
  const [mood, setMood] = useState("");

  const [imageFileName, setImageFileName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageBase64, setImageBase64] = useState("");

  const [videoFileName, setVideoFileName] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [cutTitle, setCutTitle] = useState("영상 컷 장면");
  const [cutStart, setCutStart] = useState(0);
  const [cutEnd, setCutEnd] = useState(3);
  const [videoDuration, setVideoDuration] = useState(30);
  const [recommendedCuts, setRecommendedCuts] = useState<RecommendedCut[]>([]);
  const [isGeneratingCuts, setIsGeneratingCuts] = useState(false);

  const [bgmFileName, setBgmFileName] = useState("");
  const [bgmUrl, setBgmUrl] = useState("");
  const [bgmVolume, setBgmVolume] = useState(0.35);
  const [sfxFileName, setSfxFileName] = useState("");
  const [sfxUrl, setSfxUrl] = useState("");
  const [sfxVolume, setSfxVolume] = useState(0.7);

  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("alloy");
  const [narrationUrl, setNarrationUrl] = useState("");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  const [result, setResult] = useState<GeneratedShorts | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [thumbnail, setThumbnail] = useState<ThumbnailSettings>(defaultThumbnail);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoSortTimeline, setAutoSortTimeline] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState("");

  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const thumbnailRef = useRef<HTMLDivElement | null>(null);

  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);
  const maxTimelineDuration = Math.max(totalDuration, 1);
  const currentSceneIndex = useMemo(() => {
    if (scenes.length === 0) return 0;
    const index = scenes.findIndex((scene) => currentTime >= scene.start && currentTime < scene.end);
    return index === -1 ? scenes.length - 1 : index;
  }, [currentTime, scenes]);
  const currentScene = scenes[currentSceneIndex] ?? getFallbackScene();
  const thumbnailScene = scenes[Math.min(Math.max(thumbnail.sceneIndex, 0), Math.max(scenes.length - 1, 0))] ?? getFallbackScene();
  const remainingCredits = Math.max(100 - (scenes.length > 0 ? 12 + scenes.length : 0), 0);
  const videoCutScenes = useMemo(() => scenes.filter((scene) => scene.sceneVideoUrl && scene.videoClipStart !== undefined), [scenes]);

  function makeProjectPayload(): SavedProject {
    return {
      savedAt: new Date().toISOString(),
      platform,
      genre,
      topic,
      target,
      mood,
      imageFileName,
      imagePreviewUrl,
      imageBase64,
      videoFileName,
      videoPreviewUrl,
      cutTitle,
      cutStart,
      cutEnd,
      videoDuration,
      recommendedCuts,
      bgmFileName,
      bgmUrl,
      bgmVolume,
      sfxFileName,
      sfxUrl,
      sfxVolume,
      voiceStyle,
      narrationUrl,
      result,
      scenes,
      thumbnail,
      autoSortTimeline,
    };
  }

  function applyProject(project: SavedProject) {
    setPlatform(project.platform ?? "youtube");
    setGenre(project.genre ?? "horror");
    setTopic(project.topic ?? "");
    setTarget(project.target ?? "");
    setMood(project.mood ?? "");
    setImageFileName(project.imageFileName ?? "");
    setImagePreviewUrl(project.imagePreviewUrl ?? "");
    setImageBase64(project.imageBase64 ?? "");
    setVideoFileName(project.videoFileName ?? "");
    setVideoPreviewUrl(project.videoPreviewUrl ?? "");
    setCutTitle(project.cutTitle ?? "영상 컷 장면");
    setCutStart(project.cutStart ?? 0);
    setCutEnd(project.cutEnd ?? 3);
    setVideoDuration(project.videoDuration ?? 30);
    setRecommendedCuts(project.recommendedCuts ?? []);
    setBgmFileName(project.bgmFileName ?? "");
    setBgmUrl(project.bgmUrl ?? "");
    setBgmVolume(project.bgmVolume ?? 0.35);
    setSfxFileName(project.sfxFileName ?? "");
    setSfxUrl(project.sfxUrl ?? "");
    setSfxVolume(project.sfxVolume ?? 0.7);
    setVoiceStyle(project.voiceStyle ?? "alloy");
    setNarrationUrl(project.narrationUrl ?? "");
    setResult(project.result ?? null);
    setScenes(project.scenes ?? []);
    setThumbnail(project.thumbnail ?? defaultThumbnail);
    setAutoSortTimeline(project.autoSortTimeline ?? true);
    setCurrentTime(0);
    setIsPlaying(false);
  }

  function saveCurrentProject(silent = false) {
    const hasContent = Boolean(topic.trim() || scenes.length > 0 || imagePreviewUrl || videoPreviewUrl || bgmUrl || sfxUrl || narrationUrl);
    if (!hasContent) {
      if (!silent) alert("저장할 작업 내용이 없습니다.");
      return;
    }
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(makeProjectPayload()));
    if (!silent) alert("현재 작업이 저장되었습니다.");
  }

  function loadSavedProject() {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return alert("저장된 작업이 없습니다.");
    try {
      applyProject(JSON.parse(raw) as SavedProject);
      alert("저장된 작업을 불러왔습니다.");
    } catch (error) {
      console.error(error);
      alert("저장된 작업을 불러오지 못했습니다.");
    }
  }

  function clearSavedProject() {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
    alert("저장된 작업을 삭제했습니다.");
  }

  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) return;
    if (bgmAudioRef.current && bgmUrl) {
      bgmAudioRef.current.volume = bgmVolume;
      bgmAudioRef.current.play().catch(() => {});
    }
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const next = round1(prev + 0.1);
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying, totalDuration, bgmUrl, bgmVolume]);

  useEffect(() => {
    const timer = setTimeout(() => saveCurrentProject(true), 800);
    return () => clearTimeout(timer);
  }, [platform, genre, topic, target, mood, imageFileName, imagePreviewUrl, imageBase64, videoFileName, videoPreviewUrl, cutTitle, cutStart, cutEnd, videoDuration, recommendedCuts, bgmFileName, bgmUrl, bgmVolume, sfxFileName, sfxUrl, sfxVolume, voiceStyle, narrationUrl, result, scenes, thumbnail, autoSortTimeline]);

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setImageFileName(file.name);
    setImagePreviewUrl(base64);
    setImageBase64(base64);
  }

  async function handleVideoUpload(file: File | null) {
    if (!file) return;
    try {
      const data = await uploadMediaFile(file);
      setVideoFileName(file.name);
      setVideoPreviewUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("영상 업로드 중 오류가 발생했습니다.");
    }
  }

  async function handleBgmUpload(file: File | null) {
    if (!file) return;
    const data = await uploadMediaFile(file);
    setBgmFileName(file.name);
    setBgmUrl(data.url);
  }

  async function handleSfxUpload(file: File | null) {
    if (!file) return;
    const data = await uploadMediaFile(file);
    setSfxFileName(file.name);
    setSfxUrl(data.url);
  }

  function replaceScenes(nextScenes: Scene[]) {
    setScenes(nextScenes);
    setResult((old) => (old ? { ...old, scenes: nextScenes, duration: getTotalDuration(nextScenes) } : old));
  }

  function updateScene(index: number, patch: Partial<Scene>) {
    setScenes((prev) => {
      const next = prev.map((scene, sceneIndex) => (sceneIndex === index ? { ...scene, ...patch } : scene));
      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;
      setResult((old) => (old ? { ...old, scenes: finalScenes, duration: getTotalDuration(finalScenes) } : old));
      return finalScenes;
    });
  }

  function updateSceneDuration(index: number, duration: number) {
    setScenes((prev) => {
      const next = prev.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, end: round1(scene.start + Math.max(0.5, duration)) } : scene
      );
      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;
      setResult((old) => (old ? { ...old, scenes: finalScenes, duration: getTotalDuration(finalScenes) } : old));
      return finalScenes;
    });
  }

  function addScene() {
    const start = scenes[scenes.length - 1]?.end ?? 0;
    const newScene: Scene = {
      start,
      end: round1(start + 3),
      caption: "새 장면 자막",
      subCaption: "보조 자막",
      visual: "새 장면 화면 설명",
      effect: "zoom",
      backgroundType: "solid",
      captionPosition: "bottom",
      captionSize: "medium",
      captionColor: "white",
      captionBg: "dark",
      sfxEnabled: false,
      sfxLabel: "",
      sfxTiming: "none",
    };
    replaceScenes(autoSortTimeline ? recalcScenesByDuration([...scenes, newScene]) : [...scenes, newScene]);
  }

  function duplicateScene(index: number) {
    const targetScene = scenes[index];
    if (!targetScene) return;
    const next = [...scenes.slice(0, index + 1), { ...targetScene, caption: `${targetScene.caption} 복사` }, ...scenes.slice(index + 1)];
    replaceScenes(autoSortTimeline ? recalcScenesByDuration(next) : next);
  }

  function deleteScene(index: number) {
    replaceScenes(scenes.filter((_, sceneIndex) => sceneIndex !== index));
  }

  function moveScene(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;
    const nextScenes = [...scenes];
    const current = nextScenes[index];
    const target = nextScenes[targetIndex];
    if (!current || !target) return;
    nextScenes[index] = target;
    nextScenes[targetIndex] = current;
    replaceScenes(autoSortTimeline ? recalcScenesByDuration(nextScenes) : nextScenes);
  }

  async function handleSceneImageUpload(index: number, file: File | null) {
    if (!file) return;
    const base64 = await fileToBase64(file);
    updateScene(index, { sceneImageUrl: base64, sceneImageName: file.name, backgroundType: "sceneImage" });
  }

  async function handleSceneVideoUpload(index: number, file: File | null) {
    if (!file) return;
    const data = await uploadMediaFile(file);
    updateScene(index, {
      sceneVideoUrl: data.url,
      sceneVideoName: file.name,
      backgroundType: "sceneVideo",
      videoClipStart: 0,
      videoClipEnd: getSceneDuration(scenes[index] ?? getFallbackScene()),
    });
  }

  function createVideoCutScene(cut: RecommendedCut): Scene {
    const duration = round1(cut.end - cut.start);
    const timelineStart = scenes[scenes.length - 1]?.end ?? 0;
    return {
      start: timelineStart,
      end: round1(timelineStart + duration),
      caption: cut.title,
      subCaption: `${cut.start}s ~ ${cut.end}s`,
      visual: `${cut.start}초부터 ${cut.end}초까지 추천된 영상 컷`,
      effect: "zoom",
      backgroundType: "sceneVideo",
      captionPosition: "bottom",
      captionSize: "medium",
      captionColor: "white",
      captionBg: "dark",
      sceneVideoUrl: videoPreviewUrl,
      sceneVideoName: videoFileName || "uploaded-video",
      videoClipStart: cut.start,
      videoClipEnd: cut.end,
      sfxEnabled: false,
      sfxLabel: "",
      sfxTiming: "none",
    };
  }

  function addVideoCutScene() {
    if (!videoPreviewUrl) return alert("먼저 공통 영상을 업로드해주세요.");
    if (cutEnd <= cutStart) return alert("끝 시간은 시작 시간보다 커야 합니다.");
    const scene = createVideoCutScene({ title: cutTitle || "영상 컷 장면", start: cutStart, end: cutEnd });
    replaceScenes(autoSortTimeline ? recalcScenesByDuration([...scenes, scene]) : [...scenes, scene]);
    setCutStart(cutEnd);
    setCutEnd(round1(cutEnd + 3));
  }

  async function handleRecommendCuts() {
    if (!videoPreviewUrl) return alert("먼저 공통 영상을 업로드해주세요.");
    try {
      setIsGeneratingCuts(true);
      const response = await fetch("/api/recommend-cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: videoDuration }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "컷 추천 실패");
      setRecommendedCuts(data.cuts ?? []);
    } catch (error) {
      console.error(error);
      alert("AI 컷 추천 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingCuts(false);
    }
  }

  function addRecommendedCut(cut: RecommendedCut) {
    if (!videoPreviewUrl) return alert("먼저 영상을 업로드해주세요.");
    if (cut.end <= cut.start) return alert("추천 컷의 끝 시간이 시작 시간보다 커야 합니다.");
    const scene = createVideoCutScene(cut);
    replaceScenes(autoSortTimeline ? recalcScenesByDuration([...scenes, scene]) : [...scenes, scene]);
  }

  function addAllRecommendedCuts() {
    if (!videoPreviewUrl) return alert("먼저 영상을 업로드해주세요.");
    if (recommendedCuts.length === 0) return alert("추가할 추천 컷이 없습니다.");
    let timelineStart = scenes[scenes.length - 1]?.end ?? 0;
    const newScenes = recommendedCuts.map((cut) => {
      const duration = round1(cut.end - cut.start);
      const scene: Scene = {
        ...createVideoCutScene(cut),
        start: timelineStart,
        end: round1(timelineStart + duration),
      };
      timelineStart = scene.end;
      return scene;
    });
    replaceScenes(autoSortTimeline ? recalcScenesByDuration([...scenes, ...newScenes]) : [...scenes, ...newScenes]);
  }

  async function handleGenerate() {
    if (!topic.trim()) return alert("쇼츠 주제를 입력해주세요.");
    try {
      setIsGenerating(true);
      setRenderedVideoUrl("");
      setCurrentTime(0);
      setIsPlaying(false);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, genre, topic, target, mood, imageBase64 }),
      });
      if (!response.ok) throw new Error("쇼츠 생성 실패");
      const data: GeneratedShorts = await response.json();
      const normalizedScenes = recalcScenesByDuration(
        (data.scenes ?? []).map((scene) => ({
          ...scene,
          start: Number(scene.start ?? 0),
          end: Number(scene.end ?? 3),
          caption: scene.caption ?? "",
          subCaption: scene.subCaption ?? "",
          visual: scene.visual ?? "",
          effect: scene.effect ?? "zoom",
          backgroundType: scene.backgroundType ?? "solid",
          captionPosition: scene.captionPosition ?? "bottom",
          captionSize: scene.captionSize ?? "medium",
          captionColor: scene.captionColor ?? "white",
          captionBg: scene.captionBg ?? "dark",
          sfxEnabled: Boolean(scene.sfxEnabled),
          sfxLabel: scene.sfxLabel ?? "",
          sfxTiming: scene.sfxTiming ?? "none",
        }))
      );
      const nextThumbnail: ThumbnailSettings = {
        text: data.thumbnail?.text ?? data.thumbnailText ?? data.title ?? defaultThumbnail.text,
        subText: data.thumbnail?.subText ?? defaultThumbnail.subText,
        sceneIndex: Math.min(data.thumbnail?.sceneIndex ?? 0, Math.max(normalizedScenes.length - 1, 0)),
        textColor: data.thumbnail?.textColor ?? "yellow",
        position: data.thumbnail?.position ?? "middle",
        bgStyle: data.thumbnail?.bgStyle ?? "dark",
      };
      setResult({ ...data, scenes: normalizedScenes, duration: getTotalDuration(normalizedScenes), thumbnail: nextThumbnail });
      setScenes(normalizedScenes);
      setThumbnail(nextThumbnail);
    } catch (error) {
      console.error(error);
      alert("쇼츠 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateVisuals() {
    if (scenes.length === 0) return alert("먼저 쇼츠를 생성해주세요.");
    try {
      setIsGeneratingVisuals(true);
      const response = await fetch("/api/generate-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, scenes }),
      });
      const data = await response.json();
      replaceScenes(data.scenes ?? scenes);
    } catch (error) {
      console.error(error);
      alert("장면별 비주얼 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingVisuals(false);
    }
  }

  async function handleGenerateSingleSceneVisual(index: number) {
    try {
      setGeneratingSceneIndex(index);
      const response = await fetch("/api/generate-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, scenes, sceneIndex: index }),
      });
      const data = await response.json();
      replaceScenes(data.scenes ?? scenes);
    } catch (error) {
      console.error(error);
      alert("이 장면의 AI 배경 생성 중 오류가 발생했습니다.");
    } finally {
      setGeneratingSceneIndex(null);
    }
  }

  async function handleGenerateVoice() {
    if (!result?.script) return alert("먼저 쇼츠를 생성해주세요.");
    try {
      setIsGeneratingVoice(true);
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.script, voice: voiceStyle }),
      });
      const data = await response.json();
      if (data.fallback) return alert("현재 OPENAI_API_KEY가 없어 실제 음성 생성은 비활성화 상태입니다.");
      if (!response.ok) throw new Error(data.error || "음성 생성 실패");
      setNarrationUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("AI 음성 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  async function handleRenderVideo() {
    if (scenes.length === 0) return alert("먼저 쇼츠를 생성해주세요.");
    try {
      setIsRendering(true);
      setRenderedVideoUrl("");
      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result?.title ?? "쇼츠랩 AI 영상",
          duration: totalDuration,
          scenes,
          thumbnail,
          uploadedImageUrl: imagePreviewUrl,
          uploadedVideoUrl: videoPreviewUrl,
          bgmUrl,
          narrationUrl,
          sfxUrl,
          bgmVolume,
          narrationVolume: 1,
          sfxVolume,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "렌더링 실패");
      setRenderedVideoUrl(data.downloadUrl ?? data.url);
    } catch (error) {
      console.error(error);
      alert("MP4 렌더링 중 오류가 발생했습니다.");
    } finally {
      setIsRendering(false);
    }
  }

  async function handleDownloadThumbnail() {
    if (!thumbnailRef.current) return;
    const dataUrl = await toPng(thumbnailRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: "#09090b" });
    const link = document.createElement("a");
    link.download = "shortslab-thumbnail.png";
    link.href = dataUrl;
    link.click();
  }

  function renderSceneBackground(scene: Scene) {
    if (scene.backgroundType === "sceneVideo" && scene.sceneVideoUrl) {
      return <video src={scene.sceneVideoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />;
    }
    if (scene.backgroundType === "uploadedVideo" && videoPreviewUrl) {
      return <video src={videoPreviewUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />;
    }
    if (scene.backgroundType === "sceneImage" && scene.sceneImageUrl) {
      return <img src={scene.sceneImageUrl} alt="" className="h-full w-full object-cover" />;
    }
    if (scene.backgroundType === "uploadedImage" && imagePreviewUrl) {
      return <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />;
    }
    if (scene.backgroundType === "generatedImage" && scene.imageUrl) {
      return <img src={scene.imageUrl} alt="" className="h-full w-full object-cover" />;
    }
    return <div className="h-full w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950" />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#3b0764,transparent_35%),radial-gradient(circle_at_top_right,#312e81,transparent_30%),#050505] text-white">
      <audio ref={bgmAudioRef} src={bgmUrl || undefined} loop />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-600 text-sm font-black">SL</div>
            <div>
              <p className="text-sm font-black">ShortsLab AI</p>
              <p className="text-[10px] font-bold text-zinc-500">AI Shorts Production Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone="yellow">{remainingCredits} Credits</StatusPill>
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black">로그인</button>
            <button className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-950">업그레이드</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 md:px-6">
        <header className={panelClass}>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusPill>Creator Studio</StatusPill>
                <StatusPill tone="blue">MVP Preview</StatusPill>
                <StatusPill tone="zinc">9:16 Video</StatusPill>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                AI로 쇼츠를 기획하고,
                <br />
                장면별로 편집하고, 영상으로 렌더링하세요.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                주제 입력부터 장면 구성, 썸네일, 배경, 오디오, MP4 렌더링까지 이어지는 AI 쇼츠 제작 스튜디오입니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={handleGenerate} disabled={isGenerating} className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                  {isGenerating ? "AI 쇼츠 생성 중..." : "새 쇼츠 생성하기"}
                </button>
                <button onClick={() => saveCurrentProject(false)} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-200">작업 저장</button>
                <button onClick={loadSavedProject} className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-200">저장 불러오기</button>
                <button onClick={clearSavedProject} className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-black text-red-200">저장 삭제</button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-bold text-zinc-500">계정</p>
                <p className="mt-1 text-lg font-black">Guest Creator</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.045] p-4">
                    <p className="text-xs text-zinc-500">장면 수</p>
                    <p className="mt-1 text-2xl font-black">{scenes.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.045] p-4">
                    <p className="text-xs text-zinc-500">총 길이</p>
                    <p className="mt-1 text-2xl font-black">{totalDuration}s</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[26px] border border-yellow-400/20 bg-yellow-400/10 p-5">
                <p className="text-xs font-bold text-yellow-200/70">크레딧</p>
                <p className="mt-1 text-3xl font-black text-yellow-100">{remainingCredits}</p>
                <p className="mt-3 text-xs text-yellow-100/80">AI 생성과 렌더링에 사용할 크레딧 UI입니다.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(360px,520px)_1fr]">
          <aside className="flex flex-col gap-5">
            <section className={panelClass}>
              <h2 className="mb-5 text-base font-black">프로젝트 입력</h2>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="플랫폼">
                    <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className={selectClass}>
                      {platformOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="장르">
                    <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} className={selectClass}>
                      {genreOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="쇼츠 주제">
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className={`${inputClass} min-h-28 resize-none`} />
                </Field>
                <Field label="타깃">
                  <input value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />
                </Field>
                <Field label="분위기">
                  <input value={mood} onChange={(e) => setMood(e.target.value)} className={inputClass} />
                </Field>
                <button onClick={handleGenerate} disabled={isGenerating} className="rounded-2xl bg-purple-500 px-5 py-4 text-sm font-black disabled:opacity-50">
                  {isGenerating ? "AI 쇼츠 생성 중..." : "AI 쇼츠 생성하기"}
                </button>
              </div>
            </section>

            <section className={panelClass}>
              <h2 className="mb-5 text-base font-black">쇼츠 템플릿</h2>
              <div className="grid gap-3">
                {shortsTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setGenre(template.genre);
                      setTopic(template.topic);
                      setTarget(template.target);
                      setMood(template.mood);
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-purple-400/40"
                  >
                    <p className="text-xl">{template.emoji}</p>
                    <p className="mt-1 text-sm font-black">{template.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{template.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className={panelClass}>
              <h2 className="mb-5 text-base font-black">자료 업로드 / 컷 편집</h2>
              <div className="flex flex-col gap-4">
                <Field label="공통 이미지">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} className={inputClass} />
                </Field>
                {imagePreviewUrl && <img src={imagePreviewUrl} alt="" className="h-36 rounded-2xl object-cover" />}

                <Field label="공통 영상">
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files?.[0] ?? null)} className={inputClass} />
                </Field>

                {videoPreviewUrl && (
                  <div className="flex flex-col gap-4">
                    <video src={videoPreviewUrl} controls className="h-36 rounded-2xl object-cover" />

                    <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-4">
                      <div className="mb-3">
                        <p className="font-black text-purple-100">영상 컷 만들기</p>
                        <p className="mt-1 text-xs text-purple-200/70">업로드한 영상의 시작/끝 시간을 지정해 장면으로 추가합니다.</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Field label="컷 제목">
                          <input value={cutTitle} onChange={(e) => setCutTitle(e.target.value)} className={inputClass} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="시작 시간 / 초">
                            <input type="number" min="0" step="0.1" value={cutStart} onChange={(e) => setCutStart(Number(e.target.value))} className={inputClass} />
                          </Field>
                          <Field label="끝 시간 / 초">
                            <input type="number" min="0" step="0.1" value={cutEnd} onChange={(e) => setCutEnd(Number(e.target.value))} className={inputClass} />
                          </Field>
                        </div>
                        <button onClick={addVideoCutScene} className="rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white">
                          이 구간을 장면으로 추가
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black">AI 컷 추천</p>
                            <p className="mt-1 text-xs text-zinc-500">영상 길이에 맞춰 자동으로 컷을 추천합니다.</p>
                          </div>
                          <StatusPill tone="purple">{recommendedCuts.length} cuts</StatusPill>
                        </div>

                        <div className="flex gap-3">
                          <input type="number" min="5" step="1" value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} className={inputClass} placeholder="영상 길이" />
                          <button onClick={handleRecommendCuts} disabled={isGeneratingCuts} className="shrink-0 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white disabled:opacity-40">
                            {isGeneratingCuts ? "추천 중..." : "AI 컷 추천"}
                          </button>
                        </div>

                        {recommendedCuts.length > 0 && (
                          <div className="mt-4 flex flex-col gap-2">
                            <button onClick={addAllRecommendedCuts} className="mb-2 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white">
                              추천 컷 전체 장면 추가
                            </button>

                            {recommendedCuts.map((cut, index) => (
                              <div key={`${cut.start}-${cut.end}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                                <div>
                                  <p className="text-sm font-black">{cut.title}</p>
                                  <p className="text-xs text-zinc-500">{cut.start}s ~ {cut.end}s</p>
                                </div>
                                <button onClick={() => addRecommendedCut(cut)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">
                                  장면 추가
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {videoCutScenes.length > 0 && (
                      <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-black">영상 컷 목록</p>
                          <StatusPill tone="purple">{videoCutScenes.length} cuts</StatusPill>
                        </div>

                        <div className="flex flex-col gap-2">
                          {videoCutScenes.map((scene, index) => {
                            const clipStart = scene.videoClipStart ?? 0;
                            const clipEnd = scene.videoClipEnd ?? scene.end;
                            const clipWidth = Math.min(Math.max((clipEnd - clipStart) * 12, 6), 100);

                            return (
                              <div key={`${scene.start}-${scene.end}-${index}`} className="rounded-2xl bg-white/5 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-black">{scene.caption}</p>
                                  <span className="shrink-0 text-xs text-zinc-400">{clipStart}s~{clipEnd}s</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                  <div className="h-full rounded-full bg-purple-400" style={{ width: `${clipWidth}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={panelClass}>
              <h2 className="mb-5 text-base font-black">오디오 / AI 음성</h2>
              <div className="flex flex-col gap-4">
                <Field label="BGM 업로드">
                  <input type="file" accept="audio/*" onChange={(e) => handleBgmUpload(e.target.files?.[0] ?? null)} className={inputClass} />
                </Field>
                {bgmFileName && <StatusPill tone="green">BGM: {bgmFileName}</StatusPill>}
                <Field label={`BGM 볼륨 ${Math.round(bgmVolume * 100)}%`}>
                  <input type="range" min="0" max="1" step="0.05" value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))} />
                </Field>

                <Field label="효과음 업로드">
                  <input type="file" accept="audio/*" onChange={(e) => handleSfxUpload(e.target.files?.[0] ?? null)} className={inputClass} />
                </Field>
                {sfxFileName && <StatusPill tone="green">SFX: {sfxFileName}</StatusPill>}
                <Field label={`효과음 볼륨 ${Math.round(sfxVolume * 100)}%`}>
                  <input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))} />
                </Field>

                <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-black">AI 나레이션</p>
                      <p className="text-xs text-zinc-400">대본 기반 자동 음성 생성</p>
                    </div>
                    <StatusPill>TTS</StatusPill>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {[
                      { value: "alloy", label: "기본" },
                      { value: "nova", label: "여성" },
                      { value: "shimmer", label: "감성" },
                      { value: "echo", label: "무게감" },
                      { value: "verse", label: "틱톡" },
                    ].map((voice) => (
                      <button key={voice.value} onClick={() => setVoiceStyle(voice.value as VoiceStyle)} className={`rounded-xl px-3 py-2 text-xs font-bold ${voiceStyle === voice.value ? "bg-purple-500 text-white" : "bg-white/10 text-zinc-300"}`}>
                        {voice.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleGenerateVoice} disabled={isGeneratingVoice} className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-3 text-sm font-black disabled:opacity-50">
                    {isGeneratingVoice ? "AI 음성 생성 중..." : "AI 나레이션 생성"}
                  </button>
                  {narrationUrl && <audio controls src={narrationUrl} className="mt-4 w-full" />}
                </div>
              </div>
            </section>
          </aside>

          <section className="flex flex-col gap-5">
            <div className={panelClass}>
              <h2 className="mb-5 text-base font-black">라이브 프리뷰</h2>
              <div className="flex justify-center">
                <div className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[34px] border border-white/10 bg-zinc-950">
                  <div className="absolute inset-0">{renderSceneBackground(currentScene)}</div>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute left-4 top-4">
                    <StatusPill tone="zinc">{round1(currentTime)}s / {totalDuration}s</StatusPill>
                  </div>
                  <div className={`absolute left-5 right-5 text-center ${getCaptionPositionClass(currentScene.captionPosition)}`}>
                    <div className={`inline-block rounded-3xl px-5 py-4 font-black leading-tight ${getCaptionSizeClass(currentScene.captionSize)} ${getTextColorClass(currentScene.captionColor)} ${currentScene.captionBg === "dark" ? "bg-black/65" : ""}`}>
                      {currentScene.caption}
                    </div>
                    {currentScene.subCaption && <p className="mx-auto mt-3 max-w-[92%] rounded-full bg-black/55 px-4 py-2 text-sm font-bold">{currentScene.subCaption}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setIsPlaying((prev) => !prev)} disabled={scenes.length === 0} className="rounded-2xl bg-white px-4 py-4 text-sm font-black text-zinc-950 disabled:opacity-40">
                  {isPlaying ? "일시정지" : "재생"}
                </button>
                <button onClick={() => { setCurrentTime(0); setIsPlaying(true); }} disabled={scenes.length === 0} className="rounded-2xl bg-white/10 px-4 py-4 text-sm font-black disabled:opacity-40">
                  다시보기
                </button>
                <button onClick={handleGenerateVisuals} disabled={scenes.length === 0 || isGeneratingVisuals} className="rounded-2xl bg-purple-500 px-4 py-4 text-sm font-black disabled:opacity-40">
                  {isGeneratingVisuals ? "생성 중..." : "전체 AI 배경"}
                </button>
                <button onClick={handleRenderVideo} disabled={scenes.length === 0 || isRendering} className="rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-black disabled:opacity-40">
                  {isRendering ? "렌더링 중..." : "MP4 렌더링"}
                </button>
              </div>
              {renderedVideoUrl && <a href={renderedVideoUrl} download className="mt-3 block rounded-2xl bg-emerald-400/10 px-5 py-4 text-center text-sm font-black text-emerald-200">완성된 MP4 다운로드</a>}
            </div>

            {result && (
              <div className={panelClass}>
                <h2 className="mb-4 text-base font-black">AI 생성 결과</h2>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">제목</p>
                  <p className="mt-1 font-black">{result.title}</p>
                </div>
                <details className="mt-3 rounded-2xl bg-black/25 p-4">
                  <summary className="cursor-pointer text-sm font-black">전체 대본 보기</summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{result.script}</p>
                </details>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <section className={panelClass}>
              <h2 className="mb-5 text-base font-black">썸네일 스튜디오</h2>
              <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
                <div ref={thumbnailRef} className="relative aspect-[9/16] w-full max-w-[210px] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950">
                  <div className={`absolute inset-0 ${thumbnail.bgStyle === "blur" ? "scale-110 blur-sm" : ""}`}>
                    {renderSceneBackground(thumbnailScene)}
                  </div>
                  <div className={`${thumbnail.bgStyle === "dark" ? "bg-black/55" : "bg-black/10"} absolute inset-0`} />
                  <div className={`absolute left-4 right-4 text-center ${getThumbnailPositionClass(thumbnail.position)}`}>
                    <div className={`inline-block rounded-3xl px-4 py-3 text-2xl font-black ${getTextColorClass(thumbnail.textColor)} ${thumbnail.bgStyle === "dark" ? "bg-black/65" : ""}`}>
                      {thumbnail.text}
                    </div>
                    {thumbnail.subText && <p className="mx-auto mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-950">{thumbnail.subText}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Field label="메인 문구">
                    <input value={thumbnail.text} onChange={(e) => setThumbnail((prev) => ({ ...prev, text: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="서브 문구">
                    <input value={thumbnail.subText} onChange={(e) => setThumbnail((prev) => ({ ...prev, subText: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="배경 장면">
                    <select value={thumbnail.sceneIndex} onChange={(e) => setThumbnail((prev) => ({ ...prev, sceneIndex: Number(e.target.value) }))} className={selectClass}>
                      {scenes.length === 0 ? <option value={0}>장면 없음</option> : scenes.map((_, index) => <option key={index} value={index}>{index + 1}번 장면</option>)}
                    </select>
                  </Field>
                  <Field label="썸네일 위치">
                    <select value={thumbnail.position} onChange={(e) => setThumbnail((prev) => ({ ...prev, position: e.target.value as ThumbnailPosition }))} className={selectClass}>
                      <option value="top">상단</option>
                      <option value="middle">중앙</option>
                      <option value="bottom">하단</option>
                    </select>
                  </Field>
                  <Field label="썸네일 색상">
                    <select value={thumbnail.textColor} onChange={(e) => setThumbnail((prev) => ({ ...prev, textColor: e.target.value as CaptionColor }))} className={selectClass}>
                      {captionColorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="썸네일 배경">
                    <select value={thumbnail.bgStyle} onChange={(e) => setThumbnail((prev) => ({ ...prev, bgStyle: e.target.value as ThumbnailBgStyle }))} className={selectClass}>
                      <option value="dark">어둡게</option>
                      <option value="blur">블러</option>
                      <option value="none">없음</option>
                    </select>
                  </Field>
                  <button onClick={handleDownloadThumbnail} disabled={scenes.length === 0} className="rounded-2xl bg-yellow-300 px-4 py-4 text-sm font-black text-zinc-950 disabled:opacity-40">
                    썸네일 PNG 다운로드
                  </button>
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <h2 className="mb-4 text-base font-black">빠른 상태</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">이미지</p>
                  <p className="font-black">{imagePreviewUrl ? "연결됨" : "없음"}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">영상</p>
                  <p className="font-black">{videoPreviewUrl ? "연결됨" : "없음"}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">BGM</p>
                  <p className="font-black">{bgmUrl ? "연결됨" : "없음"}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">AI 음성</p>
                  <p className="font-black">{narrationUrl ? "연결됨" : "없음"}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className={panelClass}>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">장면 타임라인</h2>
              <p className="mt-1 text-sm text-zinc-500">장면별 자막, 배경, 효과음, 길이를 편집합니다.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAutoSortTimeline((prev) => !prev)} className="rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black">
                자동 정렬 {autoSortTimeline ? "ON" : "OFF"}
              </button>
              <button onClick={addScene} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950">
                장면 추가
              </button>
            </div>
          </div>

          {scenes.length > 0 && (
            <div className="mb-5 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-black">비주얼 타임라인</p>
                  <p className="mt-1 text-xs text-zinc-500">전체 {totalDuration}s / 장면 {scenes.length}개</p>
                </div>
                <StatusPill tone="blue">Timeline</StatusPill>
              </div>
              <div className="flex h-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {scenes.map((scene, index) => (
                  <div
                    key={`${scene.start}-${scene.end}-${index}`}
                    className="flex min-w-[42px] items-center justify-center border-r border-black/30 bg-purple-500 px-2 text-xs font-black"
                    style={{ width: `${Math.max((getSceneDuration(scene) / maxTimelineDuration) * 100, 8)}%` }}
                    title={`${index + 1}번 장면 ${scene.start}s~${scene.end}s`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {scenes.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
                <p className="text-sm font-bold text-zinc-400">아직 생성된 장면이 없습니다.</p>
                <p className="mt-2 text-xs text-zinc-600">쇼츠 생성 또는 영상 컷 추가로 장면을 만들어주세요.</p>
              </div>
            )}

            {scenes.map((scene, index) => (
              <div key={`${scene.start}-${scene.end}-${index}`} className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">Scene {index + 1}</p>
                    <p className="text-xs text-zinc-500">
                      {scene.start}s ~ {scene.end}s · {getSceneDuration(scene)}초
                      {scene.videoClipStart !== undefined ? ` · 원본 컷 ${scene.videoClipStart}s~${scene.videoClipEnd}s` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => moveScene(index, "up")} disabled={index === 0} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold disabled:opacity-30">위로</button>
                    <button onClick={() => moveScene(index, "down")} disabled={index === scenes.length - 1} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold disabled:opacity-30">아래로</button>
                    <button onClick={() => handleGenerateSingleSceneVisual(index)} disabled={generatingSceneIndex !== null} className="rounded-xl bg-purple-500 px-3 py-2 text-xs font-black disabled:opacity-40">
                      {generatingSceneIndex === index ? "생성 중..." : "AI 배경"}
                    </button>
                    <button onClick={() => duplicateScene(index)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">복제</button>
                    <button onClick={() => deleteScene(index)} className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-200">삭제</button>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="flex flex-col gap-3">
                    <Field label="메인 자막">
                      <input value={scene.caption} onChange={(e) => updateScene(index, { caption: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="보조 자막">
                      <input value={scene.subCaption} onChange={(e) => updateScene(index, { subCaption: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="화면 설명">
                      <textarea value={scene.visual} onChange={(e) => updateScene(index, { visual: e.target.value })} className={`${inputClass} min-h-24 resize-none`} />
                    </Field>
                    <Field label="장면 길이">
                      <input type="number" min="0.5" step="0.1" value={getSceneDuration(scene)} onChange={(e) => updateSceneDuration(index, Number(e.target.value))} className={inputClass} />
                    </Field>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Field label="배경 타입">
                      <select value={scene.backgroundType} onChange={(e) => updateScene(index, { backgroundType: e.target.value as BackgroundType })} className={selectClass}>
                        <option value="solid">기본 배경</option>
                        <option value="uploadedImage">공통 이미지</option>
                        <option value="uploadedVideo">공통 영상</option>
                        <option value="generatedImage">AI 생성 이미지</option>
                        <option value="sceneImage">장면별 이미지</option>
                        <option value="sceneVideo">장면별 영상</option>
                      </select>
                    </Field>
                    <Field label="이 장면 이미지">
                      <input type="file" accept="image/*" onChange={(e) => handleSceneImageUpload(index, e.target.files?.[0] ?? null)} className={inputClass} />
                    </Field>
                    <Field label="이 장면 영상">
                      <input type="file" accept="video/*" onChange={(e) => handleSceneVideoUpload(index, e.target.files?.[0] ?? null)} className={inputClass} />
                    </Field>
                    {scene.sceneVideoUrl && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="원본 시작">
                          <input type="number" min="0" step="0.1" value={scene.videoClipStart ?? 0} onChange={(e) => updateScene(index, { videoClipStart: Number(e.target.value) })} className={inputClass} />
                        </Field>
                        <Field label="원본 끝">
                          <input type="number" min="0" step="0.1" value={scene.videoClipEnd ?? getSceneDuration(scene)} onChange={(e) => updateScene(index, { videoClipEnd: Number(e.target.value) })} className={inputClass} />
                        </Field>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Field label="자막 위치">
                      <select value={scene.captionPosition} onChange={(e) => updateScene(index, { captionPosition: e.target.value as CaptionPosition })} className={selectClass}>
                        {captionPositionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="자막 크기">
                      <select value={scene.captionSize} onChange={(e) => updateScene(index, { captionSize: e.target.value as CaptionSize })} className={selectClass}>
                        {captionSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="자막 색상">
                      <select value={scene.captionColor} onChange={(e) => updateScene(index, { captionColor: e.target.value as CaptionColor })} className={selectClass}>
                        {captionColorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="연출 효과">
                      <select value={scene.effect} onChange={(e) => updateScene(index, { effect: e.target.value as SceneEffect })} className={selectClass}>
                        {effectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <button onClick={() => updateScene(index, { sfxEnabled: !scene.sfxEnabled })} className={`rounded-2xl px-4 py-3 text-sm font-black ${scene.sfxEnabled ? "bg-emerald-500" : "bg-white/10"}`}>
                      효과음 {scene.sfxEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}