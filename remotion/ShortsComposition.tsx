import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
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
  sfxUrl?: string;
  bgmVolume?: number;
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

function getTextColor(color: CaptionColor) {
  switch (color) {
    case "white":
      return "#ffffff";
    case "yellow":
      return "#fde047";
    case "red":
      return "#f87171";
    case "purple":
      return "#d8b4fe";
    default:
      return "#ffffff";
  }
}

function getCaptionFontSize(size: CaptionSize) {
  switch (size) {
    case "small":
      return 46;
    case "medium":
      return 58;
    case "large":
      return 72;
    default:
      return 58;
  }
}

function getCaptionPositionStyle(position: CaptionPosition): React.CSSProperties {
  switch (position) {
    case "top":
      return {
        top: 110,
      };
    case "upper":
      return {
        top: 300,
      };
    case "middle":
      return {
        top: "50%",
        transform: "translateY(-50%)",
      };
    case "lower":
      return {
        bottom: 300,
      };
    case "bottom":
      return {
        bottom: 120,
      };
    default:
      return {
        bottom: 120,
      };
  }
}

function getSceneProgress(frame: number, fps: number, scene: Scene) {
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

function getEffectStyle(
  effect: SceneEffect,
  frame: number,
  fps: number,
  scene: Scene
): React.CSSProperties {
  const { progress, frameInScene } = getSceneProgress(frame, fps, scene);

  if (effect === "zoom") {
    const scale = interpolate(progress, [0, 1], [1, 1.14]);
    return {
      transform: `scale(${scale})`,
    };
  }

  if (effect === "shake") {
    const power = interpolate(progress, [0, 0.25, 1], [10, 5, 0]);
    const x = Math.sin(frameInScene * 1.8) * power;
    const y = Math.cos(frameInScene * 1.5) * power;

    return {
      transform: `translate(${x}px, ${y}px) scale(1.06)`,
    };
  }

  if (effect === "fade") {
    const opacity = interpolate(progress, [0, 0.18, 1], [0.3, 1, 1]);
    return {
      opacity,
      transform: "scale(1.04)",
    };
  }

  if (effect === "slide") {
    const x = interpolate(progress, [0, 0.2, 1], [80, 0, 0]);
    return {
      transform: `translateX(${x}px) scale(1.05)`,
    };
  }

  return {
    transform: "scale(1.03)",
  };
}

function SolidBackground() {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #09090b 0%, #18181b 36%, #4c1d95 72%, #111827 100%)",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(255,255,255,0.18), transparent 42%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 20% 78%, rgba(168,85,247,0.28), transparent 34%)",
        }}
      />
    </AbsoluteFill>
  );
}

function BackgroundImage({
  src,
  effectStyle,
}: {
  src: string;
  effectStyle: React.CSSProperties;
}) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#09090b" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...effectStyle,
        }}
      />
    </AbsoluteFill>
  );
}

function SceneBackground({
  scene,
  uploadedImageUrl,
  frame,
  fps,
}: {
  scene: Scene;
  uploadedImageUrl?: string;
  frame: number;
  fps: number;
}) {
  const effectStyle = getEffectStyle(scene.effect, frame, fps, scene);

  if (scene.backgroundType === "generatedImage" && scene.imageUrl) {
    return <BackgroundImage src={scene.imageUrl} effectStyle={effectStyle} />;
  }

  if (scene.backgroundType === "sceneImage" && scene.sceneImageUrl) {
    return (
      <BackgroundImage src={scene.sceneImageUrl} effectStyle={effectStyle} />
    );
  }

  if (scene.backgroundType === "uploadedImage" && uploadedImageUrl) {
    return <BackgroundImage src={uploadedImageUrl} effectStyle={effectStyle} />;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          ...effectStyle,
        }}
      >
        <SolidBackground />
      </div>
    </AbsoluteFill>
  );
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
  const { frameInScene } = getSceneProgress(frame, fps, scene);

  const entrance = spring({
    frame: frameInScene,
    fps,
    config: {
      damping: 16,
      stiffness: 160,
      mass: 0.8,
    },
  });

  const scale = interpolate(entrance, [0, 1], [0.88, 1]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  const fontSize = getCaptionFontSize(scene.captionSize);
  const positionStyle = getCaptionPositionStyle(scene.captionPosition);
  const textColor = getTextColor(scene.captionColor);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          textAlign: "center",
          ...positionStyle,
          opacity,
          transform:
            scene.captionPosition === "middle"
              ? `translateY(-50%) scale(${scale})`
              : `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            maxWidth: "100%",
            padding: scene.captionBg === "dark" ? "24px 34px" : "0px",
            borderRadius: 34,
            background:
              scene.captionBg === "dark" ? "rgba(0,0,0,0.64)" : "transparent",
            color: textColor,
            fontSize,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: -2,
            textShadow:
              "0 5px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
            fontFamily:
              "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
          }}
        >
          {scene.caption}
        </div>

        {scene.subCaption ? (
          <div
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "11px 22px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.58)",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.2,
              textShadow: "0 3px 12px rgba(0,0,0,0.8)",
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

function SceneIndicator({
  sceneIndex,
  totalScenes,
}: {
  sceneIndex: number;
  totalScenes: number;
}) {
  return (
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
        fontFamily:
          "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
      }}
    >
      Scene {sceneIndex + 1}/{totalScenes}
    </div>
  );
}

function ProgressBar({
  frame,
  totalFrames,
}: {
  frame: number;
  totalFrames: number;
}) {
  const width = `${Math.min(Math.max(frame / totalFrames, 0), 1) * 100}%`;

  return (
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
          width,
          background: "#a855f7",
        }}
      />
    </div>
  );
}

export function ShortsComposition({
  title = "쇼츠랩 AI 영상",
  scenes = [fallbackScene],
  uploadedImageUrl,
}: ShortsCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const safeScenes = scenes.length > 0 ? scenes : [fallbackScene];

  const currentSceneIndex = safeScenes.findIndex((scene) => {
    const startFrame = Math.round(scene.start * fps);
    const endFrame = Math.round(scene.end * fps);
    return frame >= startFrame && frame < endFrame;
  });

  const resolvedSceneIndex =
    currentSceneIndex === -1 ? safeScenes.length - 1 : currentSceneIndex;

  const currentScene = safeScenes[resolvedSceneIndex] ?? fallbackScene;

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      <SceneBackground
        scene={currentScene}
        uploadedImageUrl={uploadedImageUrl}
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

      <SceneIndicator
        sceneIndex={resolvedSceneIndex}
        totalScenes={safeScenes.length}
      />

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
          fontFamily:
            "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif",
        }}
      >
        {title}
      </div>

      <ProgressBar frame={frame} totalFrames={durationInFrames} />
    </AbsoluteFill>
  );
}