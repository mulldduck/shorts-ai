import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 80 * 1024 * 1024;

const allowedMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/ogg",
];

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    case "audio/aac":
      return "aac";
    case "audio/mp4":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    default:
      return "bin";
  }
}

function sanitizeFileName(fileName: string) {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  const safeName = nameWithoutExt
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣._-]/g, "")
    .slice(0, 50);

  return safeName || "uploaded-media";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "업로드할 파일이 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `지원하지 않는 파일 형식입니다: ${file.type}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "파일 용량이 너무 큽니다. 80MB 이하 파일만 업로드해주세요.",
        },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const extension = getExtensionFromMimeType(file.type);
    const safeName = sanitizeFileName(file.name);
    const fileName = `${safeName}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileName,
      url: `/uploads/${fileName}`,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("upload-media route error:", error);

    return NextResponse.json(
      {
        error: "파일 업로드 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}