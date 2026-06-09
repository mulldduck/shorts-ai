import type React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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

export type Scene = {
  start: number;
  end: number;
  caption: string;
  subCaption: string;
  visual: string;
  videoClipStart?: number;
  videoClipEnd?: number;
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

export type ThumbnailSettings = {
  text: string;
  subText: string;
  sceneIndex: number;
  textColor: CaptionColor;
  position: "top" | "middle" | "bottom";
  bgStyle: "dark" | "blur" | "none";
};

export type ShortsCompositionProps = {
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

const fallbackScene: Scene = {
  start: 0,
  end: 3,
  caption: "AI 쇼츠랩",
  subCaption: "쇼츠 영상을 생성해보세요",
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

function resolveAsset(src?: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/")) return staticFile(src.replace(/^\//, ""));
  return src;
}

function getTextColor(color: CaptionColor) {
  if (color === "yellow") return "#fde047";
  if (color === "red") return "#f87171";
  if (color === "purple") return "#d8b4fe";
  return "#ffffff";
}

function getCaptionFontSize(size: CaptionSize) {
  if (size === "small") return 46;
  if (size === "large") return 72;
  return 58;
}

function getCaptionPositionStyle(position: CaptionPosition): React.CSSProperties {
  if (position === "top") return { top: 110 };
  if (position === "upper") return { top: 300 };
  if (position === "middle") return { top: "50%", transform: "translateY(-50%)" };
  if (position === "lower") return { bottom: 300 };
  return { bottom: 120 };
}

function getSceneFrameInfo(frame: number, fps: number, scene: Scene) {
  const sceneStartFrame = Math.round(scene.start * fps);
  const sceneEndFrame = Math.round(scene.end * fps);
  const totalSceneFrames = Math.max(1, sceneEndFrame - sceneStartFrame);
  const frameInScene = frame - sceneStartFrame;

  return {
    sceneStartFrame,
    sceneEndFrame,
    totalSceneFrames,
    frameInScene,
    progress: Math.min(Math.max(frameInScene / totalSceneFrames, 0), 1),
  };
}

function getEffectStyle(effect: SceneEffect, frame: number, fps: number, scene: Scene): React.CSSProperties {
  const { progress, frameInScene } = getSceneFrameInfo(frame, fps, scene);

  if (effect === "zoom") {
    const scale = interpolate(progress, [0, 1], [1, 1.14]);
    return { transform: `scale(${scale})` };
  }

  if (effect === "shake") {
    const power = interpolate(progress, [0, 0.25, 1], [10, 5, 0]);
    const x = Math.sin(frameInScene * 1.8) * power;
    const y = Math.cos(frameInScene * 1.5) * power;
    return { transform: `translate(${x}px, ${y}px) scale(1.06)` };
  }

  if (effect === "fade") {
    const opacity = interpolate(progress, [0, 0.18, 1], [0.3, 1, 1]);
    return { opacity, transform: "scale(1.04)" };
  }

  if (effect === "slide") {
    const x = interpolate(progress, [0, 0.2, 1], [80, 0, 0]);
    return { transform: `translateX(${x}px) scale(1.05)` };
  }

  return { transform: "scale(1.03)" };
}

function SolidBackground() {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #09090b 0%, #18181b 36%, #4c1d95 72%, #111827 100%)",
      }}
    />
  );
}

function BackgroundImage({ src, effectStyle }: { src: string; effectStyle: React.CSSProperties }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#09090b" }}>
      <Img
        src={resolveAsset(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...effectStyle }}
      />
    </AbsoluteFill>
  );
}

function BackgroundVideo({
  src,
  effectStyle,
  scene,
  fps,
}: {
  src: string;
  effectStyle: React.CSSProperties;
  scene: Scene;
  fps: number;
}) {
  const sceneStartFrame = Math.round(scene.start * fps);

  const durationFrames = Math.max(
    1,
    Math.round((scene.end - scene.start) * fps)
  );

  const clipStartFrame = Math.max(
    0,
    Math.round((scene.videoClipStart ?? 0) * fps)
  );

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#09090b",
      }}
    >
      <Sequence
        from={sceneStartFrame}
        durationInFrames={durationFrames}
      >
        <OffthreadVideo
          src={resolveAsset(src)}
          muted
          startFrom={clipStartFrame}
          endAt={clipStartFrame + durationFrames}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...effectStyle,
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
}

function SceneBackground({
  scene,
  uploadedImageUrl,
  uploadedVideoUrl,
  frame,
  fps,
}: {
  scene: Scene;
  uploadedImageUrl?: string;
  uploadedVideoUrl?: string;
  frame: number;
  fps: number;
}) {
  const effectStyle = getEffectStyle(scene.effect, frame, fps, scene);

  if (scene.backgroundType === "sceneVideo" && scene.sceneVideoUrl) {
    return <BackgroundVideo src={scene.sceneVideoUrl} effectStyle={effectStyle} scene={scene} fps={fps} />;
  }

  if (scene.backgroundType === "uploadedVideo" && uploadedVideoUrl) {
    return <BackgroundVideo src={uploadedVideoUrl} effectStyle={effectStyle} scene={scene} fps={fps} />;
  }

  if (scene.backgroundType === "generatedImage" && scene.imageUrl) {
    return <BackgroundImage src={scene.imageUrl} effectStyle={effectStyle} />;
  }

  if (scene.backgroundType === "sceneImage" && scene.sceneImageUrl) {
    return <BackgroundImage src={scene.sceneImageUrl} effectStyle={effectStyle} />;
  }

  if (scene.backgroundType === "uploadedImage" && uploadedImageUrl) {
    return <BackgroundImage src={uploadedImageUrl} effectStyle={effectStyle} />;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", ...effectStyle }}>
        <SolidBackground />
      </div>
    </AbsoluteFill>
  );
}

function isHighlightWord(word: string) {
  const cleanWord = word.replace(/[^\w가-힣]/g, "");

  const highlightWords = [
    "소름",
    "진짜",
    "반전",
    "충격",
    "절대",
    "비밀",
    "위험",
    "공포",
    "실화",
    "대박",
    "주의",
    "마지막",
    "이유",
    "정체",
    "사실",
    "알고보니",
  ];

  return highlightWords.some((keyword) => cleanWord.includes(keyword));
}

function CaptionLayer({
  scene,
  frame,
  fps,
}: {
  scene: Scene;
  frame: number;
  fps: number;
}) {
  const { frameInScene, totalSceneFrames } = getSceneFrameInfo(
    frame,
    fps,
    scene
  );

  const words = scene.caption.split(" ").filter(Boolean);
  const chunkSize = words.length > 8 ? 3 : 2;

  const chunks: string[][] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  const chunkDuration = totalSceneFrames / Math.max(chunks.length, 1);

  const activeChunkIndex = Math.min(
    chunks.length - 1,
    Math.floor(frameInScene / chunkDuration)
  );

  const activeWords = chunks[activeChunkIndex] ?? words;
  const chunkStartFrame = activeChunkIndex * chunkDuration;
  const localFrame = frameInScene - chunkStartFrame;

  const pop = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 10,
      stiffness: 220,
      mass: 0.6,
    },
  });

  const scale = interpolate(pop, [0, 0.7, 1], [0.6, 1.18, 1]);

  const opacity = interpolate(localFrame, [0, 3, 7], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const impactShake =
    scene.effect === "shake" || scene.sfxEnabled
      ? Math.sin(localFrame * 1.8) *
        interpolate(localFrame, [0, 10, 20], [12, 4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

      
  const fontSize = getCaptionFontSize(scene.captionSize);
  const positionStyle = getCaptionPositionStyle(scene.captionPosition);
  const textColor = getTextColor(scene.captionColor);

  const middleTransformPrefix =
    scene.captionPosition === "middle" ? "translateY(-50%) " : "";

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          textAlign: "center",
          ...positionStyle,
          opacity,
          transform: `${middleTransformPrefix}translateX(${impactShake}px) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            maxWidth: "100%",
            padding: scene.captionBg === "dark" ? "26px 38px" : "0px",
            borderRadius: 36,
            background:
              scene.captionBg === "dark"
                ? "rgba(0,0,0,0.72)"
                : "transparent",
            fontSize,
            fontWeight: 950,
            lineHeight: 1.12,
            letterSpacing: -2.4,
            textShadow: "0 8px 20px rgba(0,0,0,0.95)",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
            fontFamily:
              "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
          }}
        >
          {activeWords.map((word, index) => {
            const highlighted = isHighlightWord(word);

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  display: "inline-block",
                  margin: "0 6px",
                  color: highlighted ? "#fde047" : textColor,
                  fontSize: highlighted ? fontSize * 1.15 : fontSize,
                  transform: highlighted ? "rotate(-2deg) scale(1.08)" : "none",
                  textShadow: highlighted
                    ? "0 0 18px rgba(250,204,21,0.65), 0 8px 20px rgba(0,0,0,0.95)"
                    : "0 8px 20px rgba(0,0,0,0.95)",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {scene.subCaption ? (
          <div
            style={{
              display: "inline-block",
              marginTop: 22,
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              color: "#09090b",
              fontSize: 27,
              fontWeight: 900,
              lineHeight: 1.2,
              opacity: interpolate(pop, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(pop, [0, 1], [18, 0])}px)`,
              fontFamily:
                "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
            }}
          >
            {scene.subCaption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function AudioLayers({
  scenes,
  bgmUrl,
  narrationUrl,
  sfxUrl,
  bgmVolume = 0.25,
  narrationVolume = 1,
  sfxVolume = 0.7,
  fps,
}: {
  scenes: Scene[];
  bgmUrl?: string;
  narrationUrl?: string;
  sfxUrl?: string;
  bgmVolume?: number;
  narrationVolume?: number;
  sfxVolume?: number;
  fps: number;
}) {
  return (
    <>
      {bgmUrl ? <Audio src={resolveAsset(bgmUrl)} volume={bgmVolume} loop /> : null}

      {narrationUrl ? (
        <Audio src={resolveAsset(narrationUrl)} volume={narrationVolume} />
      ) : null}

      {sfxUrl
        ? scenes.map((scene, index) => {
            if (!scene.sfxEnabled) return null;
            if (!scene.sfxTiming || scene.sfxTiming === "none") return null;

            const from =
              scene.sfxTiming === "impact"
                ? Math.round((scene.start + (scene.end - scene.start) * 0.45) * fps)
                : Math.round(scene.start * fps);

            return (
              <Sequence key={`sfx-${index}-${from}`} from={from} durationInFrames={90}>
                <Audio src={resolveAsset(sfxUrl)} volume={sfxVolume} />
              </Sequence>
            );
          })
        : null}
    </>
  );
}

export function ShortsComposition({
  title = "쇼츠랩 AI 영상",
  scenes = [fallbackScene],
  uploadedImageUrl,
  uploadedVideoUrl,
  bgmUrl,
  narrationUrl,
  sfxUrl,
  bgmVolume = 0.25,
  narrationVolume = 1,
  sfxVolume = 0.7,
}: ShortsCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const safeScenes = scenes.length > 0 ? scenes : [fallbackScene];

  const currentSceneIndex = safeScenes.findIndex((scene) => {
    const startFrame = Math.round(scene.start * fps);
    const endFrame = Math.round(scene.end * fps);
    return frame >= startFrame && frame < endFrame;
  });

  const resolvedSceneIndex = currentSceneIndex === -1 ? safeScenes.length - 1 : currentSceneIndex;
  const currentScene = safeScenes[resolvedSceneIndex] ?? fallbackScene;

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      <SceneBackground
        scene={currentScene}
        uploadedImageUrl={uploadedImageUrl}
        uploadedVideoUrl={uploadedVideoUrl}
        frame={frame}
        fps={fps}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.42) 100%)",
        }}
      />

      <CaptionLayer scene={currentScene} frame={frame} fps={fps} />

      <div
        style={{
          position: "absolute",
          top: 42,
          left: 42,
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.48)",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 800,
          fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
        }}
      >
        Scene {resolvedSceneIndex + 1}/{safeScenes.length}
      </div>

      <div
        style={{
          position: "absolute",
          top: 42,
          right: 42,
          maxWidth: 430,
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.38)",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 800,
          textAlign: "right",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          background: "rgba(255,255,255,0.22)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(Math.max(frame / durationInFrames, 0), 1) * 100}%`,
            background: "#a855f7",
          }}
        />
      </div>

      <AudioLayers
        scenes={safeScenes}
        bgmUrl={bgmUrl}
        narrationUrl={narrationUrl}
        sfxUrl={sfxUrl}
        bgmVolume={bgmVolume}
        narrationVolume={narrationVolume}
        sfxVolume={sfxVolume}
        fps={fps}
      />
    </AbsoluteFill>
  );
}