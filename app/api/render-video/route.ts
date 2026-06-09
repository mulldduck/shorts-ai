import path from "path";
import { NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

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
  position: "top" | "middle" | "bottom";
  bgStyle: "dark" | "blur" | "none";
};

type RenderRequestBody = {
  title?: string;
  duration?: number;
  scenes?: Scene[];
  thumbnail?: ThumbnailSettings;
  uploadedImageUrl?: string;
  uploadedVideoUrl?: string;
  bgmUrl?: string;
  narrationUrl?: string;
  sfxUrl?: string;
  bgmVolume?: number;
  narrationVolume?: number;
  sfxVolume?: number;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function getTotalDuration(scenes: Scene[]) {
  if (!Array.isArray(scenes) || scenes.length === 0) return 8;

  const maxEnd = Math.max(...scenes.map((scene) => Number(scene.end || 0)));

  if (!Number.isFinite(maxEnd) || maxEnd <= 0) return 8;

  return maxEnd;
}

function normalizeScene(scene: Partial<Scene>, index: number): Scene {
  const start =
    typeof scene.start === "number" && Number.isFinite(scene.start)
      ? scene.start
      : index * 3;

  const end =
    typeof scene.end === "number" &&
    Number.isFinite(scene.end) &&
    scene.end > start
      ? scene.end
      : start + 3;

  const allowedEffects: SceneEffect[] = [
    "zoom",
    "shake",
    "fade",
    "slide",
    "none",
  ];

  const allowedBackgroundTypes: BackgroundType[] = [
    "solid",
    "uploadedImage",
    "uploadedVideo",
    "generatedImage",
    "sceneImage",
    "sceneVideo",
  ];

  const allowedCaptionPositions: CaptionPosition[] = [
    "top",
    "upper",
    "middle",
    "lower",
    "bottom",
  ];

  const allowedCaptionSizes: CaptionSize[] = ["small", "medium", "large"];
  const allowedCaptionColors: CaptionColor[] = [
    "white",
    "yellow",
    "red",
    "purple",
  ];
  const allowedCaptionBgs: CaptionBg[] = ["none", "dark"];
  const allowedSfxTimings: SfxTiming[] = ["sceneStart", "impact", "none"];

  return {
    start,
    end,
    caption: String(scene.caption ?? `Scene ${index + 1}`),
    subCaption: String(scene.subCaption ?? ""),
    visual: String(scene.visual ?? ""),
    effect: allowedEffects.includes(scene.effect as SceneEffect)
      ? (scene.effect as SceneEffect)
      : "zoom",
    backgroundType: allowedBackgroundTypes.includes(
      scene.backgroundType as BackgroundType
    )
      ? (scene.backgroundType as BackgroundType)
      : "solid",
    captionPosition: allowedCaptionPositions.includes(
      scene.captionPosition as CaptionPosition
    )
      ? (scene.captionPosition as CaptionPosition)
      : "bottom",
    captionSize: allowedCaptionSizes.includes(scene.captionSize as CaptionSize)
      ? (scene.captionSize as CaptionSize)
      : "medium",
    captionColor: allowedCaptionColors.includes(
      scene.captionColor as CaptionColor
    )
      ? (scene.captionColor as CaptionColor)
      : "white",
    captionBg: allowedCaptionBgs.includes(scene.captionBg as CaptionBg)
      ? (scene.captionBg as CaptionBg)
      : "dark",
    imageUrl: scene.imageUrl,
    sceneImageUrl: scene.sceneImageUrl,
    sceneImageName: scene.sceneImageName,
    sceneVideoUrl: scene.sceneVideoUrl,
    sceneVideoName: scene.sceneVideoName,
    sfxEnabled: Boolean(scene.sfxEnabled),
    sfxLabel: String(scene.sfxLabel ?? ""),
    sfxTiming: allowedSfxTimings.includes(scene.sfxTiming as SfxTiming)
      ? (scene.sfxTiming as SfxTiming)
      : "none",
  };
}

function normalizeVolume(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, 0), 1);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RenderRequestBody;

    const rawScenes = Array.isArray(body.scenes) ? body.scenes : [];
    const scenes = rawScenes.map(normalizeScene);

    if (scenes.length === 0) {
      return NextResponse.json(
        { error: "렌더링할 장면이 없습니다." },
        { status: 400 }
      );
    }

    const title = body.title?.trim() || "쇼츠랩 AI 영상";
    const duration =
      typeof body.duration === "number" && body.duration > 0
        ? body.duration
        : getTotalDuration(scenes);

    const inputProps = {
      title,
      duration,
      scenes,
      thumbnail: body.thumbnail,
      uploadedImageUrl: body.uploadedImageUrl ?? "",
      uploadedVideoUrl: body.uploadedVideoUrl ?? "",
      bgmUrl: body.bgmUrl ?? "",
      narrationUrl: body.narrationUrl ?? "",
      sfxUrl: body.sfxUrl ?? "",
      bgmVolume: normalizeVolume(body.bgmVolume, 0.25),
      narrationVolume: normalizeVolume(body.narrationVolume, 1),
      sfxVolume: normalizeVolume(body.sfxVolume, 0.7),
    };

    const entryPoint = path.join(process.cwd(), "remotion", "index.tsx");

    const serveUrl = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    const compositions = await getCompositions(serveUrl, {
      inputProps,
    });

    const composition = compositions.find(
      (item) => item.id === "ShortsLabVideo"
    );

    if (!composition) {
      return NextResponse.json(
        { error: "ShortsLabVideo 컴포지션을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const safeTitle = sanitizeFileName(title) || "shortslab-video";
    const fileName = `${safeTitle}-${Date.now()}.mp4`;
    const outputPath = path.join(process.cwd(), "public", "renders", fileName);

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      imageFormat: "jpeg",
      pixelFormat: "yuv420p",
      chromiumOptions: {
        ignoreCertificateErrors: true,
      },
    });

    return NextResponse.json({
      success: true,
      url: `/renders/${fileName}`,
      downloadUrl: `/renders/${fileName}`,
    });
  } catch (error) {
    console.error("render-video route error:", error);

    return NextResponse.json(
      { error: "MP4 렌더링 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}