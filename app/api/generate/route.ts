import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, genre, platform } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `너는 조회수 높은 쇼츠를 제작하는 전문 숏폼 콘텐츠 작가다.

주제:
${topic}

선택 장르:
${genre}

선택 플랫폼:
${platform}

조건:
- 선택 플랫폼에 맞는 숏폼 스타일로 작성
- 유튜브 쇼츠는 정보 전달, 몰입감, 완성도 있는 내레이션 중심
- 틱톡은 첫 훅이 강하고 빠른 전개, 짧고 자극적인 문장 중심
- 인스타 릴스는 감성, 공감, 세련된 자막 흐름 중심
- 선택 장르가 "자동 추천"이면 주제에 가장 잘 맞는 장르를 스스로 판단
- 첫 3초 안에 시선을 끄는 훅 구성
- 짧고 강한 문장 사용
- 정보 전달 + 몰입감을 동시에 살린다
- 30~60초 분량
- 실제 쇼츠처럼 자연스럽게 작성

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

[BGM 추천]
...

[자막 스타일]
...`,
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