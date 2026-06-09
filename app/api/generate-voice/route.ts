import OpenAI from "openai";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoiceStyle = "alloy" | "verse" | "nova" | "shimmer" | "echo";

type RequestBody = {
  text?: string;
  voice?: VoiceStyle;
};

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const text = body.text?.trim() ?? "";
    const voice = body.voice ?? "alloy";

    if (!text) {
      return NextResponse.json(
        { error: "음성으로 만들 텍스트가 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY가 없어 아직 실제 음성 생성은 사용할 수 없습니다.",
          fallback: true,
        },
        { status: 200 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
    });

    const arrayBuffer = await speech.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = sanitizeFileName(text.slice(0, 20)) || "narration";
    const fileName = `${safeName}-${Date.now()}.mp3`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${fileName}`,
      fileName,
    });
  } catch (error) {
    console.error("generate-voice route error:", error);

    return NextResponse.json(
      { error: "AI 음성 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}