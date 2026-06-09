import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const duration = Number(body.duration ?? 30);

    const cuts = [];

    let current = 0;

    while (current < duration) {
      const cutLength = Math.random() > 0.5 ? 3 : 4;

      const start = current;
      const end = Math.min(current + cutLength, duration);

      cuts.push({
        title: `추천 컷 ${cuts.length + 1}`,
        start,
        end,
      });

      current = end;
    }

    return NextResponse.json({
      success: true,
      cuts,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "컷 추천 실패",
      },
      {
        status: 500,
      }
    );
  }
}