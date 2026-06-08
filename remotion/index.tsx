  import { Composition } from "remotion";
  import { ShortsComposition } from "./ShortsComposition";

const defaultScenes = [
  {
    start: 0,
    end: 3,
    caption: "잠깐, 이건 그냥 넘기면 안 됩니다",
    subCaption: "마지막 장면에서 모든 게 뒤집힙니다",
    visual: "강한 훅 장면",
    effect: "zoom" as const,
    backgroundType: "gradient",
    captionPosition: "bottom" as const,
    captionSize: "large" as const,
    captionColor: "white" as const,
    captionBg: "dark" as const,
  },
  {
    start: 3,
    end: 8,
    caption: "처음엔 아무도 이상하게 생각하지 않았습니다",
    subCaption: "하지만 이상한 일이 시작됐습니다",
    visual: "상황 설명 장면",
    effect: "fade" as const,
    backgroundType: "dark",
    captionPosition: "bottom" as const,
    captionSize: "large" as const,
    captionColor: "yellow" as const,
    captionBg: "dark" as const,
  },
  {
    start: 8,
    end: 13,
    caption: "문제는 그다음부터였습니다",
    subCaption: "분위기가 갑자기 달라졌습니다",
    visual: "긴장감 있는 장면",
    effect: "shake" as const,
    backgroundType: "dark",
    captionPosition: "middle" as const,
    captionSize: "large" as const,
    captionColor: "red" as const,
    captionBg: "dark" as const,
  },
  {
    start: 13,
    end: 18,
    caption: "그리고 마지막에 밝혀진 진실",
    subCaption: "이 장면 때문에 다시 보게 됩니다",
    visual: "반전 장면",
    effect: "slide" as const,
    backgroundType: "gradient",
    captionPosition: "bottom" as const,
    captionSize: "large" as const,
    captionColor: "purple" as const,
    captionBg: "dark" as const,
  },
];

export const RemotionRoot = () => {
  return (
    <Composition
      id="ShortsLabVideo"
      component={ShortsComposition}
      durationInFrames={30 * 18}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        title: "쇼츠랩 AI 결과",
        duration: 18,
        scenes: defaultScenes,
        audio: {
          bgmVolume: 0.25,
          sfxVolume: 0.5,
        },
      }}
    />
  );
};