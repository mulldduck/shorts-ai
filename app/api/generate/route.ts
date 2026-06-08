import { NextResponse } from "next/server";

type Platform = "youtube" | "tiktok" | "instagram";

type Genre =
  | "horror"
  | "info"
  | "romance"
  | "story"
  | "money"
  | "daily"
  | "vlog";

type RequestBody = {
  platform?: Platform;
  genre?: Genre;
  topic?: string;
  target?: string;
  mood?: string;
  imageBase64?: string;
};

function getPlatformLabel(platform: Platform) {
  switch (platform) {
    case "youtube":
      return "유튜브 쇼츠";
    case "tiktok":
      return "틱톡";
    case "instagram":
      return "인스타그램 릴스";
    default:
      return "유튜브 쇼츠";
  }
}

function getGenreLabel(genre: Genre) {
  switch (genre) {
    case "horror":
      return "공포 / 미스터리";
    case "info":
      return "정보성";
    case "romance":
      return "연애";
    case "story":
      return "썰";
    case "money":
      return "경제";
    case "daily":
      return "일상";
    case "vlog":
      return "브이로그";
    default:
      return "쇼츠";
  }
}

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
  }

  const jsonText = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

function normalizeScene(scene: any, index: number) {
  const start = typeof scene.start === "number" ? scene.start : index * 3;
  const end =
    typeof scene.end === "number" && scene.end > start
      ? scene.end
      : start + 3;

  return {
    start,
    end,
    caption: String(scene.caption ?? `장면 ${index + 1}`),
    subCaption: String(scene.subCaption ?? ""),
    visual: String(scene.visual ?? "쇼츠에 어울리는 장면"),
    effect: ["zoom", "shake", "fade", "slide", "none"].includes(scene.effect)
      ? scene.effect
      : "zoom",
    backgroundType: "solid",
    captionPosition: ["top", "upper", "middle", "lower", "bottom"].includes(
      scene.captionPosition
    )
      ? scene.captionPosition
      : "bottom",
    captionSize: ["small", "medium", "large"].includes(scene.captionSize)
      ? scene.captionSize
      : "medium",
    captionColor: ["white", "yellow", "red", "purple"].includes(
      scene.captionColor
    )
      ? scene.captionColor
      : "white",
    captionBg: ["none", "dark"].includes(scene.captionBg)
      ? scene.captionBg
      : "dark",
    sfxEnabled: Boolean(scene.sfxEnabled),
    sfxLabel: String(scene.sfxLabel ?? ""),
    sfxTiming: ["sceneStart", "impact", "none"].includes(scene.sfxTiming)
      ? scene.sfxTiming
      : "none",
  };
}

function makeFallbackResult(body: RequestBody) {
  const topic = body.topic || "AI 쇼츠 주제";
  const genre = body.genre ?? "horror";

  return {
    title: `${topic} 쇼츠`,
    thumbnailText: "끝까지 보면 소름",
    script: `${topic}에 대한 60초 쇼츠 대본입니다.`,
    duration: 36,
    bgm: "긴장감 있는 숏폼 BGM",
    captionStyle: "강한 대비의 큰 자막",
    thumbnail: {
      text: "끝까지 보면 소름",
      subText: "AI 추천 썸네일",
      sceneIndex: 0,
      textColor: genre === "horror" ? "red" : "yellow",
      position: "middle",
      bgStyle: "dark",
    },
    scenes: Array.from({ length: 10 }).map((_, index) => ({
      start: index * 3.5,
      end: index * 3.5 + 3.5,
      caption:
        index === 0
          ? "이 이야기는 여기서 시작됩니다"
          : `${index + 1}번째 장면의 핵심 한 줄`,
      subCaption:
        index === 0
          ? "처음 3초 안에 시청자를 붙잡는 장면"
          : "빠르게 몰입시키는 보조 자막",
      visual:
        index === 0
          ? "어두운 배경 위에 강렬한 후킹 장면이 등장한다."
          : "장면 분위기에 맞는 세로형 쇼츠 배경.",
      effect: index % 3 === 0 ? "zoom" : index % 3 === 1 ? "fade" : "shake",
      backgroundType: "solid",
      captionPosition: "bottom",
      captionSize: "medium",
      captionColor: index % 2 === 0 ? "white" : "yellow",
      captionBg: "dark",
      sfxEnabled: index === 0 || index === 5 || index === 9,
      sfxLabel: index === 0 ? "강한 시작음" : index === 5 ? "전환음" : "임팩트음",
      sfxTiming: index === 0 || index === 5 || index === 9 ? "sceneStart" : "none",
    })),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const platform = body.platform ?? "youtube";
    const genre = body.genre ?? "horror";
    const topic = body.topic?.trim() ?? "";
    const target = body.target?.trim() ?? "";
    const mood = body.mood?.trim() ?? "";
    const imageBase64 = body.imageBase64 ?? "";

    if (!topic) {
      return NextResponse.json(
        { error: "쇼츠 주제가 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is missing.");
      return NextResponse.json(makeFallbackResult(body));
    }

    const prompt = `
너는 바이럴 쇼츠 전문 기획자이자 숏폼 영상 편집 감독이다.

아래 정보를 바탕으로 ${getPlatformLabel(platform)}용 9:16 쇼츠 구성을 만들어라.

조건:
- 장르: ${getGenreLabel(genre)}
- 주제: ${topic}
- 타깃: ${target || "일반 시청자"}
- 분위기: ${mood || "몰입감 있고 빠른 전개"}
- 전체 길이: 30초 이상 80초 이하
- 장면 수: 8개 이상 18개 이하
- 각 장면 길이: 2.0초 이상 5.0초 이하 권장
- 한국어로 작성
- 자막은 짧고 강하게
- 첫 장면은 무조건 강한 후킹
- 모든 장면에 효과음을 넣지 말고, 중요한 장면에만 sfxEnabled true
- 이미지에는 글자가 들어가지 않는다고 가정하고 visual은 배경 설명 중심으로 작성

반드시 아래 JSON 형식만 반환해라.
설명 문장, 마크다운, 코드블록 없이 JSON만 반환해라.

{
  "title": "쇼츠 제목",
  "thumbnailText": "썸네일 메인 문구",
  "script": "전체 대본",
  "duration": 60,
  "bgm": "추천 BGM 설명",
  "captionStyle": "추천 자막 스타일",
  "thumbnail": {
    "text": "썸네일 메인 문구",
    "subText": "썸네일 서브 문구",
    "sceneIndex": 0,
    "textColor": "white | yellow | red | purple",
    "position": "top | middle | bottom",
    "bgStyle": "dark | blur | none"
  },
  "scenes": [
    {
      "start": 0,
      "end": 3,
      "caption": "메인 자막",
      "subCaption": "보조 자막",
      "visual": "장면 배경 설명",
      "effect": "zoom | shake | fade | slide | none",
      "backgroundType": "solid",
      "captionPosition": "top | upper | middle | lower | bottom",
      "captionSize": "small | medium | large",
      "captionColor": "white | yellow | red | purple",
      "captionBg": "none | dark",
      "sfxEnabled": true,
      "sfxLabel": "효과음 이름",
      "sfxTiming": "sceneStart | impact | none"
    }
  ]
}
`.trim();

    const content: any[] = [];

    content.push({
      type: "text",
      text: prompt,
    });

    if (imageBase64.startsWith("data:image/")) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

      if (match) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1],
            data: match[2],
          },
        });
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0.8,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return NextResponse.json(makeFallbackResult(body));
    }

    const anthropicData = await response.json();

    const text =
      anthropicData.content
        ?.map((item: any) => {
          if (item.type === "text") return item.text;
          return "";
        })
        .join("\n") ?? "";

    const parsed = extractJson(text);

    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes.map(normalizeScene)
      : makeFallbackResult(body).scenes;

    const duration =
      typeof parsed.duration === "number"
        ? parsed.duration
        : scenes.length > 0
        ? scenes[scenes.length - 1].end
        : 60;

    const result = {
      title: String(parsed.title ?? `${topic} 쇼츠`),
      thumbnailText: String(parsed.thumbnailText ?? parsed.title ?? topic),
      script: String(parsed.script ?? ""),
      duration,
      bgm: String(parsed.bgm ?? "쇼츠에 어울리는 BGM"),
      captionStyle: String(parsed.captionStyle ?? "큰 자막, 강한 대비"),
      thumbnail: {
        text: String(
          parsed.thumbnail?.text ??
            parsed.thumbnailText ??
            parsed.title ??
            "끝까지 보면 소름"
        ),
        subText: String(parsed.thumbnail?.subText ?? "AI 추천 썸네일"),
        sceneIndex:
          typeof parsed.thumbnail?.sceneIndex === "number"
            ? Math.min(Math.max(parsed.thumbnail.sceneIndex, 0), scenes.length - 1)
            : 0,
        textColor: ["white", "yellow", "red", "purple"].includes(
          parsed.thumbnail?.textColor
        )
          ? parsed.thumbnail.textColor
          : "yellow",
        position: ["top", "middle", "bottom"].includes(parsed.thumbnail?.position)
          ? parsed.thumbnail.position
          : "middle",
        bgStyle: ["dark", "blur", "none"].includes(parsed.thumbnail?.bgStyle)
          ? parsed.thumbnail.bgStyle
          : "dark",
      },
      scenes,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("generate route error:", error);

    return NextResponse.json(
      {
        error: "쇼츠 생성 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}