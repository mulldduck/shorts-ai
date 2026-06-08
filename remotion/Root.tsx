import { Composition } from "remotion";
import {
  ShortsComposition,
  type Scene,
  type ThumbnailSettings,
} from "./ShortsComposition";

const defaultScenes: Scene[] = [
  {
    start: 0,
    end: 3.5,
    caption: "AI 쇼츠랩",
    subCaption: "장면별 배경이 MP4에 반영됩니다",
    visual: "어두운 보라색 그라데이션 배경 위에 강렬한 쇼츠 자막이 등장한다.",
    effect: "zoom",
    backgroundType: "solid",
    captionPosition: "bottom",
    captionSize: "medium",
    captionColor: "white",
    captionBg: "dark",
    sfxEnabled: false,
    sfxLabel: "",
    sfxTiming: "none",
  },
  {
    start: 3.5,
    end: 7,
    caption: "이미지도 영상처럼",
    subCaption: "프리뷰와 렌더링을 맞춰가는 중",
    visual: "쇼츠 편집 타임라인과 세로형 영상 프리뷰가 함께 보이는 화면.",
    effect: "fade",
    backgroundType: "solid",
    captionPosition: "middle",
    captionSize: "large",
    captionColor: "yellow",
    captionBg: "dark",
    sfxEnabled: false,
    sfxLabel: "",
    sfxTiming: "none",
  },
];

const defaultThumbnail: ThumbnailSettings = {
  text: "AI 쇼츠랩",
  subText: "자동 썸네일",
  sceneIndex: 0,
  textColor: "yellow",
  position: "middle",
  bgStyle: "dark",
};

function getTotalDuration(scenes: Scene[]) {
  if (!scenes || scenes.length === 0) return 8;

  const maxEnd = Math.max(...scenes.map((scene) => Number(scene.end || 0)));

  if (!Number.isFinite(maxEnd) || maxEnd <= 0) {
    return 8;
  }

  return maxEnd;
}

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  const defaultDuration = getTotalDuration(defaultScenes);

  return (
    <>
      <Composition
        id="ShortsLabVideo"
        component={ShortsComposition}
        durationInFrames={Math.ceil(defaultDuration * fps)}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          title: "쇼츠랩 AI 영상",
          duration: defaultDuration,
          scenes: defaultScenes,
          thumbnail: defaultThumbnail,
          uploadedImageUrl: "",
          uploadedVideoUrl: "",
          bgmUrl: "",
          sfxUrl: "",
          bgmVolume: 0.35,
          sfxVolume: 0.7,
        }}
        calculateMetadata={({ props }) => {
          const scenes = Array.isArray(props.scenes)
            ? (props.scenes as Scene[])
            : defaultScenes;

          const duration =
            typeof props.duration === "number" && props.duration > 0
              ? props.duration
              : getTotalDuration(scenes);

          return {
            durationInFrames: Math.ceil(duration * fps),
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
    </>
  );
};