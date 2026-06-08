import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      topic,
      genre,
      platform,
      imageBase64,
      imageType,
      videoName,
    } = await req.json();

    const content: any[] = [
      {
        type: "text",
        text: `너는 조회수 높은 쇼츠를 제작하는 전문 숏폼 콘텐츠 작가다.

주제:
${topic || "사용자 업로드 자료 기반 쇼츠"}

선택 장르:
${genre}

선택 플랫폼:
${platform}

업로드 자료:
${imageBase64 ? "- 이미지가 업로드됨. 이미지 분위기와 내용을 참고할 것." : "- 이미지 없음"}
${videoName ? `- 영상 파일이 업로드됨. 파일명: ${videoName}. 실제 영상 분석은 아직 불가능하므로, 사용자가 업로드한 원본 영상이 있다고 가정하고 쇼츠 편집 방향을 제안할 것.` : "- 영상 없음"}

추가 조건:
- 사용자 이미지/영상 자료를 중심으로 쇼츠를 구성
- 부족한 장면은 AI 이미지, B-roll, 자막 효과, 확대/줌인 효과로 보강하는 방향 제안
- 선택 플랫폼에 맞는 숏폼 스타일로 작성
- 유튜브 쇼츠는 정보 전달, 몰입감, 완성도 있는 내레이션 중심
- 틱톡은 첫 훅이 강하고 빠른 전개, 짧고 자극적인 문장 중심
- 인스타 릴스는 감성, 공감, 세련된 자막 흐름 중심
- 첫 3초 안에 시선을 끄는 훅 구성
- 짧고 강한 문장 사용
- 30~60초 분량
- 실제 쇼츠 편집자가 바로 참고할 수 있게 작성

아래 형식을 반드시 지켜라.

[제목]
...

[썸네일 문구]
...

[오프닝 훅]
...

[쇼츠 대본]
...

[씬 분할]
...

[이미지/영상 활용안]
...

[BGM 추천]
...

[자막 스타일]
...`,
      },
    ];

    if (imageBase64 && imageType) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageType,
          data: imageBase64,
        },
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const result =
      response.content[0].type === "text"
        ? response.content[0].text
        : "결과 없음";

    return Response.json({ result });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "생성 실패" }, { status: 500 });
  }
}