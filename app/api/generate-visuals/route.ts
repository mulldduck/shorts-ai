import OpenAI from "openai";
import { NextResponse } from "next/server";

type Genre =
  | "horror"
  | "info"
  | "romance"
  | "story"
  | "money"
  | "daily"
  | "vlog";

type BackgroundType =
  | "solid"
  | "uploadedImage"
  | "uploadedVideo"
  | "generatedImage"
  | "sceneImage"
  | "sceneVideo";

type Scene = {
  start: number;
  end: number;
  caption: string;
  subCaption: string;
  visual: string;
  effect: string;
  backgroundType: BackgroundType;
  captionPosition: string;
  captionSize: string;
  captionColor: string;
  captionBg: string;
  imageUrl?: string;
  sceneImageUrl?: string;
  sceneImageName?: string;
  sceneVideoUrl?: string;
  sceneVideoName?: string;
  sfxEnabled?: boolean;
  sfxLabel?: string;
  sfxTiming?: string;
};

type RequestBody = {
  genre?: Genre;
  scenes?: Scene[];
  sceneIndex?: number;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getGenreStyle(genre: Genre) {
  switch (genre) {
    case "horror":
      return {
        label: "공포 / 미스터리",
        prompt:
          "dark cinematic horror, eerie atmosphere, dramatic shadows, mysterious lighting, suspenseful, realistic, vertical short-form video background",
      };
    case "info":
      return {
        label: "정보성",
        prompt:
          "clean modern educational visual, bright but cinematic, minimal design, clear subject, high contrast, vertical short-form video background",
      };
    case "romance":
      return {
        label: "연애",
        prompt:
          "emotional romantic cinematic scene, soft lighting, warm tones, dramatic but elegant, vertical short-form video background",
      };
    case "story":
      return {
        label: "썰",
        prompt:
          "Korean realistic storytelling scene, cinematic everyday mood, dramatic composition, viral shorts background, vertical format",
      };
    case "money":
      return {
        label: "경제",
        prompt:
          "modern finance and money concept, cinematic business visual, charts, coins, urban atmosphere, vertical short-form video background",
      };
    case "daily":
      return {
        label: "일상",
        prompt:
          "realistic daily life scene, cozy cinematic lighting, relatable Korean lifestyle mood, vertical short-form video background",
      };
    case "vlog":
      return {
        label: "브이로그",
        prompt:
          "stylish vlog background, realistic travel or lifestyle mood, cinematic natural lighting, vertical short-form video background",
      };
    default:
      return {
        label: "쇼츠",
        prompt:
          "cinematic vertical short-form video background, realistic, high quality, dramatic composition",
      };
  }
}

function buildImagePrompt(scene: Scene, genre: Genre, index: number) {
  const genreStyle = getGenreStyle(genre);

  return `
Create a vertical 9:16 background image for a Korean short-form video.

Genre:
${genreStyle.label}

Scene number:
${index + 1}

Scene caption:
${scene.caption}

Sub caption:
${scene.subCaption}

Visual direction:
${scene.visual}

Style direction:
${genreStyle.prompt}

Important rules:
- Vertical 9:16 composition.
- No subtitles, no captions, no readable text in the image.
- No logos, no watermarks.
- Leave enough empty space for big Korean captions.
- Make it suitable as a background for YouTube Shorts, TikTok, and Instagram Reels.
- Cinematic, high quality, visually striking.
`.trim();
}

function makeFallbackSvg(scene: Scene, genre: Genre, index: number) {
  const genreColor =
    genre === "horror"
      ? "#7c2d12"
      : genre === "romance"
      ? "#9d174d"
      : genre === "money"
      ? "#065f46"
      : genre === "info"
      ? "#1d4ed8"
      : "#5b21b6";

  const safeCaption = (scene.caption || `Scene ${index + 1}`)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="45%" stop-color="${genreColor}"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#bg)"/>
  <rect width="720" height="1280" fill="url(#glow)"/>
  <circle cx="120" cy="220" r="160" fill="#ffffff" opacity="0.08"/>
  <circle cx="620" cy="980" r="220" fill="#ffffff" opacity="0.07"/>
  <rect x="70" y="810" width="580" height="290" rx="42" fill="#000000" opacity="0.34"/>
  <text x="360" y="910" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="800" font-family="Arial, sans-serif">AI BACKGROUND</text>
  <text x="360" y="970" text-anchor="middle" fill="#facc15" font-size="28" font-weight="800" font-family="Arial, sans-serif">Scene ${index + 1}</text>
  <foreignObject x="100" y="1000" width="520" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-size:28px;font-weight:800;text-align:center;font-family:Arial,sans-serif;line-height:1.2;">
      ${safeCaption}
    </div>
  </foreignObject>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function generateImageUrl(scene: Scene, genre: Genre, index: number) {
  if (!process.env.OPENAI_API_KEY) {
    return makeFallbackSvg(scene, genre, index);
  }

  const prompt = buildImagePrompt(scene, genre, index);

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1536",
    quality: "medium",
    n: 1,
  });

  const base64 = result.data?.[0]?.b64_json;

  if (!base64) {
    return makeFallbackSvg(scene, genre, index);
  }

  return `data:image/png;base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const genre = body.genre ?? "horror";
    const scenes = body.scenes ?? [];
    const sceneIndex = body.sceneIndex;

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "생성할 장면이 없습니다." },
        { status: 400 }
      );
    }

    const shouldGenerateSingleScene =
      typeof sceneIndex === "number" &&
      Number.isInteger(sceneIndex) &&
      sceneIndex >= 0 &&
      sceneIndex < scenes.length;

    if (shouldGenerateSingleScene) {
      const targetScene = scenes[sceneIndex];

      try {
        const imageUrl = await generateImageUrl(targetScene, genre, sceneIndex);

        const updatedScenes = scenes.map((scene, index) =>
          index === sceneIndex
            ? {
                ...scene,
                imageUrl,
                backgroundType: "generatedImage" as BackgroundType,
              }
            : scene
        );

        return NextResponse.json({
          scenes: updatedScenes,
          sceneIndex,
        });
      } catch (error) {
        console.error(`Scene ${sceneIndex + 1} image generation failed:`, error);

        const updatedScenes = scenes.map((scene, index) =>
          index === sceneIndex
            ? {
                ...scene,
                imageUrl: makeFallbackSvg(scene, genre, index),
                backgroundType: "generatedImage" as BackgroundType,
              }
            : scene
        );

        return NextResponse.json({
          scenes: updatedScenes,
          sceneIndex,
        });
      }
    }

    const generatedScenes: Scene[] = [];

    for (let index = 0; index < scenes.length; index += 1) {
      const scene = scenes[index];

      try {
        const imageUrl = await generateImageUrl(scene, genre, index);

        generatedScenes.push({
          ...scene,
          imageUrl,
          backgroundType: "generatedImage",
        });
      } catch (error) {
        console.error(`Scene ${index + 1} image generation failed:`, error);

        generatedScenes.push({
          ...scene,
          imageUrl: makeFallbackSvg(scene, genre, index),
          backgroundType: "generatedImage",
        });
      }
    }

    return NextResponse.json({
      scenes: generatedScenes,
    });
  } catch (error) {
    console.error("generate-visuals route error:", error);

    return NextResponse.json(
      {
        error: "AI 배경 이미지 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}