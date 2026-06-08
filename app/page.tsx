"use client";

import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";

type Platform = "youtube" | "tiktok" | "instagram";
type Genre =
  | "horror"
  | "info"
  | "romance"
  | "story"
  | "money"
  | "daily"
  | "vlog";

type CaptionPosition = "top" | "upper" | "middle" | "lower" | "bottom";
type CaptionSize = "small" | "medium" | "large";
type CaptionColor = "white" | "yellow" | "red" | "purple";
type CaptionBg = "none" | "dark";
type SceneEffect = "zoom" | "shake" | "fade" | "slide" | "none";

type BackgroundType =
  | "solid"
  | "uploadedImage"
  | "uploadedVideo"
  | "generatedImage"
  | "sceneImage"
  | "sceneVideo";

type SfxTiming = "sceneStart" | "impact" | "none";
type ThumbnailPosition = "top" | "middle" | "bottom";
type ThumbnailBgStyle = "dark" | "blur" | "none";

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

type UploadMediaResponse = {
  success: boolean;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  error?: string;
};

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

const effectOptions: { value: SceneEffect; label: string }[] = [
  { value: "zoom", label: "줌인" },
  { value: "shake", label: "흔들림" },
  { value: "fade", label: "페이드" },
  { value: "slide", label: "슬라이드" },
  { value: "none", label: "없음" },
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

const captionBgOptions: { value: CaptionBg; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "dark", label: "검정 반투명" },
];

const sfxTimingOptions: { value: SfxTiming; label: string }[] = [
  { value: "sceneStart", label: "장면 시작" },
  { value: "impact", label: "임팩트 지점" },
  { value: "none", label: "없음" },
];

const thumbnailPositionOptions: { value: ThumbnailPosition; label: string }[] = [
  { value: "top", label: "상단" },
  { value: "middle", label: "중앙" },
  { value: "bottom", label: "하단" },
];

const thumbnailBgStyleOptions: { value: ThumbnailBgStyle; label: string }[] = [
  { value: "dark", label: "검정 배경" },
  { value: "blur", label: "블러 배경" },
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

const panelClass =
  "rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20";

const selectClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20";

const smallLabelClass = "text-xs font-semibold text-zinc-400";
const sectionTitleClass = "text-base font-black text-white";

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getSceneDuration(scene: Scene) {
  return round1(Math.max(0.5, scene.end - scene.start));
}

function recalcScenesByDuration(scenes: Scene[]) {
  let cursor = 0;

  return scenes.map((scene) => {
    const duration = getSceneDuration(scene);

    const nextScene = {
      ...scene,
      start: round1(cursor),
      end: round1(cursor + duration),
    };

    cursor += duration;
    return nextScene;
  });
}

function getTotalDuration(scenes: Scene[]) {
  if (scenes.length === 0) return 0;
  return round1(Math.max(...scenes.map((scene) => scene.end)));
}

function getFallbackScene(): Scene {
  return {
    start: 0,
    end: 3,
    caption: "AI 쇼츠랩",
    subCaption: "주제를 입력하고 쇼츠를 생성해보세요",
    visual: "어두운 배경 위에 강렬한 제목이 등장한다.",
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

function getCaptionPositionClass(position: CaptionPosition) {
  switch (position) {
    case "top":
      return "top-[8%]";
    case "upper":
      return "top-[25%]";
    case "middle":
      return "top-1/2 -translate-y-1/2";
    case "lower":
      return "bottom-[25%]";
    case "bottom":
      return "bottom-[8%]";
    default:
      return "bottom-[8%]";
  }
}

function getCaptionSizeClass(size: CaptionSize) {
  switch (size) {
    case "small":
      return "text-xl";
    case "medium":
      return "text-2xl";
    case "large":
      return "text-3xl";
    default:
      return "text-2xl";
  }
}

function getTextColorClass(color: CaptionColor) {
  switch (color) {
    case "white":
      return "text-white";
    case "yellow":
      return "text-yellow-300";
    case "red":
      return "text-red-400";
    case "purple":
      return "text-purple-300";
    default:
      return "text-white";
  }
}

function getThumbnailPositionClass(position: ThumbnailPosition) {
  switch (position) {
    case "top":
      return "top-[12%]";
    case "middle":
      return "top-1/2 -translate-y-1/2";
    case "bottom":
      return "bottom-[12%]";
    default:
      return "top-1/2 -translate-y-1/2";
  }
}

function getEffectClass(effect: SceneEffect, isPlaying: boolean) {
  if (!isPlaying) return "";

  switch (effect) {
    case "zoom":
      return "scale-110 transition-transform duration-1000";
    case "shake":
      return "animate-pulse";
    case "fade":
      return "opacity-80 transition-opacity duration-700";
    case "slide":
      return "translate-x-1 transition-transform duration-700";
    case "none":
      return "";
    default:
      return "";
  }
}

function getBackgroundTypeLabel(type: BackgroundType) {
  switch (type) {
    case "solid":
      return "기본 배경";
    case "uploadedImage":
      return "공통 이미지";
    case "uploadedVideo":
      return "공통 영상";
    case "generatedImage":
      return "AI 생성 이미지";
    case "sceneImage":
      return "장면별 이미지";
    case "sceneVideo":
      return "장면별 영상";
    default:
      return "기본 배경";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("파일을 읽을 수 없습니다."));
      }
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

  const data = (await response.json()) as UploadMediaResponse;

  if (!response.ok || !data.url) {
    throw new Error(data.error || "파일 업로드에 실패했습니다.");
  }

  return data;
}

function StatusPill({
  children,
  tone = "purple",
}: {
  children: React.ReactNode;
  tone?: "purple" | "green" | "yellow" | "zinc" | "red" | "blue";
}) {
  const toneClass =
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

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={smallLabelClass}>{label}</span>
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

  const [bgmFileName, setBgmFileName] = useState("");
  const [bgmUrl, setBgmUrl] = useState("");
  const [bgmVolume, setBgmVolume] = useState(0.35);

  const [sfxFileName, setSfxFileName] = useState("");
  const [sfxUrl, setSfxUrl] = useState("");
  const [sfxVolume, setSfxVolume] = useState(0.7);

  const [result, setResult] = useState<GeneratedShorts | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [thumbnail, setThumbnail] =
    useState<ThumbnailSettings>(defaultThumbnail);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoSortTimeline, setAutoSortTimeline] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(
    null
  );
  const [isRendering, setIsRendering] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState("");

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingBgm, setIsUploadingBgm] = useState(false);
  const [isUploadingSfx, setIsUploadingSfx] = useState(false);
  const [uploadingSceneVideoIndex, setUploadingSceneVideoIndex] = useState<
    number | null
  >(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSfxSceneIndexRef = useRef<number | null>(null);
  const thumbnailRef = useRef<HTMLDivElement | null>(null);

  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);

  const currentSceneIndex = useMemo(() => {
    if (scenes.length === 0) return 0;

    const index = scenes.findIndex(
      (scene) => currentTime >= scene.start && currentTime < scene.end
    );

    if (index === -1) return scenes.length - 1;
    return index;
  }, [currentTime, scenes]);

  const currentScene = scenes[currentSceneIndex] ?? getFallbackScene();

  const thumbnailScene = useMemo(() => {
    if (scenes.length === 0) return getFallbackScene();

    const safeIndex = Math.min(
      Math.max(thumbnail.sceneIndex, 0),
      scenes.length - 1
    );

    return scenes[safeIndex] ?? scenes[0];
  }, [scenes, thumbnail.sceneIndex]);

  const usedCredits = scenes.length > 0 ? 12 + scenes.length : 0;
  const totalCredits = 100;
  const remainingCredits = Math.max(totalCredits - usedCredits, 0);
  const creditPercent = Math.min((remainingCredits / totalCredits) * 100, 100);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }

      return;
    }

    if (bgmAudioRef.current && bgmUrl) {
      bgmAudioRef.current.volume = bgmVolume;
      bgmAudioRef.current.play().catch(() => {});
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = round1(prev + 0.1);

        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }

        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, totalDuration, bgmUrl, bgmVolume]);

  useEffect(() => {
    if (!isPlaying || !sfxUrl || !currentScene?.sfxEnabled) return;

    const shouldPlay =
      currentScene.sfxTiming === "sceneStart" ||
      currentScene.sfxTiming === "impact";

    if (!shouldPlay) return;
    if (lastSfxSceneIndexRef.current === currentSceneIndex) return;

    const sceneElapsed = currentTime - currentScene.start;

    if (sceneElapsed >= 0 && sceneElapsed <= 0.25) {
      lastSfxSceneIndexRef.current = currentSceneIndex;

      if (sfxAudioRef.current) {
        sfxAudioRef.current.currentTime = 0;
        sfxAudioRef.current.volume = sfxVolume;
        sfxAudioRef.current.play().catch(() => {});
      }
    }
  }, [currentTime, currentScene, currentSceneIndex, isPlaying, sfxUrl, sfxVolume]);

  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);

  useEffect(() => {
    if (sfxAudioRef.current) {
      sfxAudioRef.current.volume = sfxVolume;
    }
  }, [sfxVolume]);

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
      setIsUploadingVideo(true);
      const data = await uploadMediaFile(file);

      setVideoFileName(file.name);
      setVideoPreviewUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("영상 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingVideo(false);
    }
  }

  async function handleBgmUpload(file: File | null) {
    if (!file) return;

    try {
      setIsUploadingBgm(true);
      const data = await uploadMediaFile(file);

      setBgmFileName(file.name);
      setBgmUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("BGM 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingBgm(false);
    }
  }

  async function handleSfxUpload(file: File | null) {
    if (!file) return;

    try {
      setIsUploadingSfx(true);
      const data = await uploadMediaFile(file);

      setSfxFileName(file.name);
      setSfxUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("효과음 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingSfx(false);
    }
  }

  function updateScene(index: number, patch: Partial<Scene>) {
    setScenes((prev) => {
      const next = prev.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, ...patch } : scene
      );

      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;

      setResult((old) =>
        old
          ? {
              ...old,
              scenes: finalScenes,
              duration: getTotalDuration(finalScenes),
            }
          : old
      );

      return finalScenes;
    });
  }

  function replaceScenes(nextScenes: Scene[]) {
    setScenes(nextScenes);
    setResult((old) =>
      old
        ? {
            ...old,
            scenes: nextScenes,
            duration: getTotalDuration(nextScenes),
          }
        : old
    );
  }

  function updateSceneDuration(index: number, duration: number) {
    const safeDuration = round1(Math.max(0.5, duration));

    setScenes((prev) => {
      const next = prev.map((scene, sceneIndex) => {
        if (sceneIndex !== index) return scene;

        return {
          ...scene,
          end: round1(scene.start + safeDuration),
        };
      });

      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;

      setResult((old) =>
        old
          ? {
              ...old,
              scenes: finalScenes,
              duration: getTotalDuration(finalScenes),
            }
          : old
      );

      return finalScenes;
    });
  }

  async function handleSceneImageUpload(index: number, file: File | null) {
    if (!file) return;

    const base64 = await fileToBase64(file);

    updateScene(index, {
      sceneImageUrl: base64,
      sceneImageName: file.name,
      backgroundType: "sceneImage",
    });
  }

  async function handleSceneVideoUpload(index: number, file: File | null) {
    if (!file) return;

    try {
      setUploadingSceneVideoIndex(index);
      const data = await uploadMediaFile(file);

      updateScene(index, {
        sceneVideoUrl: data.url,
        sceneVideoName: file.name,
        backgroundType: "sceneVideo",
      });
    } catch (error) {
      console.error(error);
      alert("장면별 영상 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingSceneVideoIndex(null);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      alert("쇼츠 주제를 입력해주세요.");
      return;
    }

    try {
      setIsGenerating(true);
      setRenderedVideoUrl("");
      setCurrentTime(0);
      setIsPlaying(false);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          genre,
          topic,
          target,
          mood,
          imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error("쇼츠 생성에 실패했습니다.");
      }

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

      const normalizedThumbnail: ThumbnailSettings = {
        text:
          data.thumbnail?.text ??
          data.thumbnailText ??
          data.title ??
          defaultThumbnail.text,
        subText: data.thumbnail?.subText ?? defaultThumbnail.subText,
        sceneIndex: Math.min(
          Math.max(data.thumbnail?.sceneIndex ?? 0, 0),
          Math.max(normalizedScenes.length - 1, 0)
        ),
        textColor: data.thumbnail?.textColor ?? "yellow",
        position: data.thumbnail?.position ?? "middle",
        bgStyle: data.thumbnail?.bgStyle ?? "dark",
      };

      setResult({
        ...data,
        scenes: normalizedScenes,
        duration: getTotalDuration(normalizedScenes),
        thumbnail: normalizedThumbnail,
      });

      setScenes(normalizedScenes);
      setThumbnail(normalizedThumbnail);
    } catch (error) {
      console.error(error);
      alert("쇼츠 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateVisuals() {
    if (scenes.length === 0) {
      alert("먼저 쇼츠를 생성해주세요.");
      return;
    }

    try {
      setIsGeneratingVisuals(true);

      const response = await fetch("/api/generate-visuals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genre,
          scenes,
        }),
      });

      if (!response.ok) {
        throw new Error("장면별 이미지 생성에 실패했습니다.");
      }

      const data: { scenes: Scene[] } = await response.json();
      replaceScenes(data.scenes ?? scenes);
    } catch (error) {
      console.error(error);
      alert("장면별 비주얼 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingVisuals(false);
    }
  }

  async function handleGenerateSingleSceneVisual(index: number) {
    if (scenes.length === 0) {
      alert("먼저 쇼츠를 생성해주세요.");
      return;
    }

    try {
      setGeneratingSceneIndex(index);

      const response = await fetch("/api/generate-visuals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genre,
          scenes,
          sceneIndex: index,
        }),
      });

      if (!response.ok) {
        throw new Error("이 장면의 AI 배경 생성에 실패했습니다.");
      }

      const data: { scenes: Scene[]; sceneIndex?: number } =
        await response.json();
      replaceScenes(data.scenes ?? scenes);
    } catch (error) {
      console.error(error);
      alert("이 장면의 AI 배경 생성 중 오류가 발생했습니다.");
    } finally {
      setGeneratingSceneIndex(null);
    }
  }

  async function handleRenderVideo() {
    if (scenes.length === 0) {
      alert("먼저 쇼츠를 생성해주세요.");
      return;
    }

    try {
      setIsRendering(true);
      setRenderedVideoUrl("");

      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: result?.title ?? "쇼츠랩 AI 영상",
          duration: totalDuration,
          scenes,
          thumbnail,
          uploadedImageUrl: imagePreviewUrl,
          uploadedVideoUrl: videoPreviewUrl,
          bgmUrl,
          sfxUrl,
          bgmVolume,
          sfxVolume,
        }),
      });

      if (!response.ok) {
        throw new Error("MP4 렌더링에 실패했습니다.");
      }

      const data: { downloadUrl?: string; url?: string } = await response.json();
      const url = data.downloadUrl ?? data.url ?? "";

      if (!url) {
        throw new Error("다운로드 URL이 없습니다.");
      }

      setRenderedVideoUrl(url);
    } catch (error) {
      console.error(error);
      alert("MP4 렌더링 중 오류가 발생했습니다. 터미널 로그를 확인해주세요.");
    } finally {
      setIsRendering(false);
    }
  }

  async function handleDownloadThumbnail() {
    if (!thumbnailRef.current) {
      alert("다운로드할 썸네일이 없습니다.");
      return;
    }

    try {
      const dataUrl = await toPng(thumbnailRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#09090b",
      });

      const safeTitle = result?.title
        ? result.title.replace(/[\\/:*?"<>|]/g, "")
        : "shortslab-thumbnail";

      const link = document.createElement("a");
      link.download = `${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(error);
      alert("썸네일 PNG 다운로드 중 오류가 발생했습니다.");
    }
  }

  function handlePlayPause() {
    if (scenes.length === 0) return;

    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      lastSfxSceneIndexRef.current = null;

      if (bgmAudioRef.current) {
        bgmAudioRef.current.currentTime = 0;
      }
    }

    setIsPlaying((prev) => !prev);
  }

  function handleReplay() {
    setCurrentTime(0);
    setIsPlaying(true);
    lastSfxSceneIndexRef.current = null;

    if (bgmAudioRef.current) {
      bgmAudioRef.current.currentTime = 0;
      bgmAudioRef.current.play().catch(() => {});
    }
  }

  function addScene() {
    setScenes((prev) => {
      const last = prev[prev.length - 1];
      const start = last ? last.end : 0;

      const newScene: Scene = {
        start,
        end: round1(start + 3),
        caption: "새 장면 자막",
        subCaption: "보조 자막",
        visual: "새 장면 화면 설명",
        effect: "zoom",
        backgroundType: imagePreviewUrl ? "uploadedImage" : "solid",
        captionPosition: "bottom",
        captionSize: "medium",
        captionColor: "white",
        captionBg: "dark",
        sfxEnabled: false,
        sfxLabel: "",
        sfxTiming: "none",
      };

      const next = autoSortTimeline
        ? recalcScenesByDuration([...prev, newScene])
        : [...prev, newScene];

      setResult((old) =>
        old
          ? {
              ...old,
              scenes: next,
              duration: getTotalDuration(next),
            }
          : old
      );

      return next;
    });
  }

  function duplicateScene(index: number) {
    setScenes((prev) => {
      const targetScene = prev[index];
      if (!targetScene) return prev;

      const copiedScene: Scene = {
        ...targetScene,
        caption: `${targetScene.caption} 복사`,
      };

      const next = [
        ...prev.slice(0, index + 1),
        copiedScene,
        ...prev.slice(index + 1),
      ];

      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;

      setResult((old) =>
        old
          ? {
              ...old,
              scenes: finalScenes,
              duration: getTotalDuration(finalScenes),
            }
          : old
      );

      return finalScenes;
    });
  }

  function deleteScene(index: number) {
    setScenes((prev) => {
      const next = prev.filter((_, sceneIndex) => sceneIndex !== index);
      const finalScenes = autoSortTimeline ? recalcScenesByDuration(next) : next;

      setThumbnail((old) => ({
        ...old,
        sceneIndex: Math.min(old.sceneIndex, Math.max(finalScenes.length - 1, 0)),
      }));

      setResult((old) =>
        old
          ? {
              ...old,
              scenes: finalScenes,
              duration: getTotalDuration(finalScenes),
            }
          : old
      );

      return finalScenes;
    });
  }

  function renderSceneBackground(scene: Scene) {
    if (scene.backgroundType === "sceneVideo" && scene.sceneVideoUrl) {
      return (
        <video
          src={scene.sceneVideoUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }

    if (scene.backgroundType === "sceneImage" && scene.sceneImageUrl) {
      return (
        <img
          src={scene.sceneImageUrl}
          alt="장면별 업로드 이미지"
          className="h-full w-full object-cover"
        />
      );
    }

    if (scene.backgroundType === "uploadedVideo" && videoPreviewUrl) {
      return (
        <video
          src={videoPreviewUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }

    if (scene.backgroundType === "uploadedImage" && imagePreviewUrl) {
      return (
        <img
          src={imagePreviewUrl}
          alt="공통 업로드 이미지"
          className="h-full w-full object-cover"
        />
      );
    }

    if (scene.backgroundType === "generatedImage" && scene.imageUrl) {
      return (
        <img
          src={scene.imageUrl}
          alt="AI 생성 장면"
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <div className="h-full w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950" />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#3b0764,transparent_35%),radial-gradient(circle_at_top_right,#312e81,transparent_30%),#050505] text-white">
      <audio ref={bgmAudioRef} src={bgmUrl || undefined} loop />
      <audio ref={sfxAudioRef} src={sfxUrl || undefined} />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-600 text-sm font-black shadow-lg shadow-purple-950/50">
              SL
            </div>

            <div>
              <p className="text-sm font-black leading-none">ShortsLab AI</p>
              <p className="mt-1 text-[10px] font-bold text-zinc-500">
                AI Shorts Production Studio
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            {["Studio", "Templates", "Pricing", "Guide", "Contact"].map(
              (item) => (
                <button
                  key={item}
                  className="rounded-full px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  {item}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-200 md:block">
              {remainingCredits} Credits
            </div>

            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white transition hover:bg-white/10">
              로그인
            </button>

            <button className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-950 transition hover:bg-zinc-200">
              업그레이드
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/40 backdrop-blur md:p-6">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr_0.75fr]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StatusPill tone="purple">Creator Studio</StatusPill>
                <StatusPill tone="blue">MVP Preview</StatusPill>
                <StatusPill tone="zinc">9:16 Video</StatusPill>
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                AI로 쇼츠를 기획하고,
                <br />
                장면별로 편집하고, 영상으로 렌더링하세요.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                ShortsLab AI는 단순 대본 생성기가 아니라, 주제 입력부터 장면
                구성, 썸네일, 배경, 오디오, MP4 렌더링까지 이어지는 AI 쇼츠
                제작 스튜디오입니다.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "AI 쇼츠 생성 중..." : "새 쇼츠 생성하기"}
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                  템플릿 둘러보기
                </button>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500">계정</p>
                  <p className="mt-1 text-lg font-black">Guest Creator</p>
                </div>
                <StatusPill tone="zinc">Free Plan</StatusPill>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.045] p-4">
                  <p className="text-xs text-zinc-500">이번 달 생성</p>
                  <p className="mt-1 text-2xl font-black">{scenes.length}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.045] p-4">
                  <p className="text-xs text-zinc-500">렌더링</p>
                  <p className="mt-1 text-2xl font-black">
                    {renderedVideoUrl ? 1 : 0}
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-200">
                계정 설정
              </button>
            </div>

            <div className="rounded-[26px] border border-yellow-400/20 bg-yellow-400/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-yellow-200/70">
                    크레딧
                  </p>
                  <p className="mt-1 text-3xl font-black text-yellow-100">
                    {remainingCredits}
                  </p>
                </div>
                <StatusPill tone="yellow">100 / 월</StatusPill>
              </div>

              <div className="mt-5">
                <div className="h-3 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-yellow-300"
                    style={{ width: `${creditPercent}%` }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-yellow-100/80">
                  AI 쇼츠 생성, AI 배경 생성, MP4 렌더링에 크레딧이 사용되는
                  구조를 미리 보여주는 UI입니다.
                </p>
              </div>

              <button className="mt-4 w-full rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-yellow-200">
                크레딧 충전
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(360px,520px)_1fr]">
          <aside className="flex flex-col gap-5">
            <section className={panelClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>프로젝트 입력</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    쇼츠의 방향을 먼저 정합니다.
                  </p>
                </div>
                <StatusPill tone="zinc">Step 1</StatusPill>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="플랫폼">
                    <select
                      value={platform}
                      onChange={(event) =>
                        setPlatform(event.target.value as Platform)
                      }
                      className={selectClass}
                    >
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="장르">
                    <select
                      value={genre}
                      onChange={(event) => setGenre(event.target.value as Genre)}
                      className={selectClass}
                    >
                      {genreOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="쇼츠 주제">
                  <textarea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="예: 아무도 없는 폐교에서 들리는 발소리"
                    className={`${inputClass} min-h-28 resize-none`}
                  />
                </Field>

                <Field label="타깃 시청자">
                  <input
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="예: 10대 후반~20대 공포썰 좋아하는 사람"
                    className={inputClass}
                  />
                </Field>

                <Field label="분위기">
                  <input
                    value={mood}
                    onChange={(event) => setMood(event.target.value)}
                    placeholder="예: 긴장감, 반전, 빠른 전개"
                    className={inputClass}
                  />
                </Field>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "AI 쇼츠 생성 중..." : "AI 쇼츠 생성하기"}
                </button>
              </div>
            </section>

            <section className={panelClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>자료 업로드</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    공통 이미지와 영상을 등록합니다.
                  </p>
                </div>
                <StatusPill tone="zinc">Media</StatusPill>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="공통 이미지">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload(event.target.files?.[0] ?? null)
                    }
                    className={inputClass}
                  />
                </Field>

                {imagePreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={imagePreviewUrl}
                      alt="공통 이미지"
                      className="h-36 w-full object-cover"
                    />
                    <div className="px-3 py-2 text-xs text-zinc-400">
                      {imageFileName}
                    </div>
                  </div>
                )}

                <Field label="공통 영상">
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    onChange={(event) =>
                      handleVideoUpload(event.target.files?.[0] ?? null)
                    }
                    className={`${inputClass} disabled:opacity-50`}
                  />
                </Field>

                {isUploadingVideo && (
                  <p className="text-xs font-bold text-purple-300">
                    영상 업로드 중...
                  </p>
                )}

                {videoPreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="h-36 w-full object-cover"
                    />
                    <div className="px-3 py-2 text-xs text-zinc-400">
                      {videoFileName}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={panelClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>오디오</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    BGM과 효과음을 연결합니다.
                  </p>
                </div>
                <StatusPill tone="green">Sound</StatusPill>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="BGM 업로드">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={isUploadingBgm}
                    onChange={(event) =>
                      handleBgmUpload(event.target.files?.[0] ?? null)
                    }
                    className={`${inputClass} disabled:opacity-50`}
                  />
                </Field>

                {isUploadingBgm && (
                  <p className="text-xs font-bold text-purple-300">
                    BGM 업로드 중...
                  </p>
                )}

                {bgmFileName && (
                  <StatusPill tone="green">BGM: {bgmFileName}</StatusPill>
                )}

                <Field label={`BGM 볼륨 ${Math.round(bgmVolume * 100)}%`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(event) => setBgmVolume(Number(event.target.value))}
                    className="accent-purple-400"
                  />
                </Field>

                <Field label="효과음 업로드">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={isUploadingSfx}
                    onChange={(event) =>
                      handleSfxUpload(event.target.files?.[0] ?? null)
                    }
                    className={`${inputClass} disabled:opacity-50`}
                  />
                </Field>

                {isUploadingSfx && (
                  <p className="text-xs font-bold text-purple-300">
                    효과음 업로드 중...
                  </p>
                )}

                {sfxFileName && (
                  <StatusPill tone="green">SFX: {sfxFileName}</StatusPill>
                )}

                <Field label={`효과음 볼륨 ${Math.round(sfxVolume * 100)}%`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(event) => setSfxVolume(Number(event.target.value))}
                    className="accent-emerald-400"
                  />
                </Field>
              </div>
            </section>
          </aside>

          <section className="flex flex-col gap-5">
            <div className={panelClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>라이브 프리뷰</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    실제 쇼츠 화면에 가깝게 확인합니다.
                  </p>
                </div>
                <StatusPill tone="purple">9:16</StatusPill>
              </div>

              <div className="flex justify-center">
                <div className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[34px] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
                  <div
                    className={`absolute inset-0 ${getEffectClass(
                      currentScene.effect,
                      isPlaying
                    )}`}
                  >
                    {renderSceneBackground(currentScene)}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/50" />

                  <div className="absolute left-4 top-4 flex gap-2">
                    <StatusPill tone="zinc">
                      {round1(currentTime)}s / {totalDuration}s
                    </StatusPill>
                    <StatusPill tone="purple">
                      Scene {scenes.length > 0 ? currentSceneIndex + 1 : 0}
                    </StatusPill>
                  </div>

                  <div
                    className={`absolute left-5 right-5 text-center ${getCaptionPositionClass(
                      currentScene.captionPosition
                    )}`}
                  >
                    <div
                      className={`inline-block rounded-3xl px-5 py-4 font-black leading-tight tracking-tight drop-shadow-2xl ${getCaptionSizeClass(
                        currentScene.captionSize
                      )} ${getTextColorClass(currentScene.captionColor)} ${
                        currentScene.captionBg === "dark"
                          ? "bg-black/65"
                          : "bg-transparent"
                      }`}
                    >
                      {currentScene.caption}
                    </div>

                    {currentScene.subCaption && (
                      <p className="mx-auto mt-3 max-w-[92%] rounded-full bg-black/55 px-4 py-2 text-sm font-bold text-white">
                        {currentScene.subCaption}
                      </p>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/15">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400"
                      style={{
                        width:
                          totalDuration > 0
                            ? `${(currentTime / totalDuration) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handlePlayPause}
                  disabled={scenes.length === 0}
                  className="rounded-2xl bg-white px-4 py-4 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPlaying ? "일시정지" : "재생"}
                </button>

                <button
                  onClick={handleReplay}
                  disabled={scenes.length === 0}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다시보기
                </button>

                <button
                  onClick={handleGenerateVisuals}
                  disabled={
                    scenes.length === 0 ||
                    isGeneratingVisuals ||
                    generatingSceneIndex !== null
                  }
                  className="rounded-2xl bg-purple-500 px-4 py-4 text-sm font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGeneratingVisuals ? "전체 생성 중..." : "전체 AI 배경"}
                </button>

                <button
                  onClick={handleRenderVideo}
                  disabled={scenes.length === 0 || isRendering}
                  className="rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRendering ? "렌더링 중..." : "MP4 렌더링"}
                </button>
              </div>

              {renderedVideoUrl && (
                <a
                  href={renderedVideoUrl}
                  download
                  className="mt-3 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-center text-sm font-black text-emerald-200 transition hover:bg-emerald-400/15"
                >
                  완성된 MP4 다운로드
                </a>
              )}
            </div>

            {result && (
              <div className={panelClass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={sectionTitleClass}>AI 생성 결과</h2>
                  <StatusPill tone="zinc">Summary</StatusPill>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs text-zinc-500">제목</p>
                    <p className="mt-1 font-black">{result.title}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs text-zinc-500">추천 BGM</p>
                    <p className="mt-1 text-sm font-bold text-zinc-200">
                      {result.bgm}
                    </p>
                  </div>

                  <details className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <summary className="cursor-pointer text-sm font-black text-zinc-200">
                      전체 대본 보기
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                      {result.script}
                    </p>
                  </details>
                </div>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <section className={panelClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>썸네일 스튜디오</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    문구와 배경 장면을 바로 편집합니다.
                  </p>
                </div>
                <StatusPill tone="yellow">Thumbnail</StatusPill>
              </div>

              <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
                <div className="flex justify-center">
                  <div
                    ref={thumbnailRef}
                    className="relative aspect-[9/16] w-full max-w-[210px] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50"
                  >
                    <div
                      className={`absolute inset-0 ${
                        thumbnail.bgStyle === "blur" ? "scale-110 blur-sm" : ""
                      }`}
                    >
                      {renderSceneBackground(thumbnailScene)}
                    </div>

                    <div
                      className={`absolute inset-0 ${
                        thumbnail.bgStyle === "dark"
                          ? "bg-black/55"
                          : thumbnail.bgStyle === "blur"
                          ? "bg-black/25"
                          : "bg-black/10"
                      }`}
                    />

                    <div
                      className={`absolute left-4 right-4 text-center ${getThumbnailPositionClass(
                        thumbnail.position
                      )}`}
                    >
                      <div
                        className={`inline-block rounded-3xl px-4 py-3 text-2xl font-black leading-tight tracking-tight drop-shadow-2xl ${getTextColorClass(
                          thumbnail.textColor
                        )} ${
                          thumbnail.bgStyle === "dark"
                            ? "bg-black/65"
                            : "bg-transparent"
                        }`}
                      >
                        {thumbnail.text}
                      </div>

                      {thumbnail.subText && (
                        <p className="mx-auto mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-950">
                          {thumbnail.subText}
                        </p>
                      )}
                    </div>

                    <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[10px] font-black text-white">
                      썸네일
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Field label="메인 문구">
                    <input
                      value={thumbnail.text}
                      onChange={(event) =>
                        setThumbnail((prev) => ({
                          ...prev,
                          text: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="서브 문구">
                    <input
                      value={thumbnail.subText}
                      onChange={(event) =>
                        setThumbnail((prev) => ({
                          ...prev,
                          subText: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="배경 장면">
                      <select
                        value={thumbnail.sceneIndex}
                        onChange={(event) =>
                          setThumbnail((prev) => ({
                            ...prev,
                            sceneIndex: Number(event.target.value),
                          }))
                        }
                        className={selectClass}
                      >
                        {scenes.length === 0 ? (
                          <option value={0}>장면 없음</option>
                        ) : (
                          scenes.map((scene, index) => (
                            <option
                              key={`${scene.start}-${scene.end}-${index}`}
                              value={index}
                            >
                              {index + 1}번 장면
                            </option>
                          ))
                        )}
                      </select>
                    </Field>

                    <Field label="색상">
                      <select
                        value={thumbnail.textColor}
                        onChange={(event) =>
                          setThumbnail((prev) => ({
                            ...prev,
                            textColor: event.target.value as CaptionColor,
                          }))
                        }
                        className={selectClass}
                      >
                        {captionColorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="위치">
                      <select
                        value={thumbnail.position}
                        onChange={(event) =>
                          setThumbnail((prev) => ({
                            ...prev,
                            position: event.target.value as ThumbnailPosition,
                          }))
                        }
                        className={selectClass}
                      >
                        {thumbnailPositionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="배경 스타일">
                      <select
                        value={thumbnail.bgStyle}
                        onChange={(event) =>
                          setThumbnail((prev) => ({
                            ...prev,
                            bgStyle: event.target.value as ThumbnailBgStyle,
                          }))
                        }
                        className={selectClass}
                      >
                        {thumbnailBgStyleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <button
                    onClick={handleDownloadThumbnail}
                    disabled={scenes.length === 0}
                    className="rounded-2xl bg-yellow-300 px-4 py-4 text-sm font-black text-zinc-950 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    썸네일 PNG 다운로드
                  </button>
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitleClass}>빠른 상태</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    현재 프로젝트 구성을 한눈에 확인합니다.
                  </p>
                </div>
                <StatusPill tone="zinc">Status</StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">공통 이미지</p>
                  <p className="mt-1 text-sm font-black">
                    {imagePreviewUrl ? "연결됨" : "없음"}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">공통 영상</p>
                  <p className="mt-1 text-sm font-black">
                    {videoPreviewUrl ? "연결됨" : "없음"}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">BGM</p>
                  <p className="mt-1 text-sm font-black">
                    {bgmUrl ? "연결됨" : "없음"}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <p className="text-xs text-zinc-500">효과음</p>
                  <p className="mt-1 text-sm font-black">
                    {sfxUrl ? "연결됨" : "없음"}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className={panelClass}>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black">장면 타임라인</h2>
                <StatusPill tone="zinc">{scenes.length} Scenes</StatusPill>
                <StatusPill tone={autoSortTimeline ? "purple" : "zinc"}>
                  자동 정렬 {autoSortTimeline ? "ON" : "OFF"}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                장면별 자막, 배경, 효과음, 길이를 편집합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAutoSortTimeline((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  autoSortTimeline
                    ? "bg-purple-500 text-white hover:bg-purple-400"
                    : "bg-white/10 text-zinc-200 hover:bg-white/15"
                }`}
              >
                자동 정렬 {autoSortTimeline ? "ON" : "OFF"}
              </button>

              <button
                onClick={addScene}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-200"
              >
                장면 추가
              </button>
            </div>
          </div>

          {scenes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <p className="text-sm font-bold text-zinc-400">
                아직 생성된 장면이 없습니다.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                왼쪽 입력 패널에서 쇼츠 주제를 입력하고 AI 쇼츠를 생성해주세요.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {scenes.map((scene, index) => (
              <div
                key={`${scene.start}-${scene.end}-${index}`}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/60"
              >
                <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500 text-sm font-black">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black">Scene {index + 1}</p>
                      <p className="text-xs text-zinc-500">
                        {scene.start}s ~ {scene.end}s ·{" "}
                        {getSceneDuration(scene)}초 ·{" "}
                        {getBackgroundTypeLabel(scene.backgroundType)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGenerateSingleSceneVisual(index)}
                      disabled={
                        isGeneratingVisuals || generatingSceneIndex !== null
                      }
                      className="rounded-xl bg-purple-500 px-3 py-2 text-xs font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {generatingSceneIndex === index
                        ? "AI 배경 생성 중..."
                        : "이 장면 AI 배경 생성"}
                    </button>

                    <button
                      onClick={() => duplicateScene(index)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                    >
                      복제
                    </button>

                    <button
                      onClick={() => deleteScene(index)}
                      className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/25"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
                  <div className="flex flex-col gap-3">
                    <Field label="메인 자막">
                      <input
                        value={scene.caption}
                        onChange={(event) =>
                          updateScene(index, { caption: event.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="보조 자막">
                      <input
                        value={scene.subCaption}
                        onChange={(event) =>
                          updateScene(index, {
                            subCaption: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="화면 설명">
                      <textarea
                        value={scene.visual}
                        onChange={(event) =>
                          updateScene(index, { visual: event.target.value })
                        }
                        className={`${inputClass} min-h-24 resize-none`}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="장면 길이">
                        <input
                          type="number"
                          min="0.5"
                          step="0.1"
                          value={getSceneDuration(scene)}
                          onChange={(event) =>
                            updateSceneDuration(index, Number(event.target.value))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="연출 효과">
                        <select
                          value={scene.effect}
                          onChange={(event) =>
                            updateScene(index, {
                              effect: event.target.value as SceneEffect,
                            })
                          }
                          className={selectClass}
                        >
                          {effectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {!autoSortTimeline && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="시작 시간">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={scene.start}
                            onChange={(event) =>
                              updateScene(index, {
                                start: Number(event.target.value),
                              })
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="종료 시간">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={scene.end}
                            onChange={(event) =>
                              updateScene(index, {
                                end: Number(event.target.value),
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 rounded-3xl border border-purple-400/15 bg-purple-400/[0.06] p-4">
                    <div>
                      <p className="text-sm font-black text-purple-100">
                        배경 설정
                      </p>
                      <p className="mt-1 text-xs text-purple-200/60">
                        이미지와 영상 배경을 장면별로 지정합니다.
                      </p>
                    </div>

                    <Field label="배경 타입">
                      <select
                        value={scene.backgroundType}
                        onChange={(event) =>
                          updateScene(index, {
                            backgroundType: event.target.value as BackgroundType,
                          })
                        }
                        className={selectClass}
                      >
                        <option value="solid">기본 배경</option>
                        <option value="uploadedImage">공통 이미지</option>
                        <option value="uploadedVideo">공통 영상</option>
                        <option value="generatedImage">AI 생성 이미지</option>
                        <option value="sceneImage">장면별 이미지</option>
                        <option value="sceneVideo">장면별 영상</option>
                      </select>
                    </Field>

                    <Field label="이 장면 이미지">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleSceneImageUpload(
                            index,
                            event.target.files?.[0] ?? null
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    {scene.sceneImageName && (
                      <StatusPill tone="purple">
                        이미지: {scene.sceneImageName}
                      </StatusPill>
                    )}

                    <Field label="이 장면 영상">
                      <input
                        type="file"
                        accept="video/*"
                        disabled={uploadingSceneVideoIndex === index}
                        onChange={(event) =>
                          handleSceneVideoUpload(
                            index,
                            event.target.files?.[0] ?? null
                          )
                        }
                        className={`${inputClass} disabled:opacity-50`}
                      />
                    </Field>

                    {uploadingSceneVideoIndex === index && (
                      <p className="text-xs font-bold text-purple-300">
                        장면 영상 업로드 중...
                      </p>
                    )}

                    {scene.sceneVideoName && (
                      <StatusPill tone="purple">
                        영상: {scene.sceneVideoName}
                      </StatusPill>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-black">자막 스타일</p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="위치">
                          <select
                            value={scene.captionPosition}
                            onChange={(event) =>
                              updateScene(index, {
                                captionPosition: event.target
                                  .value as CaptionPosition,
                              })
                            }
                            className={selectClass}
                          >
                            {captionPositionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="크기">
                          <select
                            value={scene.captionSize}
                            onChange={(event) =>
                              updateScene(index, {
                                captionSize: event.target.value as CaptionSize,
                              })
                            }
                            className={selectClass}
                          >
                            {captionSizeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="색상">
                          <select
                            value={scene.captionColor}
                            onChange={(event) =>
                              updateScene(index, {
                                captionColor: event.target.value as CaptionColor,
                              })
                            }
                            className={selectClass}
                          >
                            {captionColorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="배경">
                          <select
                            value={scene.captionBg}
                            onChange={(event) =>
                              updateScene(index, {
                                captionBg: event.target.value as CaptionBg,
                              })
                            }
                            className={selectClass}
                          >
                            {captionBgOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-emerald-100">
                            효과음
                          </p>
                          <p className="mt-1 text-xs text-emerald-200/60">
                            중요한 장면에만 사용합니다.
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            updateScene(index, {
                              sfxEnabled: !scene.sfxEnabled,
                            })
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            scene.sfxEnabled
                              ? "bg-emerald-500 text-white"
                              : "bg-white/10 text-zinc-300"
                          }`}
                        >
                          {scene.sfxEnabled ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <Field label="효과음 이름">
                          <input
                            value={scene.sfxLabel ?? ""}
                            onChange={(event) =>
                              updateScene(index, {
                                sfxLabel: event.target.value,
                              })
                            }
                            placeholder="예: 문 쾅, 심장박동, 전환음"
                            className={inputClass}
                          />
                        </Field>

                        <Field label="타이밍">
                          <select
                            value={scene.sfxTiming ?? "none"}
                            onChange={(event) =>
                              updateScene(index, {
                                sfxTiming: event.target.value as SfxTiming,
                              })
                            }
                            className={selectClass}
                          >
                            {sfxTimingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
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