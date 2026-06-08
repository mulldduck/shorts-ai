"use client";

import { useEffect, useState } from "react";

const sections = [
  "제목",
  "썸네일 문구",
  "오프닝 훅",
  "쇼츠 대본",
  "씬 분할",
  "이미지/영상 활용안",
  "BGM 추천",
  "자막 스타일",
];

const genres = [
  "자동 추천",
  "공포/미스터리",
  "정보성",
  "연애/관계",
  "썰/사연",
  "동기부여",
  "경제/돈",
  "게임",
  "역사/지식",
  "밈/유머",
];

const platforms = ["유튜브 쇼츠", "틱톡", "인스타 릴스"];

type HistoryItem = {
  id: number;
  topic: string;
  genre: string;
  platform: string;
  result: string;
  createdAt: string;
};

function extractSection(text: string, title: string) {
  const pattern = new RegExp(`\\[${title}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`, "i");
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("자동 추천");
  const [platform, setPlatform] = useState("유튜브 쇼츠");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageType, setImageType] = useState("");

  const [videoPreview, setVideoPreview] = useState("");
  const [videoName, setVideoName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("shortslab-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const nextHistory = [newItem, ...history].slice(0, 10);
    setHistory(nextHistory);
    localStorage.setItem("shortslab-history", JSON.stringify(nextHistory));
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("이미지는 4MB 이하로 올려주세요.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      setImagePreview(result);
      setImageBase64(base64);
      setImageType(file.type);
    };

    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("영상 파일만 업로드할 수 있어요.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("영상은 우선 50MB 이하만 업로드해주세요.");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setVideoName(file.name);
  };

  const generateScript = async () => {
    if (!topic.trim() && !imageBase64 && !videoPreview) {
      return alert("주제를 입력하거나 이미지/영상을 업로드해주세요.");
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          genre,
          platform,
          imageBase64,
          imageType,
          videoName,
        }),
      });

      const data = await response.json();
      const generated = data.result || "결과를 불러오지 못했습니다.";

      setResult(generated);

      saveHistory({
        id: Date.now(),
        topic: topic || imageBase64 ? topic || "자료 기반 쇼츠" : "영상 기반 쇼츠",
        genre,
        platform,
        result: generated,
        createdAt: new Date().toLocaleString("ko-KR"),
      });
    } catch {
      setResult("오류가 발생했습니다.");
    }

    setLoading(false);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  };

  const loadHistory = (item: HistoryItem) => {
    setTopic(item.topic);
    setGenre(item.genre || "자동 추천");
    setPlatform(item.platform || "유튜브 쇼츠");
    setResult(item.result);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deleteHistory = (id: number) => {
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    localStorage.setItem("shortslab-history", JSON.stringify(nextHistory));
  };

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-black">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">쇼츠랩 AI</h1>
            <p className="text-sm text-black/45">AI Shorts Studio</p>
          </div>

          <button className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white">
            Pro 준비중
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
            AI 쇼츠 제작 스튜디오
          </div>

          <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.05em] md:text-7xl">
            주제와 자료를 바탕으로
            <br />
            쇼츠 기획안을
            <br />
            AI가 만들어드립니다.
          </h2>

          <p className="mt-8 max-w-2xl text-xl leading-9 text-black/55">
            이미지, 영상, 장르, 플랫폼을 참고해 제목, 대본, 씬 분할,
            이미지/영상 활용안까지 생성합니다.
          </p>

          <div className="mt-12 w-full max-w-3xl rounded-[32px] bg-white p-5 shadow-xl shadow-black/5">
            <div className="mb-5 text-left">
              <p className="mb-3 text-sm font-black text-black/40">플랫폼 선택</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {platforms.map((item) => (
                  <button
                    key={item}
                    onClick={() => setPlatform(item)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      platform === item
                        ? "bg-black text-white"
                        : "bg-[#F5F5F7] text-black/55 hover:bg-black hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 text-left">
              <p className="mb-3 text-sm font-black text-black/40">장르 선택</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {genres.map((item) => (
                  <button
                    key={item}
                    onClick={() => setGenre(item)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      genre === item
                        ? "bg-black text-white"
                        : "bg-[#F5F5F7] text-black/55 hover:bg-black hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 grid gap-4 text-left md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-black text-black/40">이미지 업로드</p>
                <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-[#F5F5F7] p-5 text-center transition hover:border-black/30">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="업로드 이미지"
                      className="max-h-56 rounded-2xl object-cover"
                    />
                  ) : (
                    <>
                      <p className="text-lg font-black">이미지 업로드</p>
                      <p className="mt-2 text-sm text-black/45">
                        사진 분위기를 참고합니다.
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>

                {imagePreview && (
                  <button
                    onClick={() => {
                      setImagePreview("");
                      setImageBase64("");
                      setImageType("");
                    }}
                    className="mt-3 rounded-2xl bg-[#F5F5F7] px-4 py-2 text-sm font-bold text-black/50 hover:bg-black hover:text-white"
                  >
                    이미지 삭제
                  </button>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-black/40">영상 업로드</p>
                <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-[#F5F5F7] p-5 text-center transition hover:border-black/30">
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      controls
                      className="max-h-56 rounded-2xl"
                    />
                  ) : (
                    <>
                      <p className="text-lg font-black">영상 업로드</p>
                      <p className="mt-2 text-sm text-black/45">
                        원본 영상 기반 제작 준비.
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                    }}
                  />
                </label>

                {videoPreview && (
                  <button
                    onClick={() => {
                      setVideoPreview("");
                      setVideoName("");
                    }}
                    className="mt-3 rounded-2xl bg-[#F5F5F7] px-4 py-2 text-sm font-bold text-black/50 hover:bg-black hover:text-white"
                  >
                    영상 삭제
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 사이비 종교 마을의 실체"
              className="h-40 w-full resize-none rounded-3xl bg-[#F5F5F7] p-6 text-xl outline-none placeholder:text-black/25"
            />

            <button
              onClick={generateScript}
              disabled={loading}
              className="mt-4 w-full rounded-3xl bg-black px-6 py-5 text-xl font-black text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "AI가 쇼츠 생성 중..." : "쇼츠 기획안 생성하기"}
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["플랫폼 최적화", "장르 선택", "이미지 기반", "영상 업로드"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black/60 shadow-sm"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </section>

        {loading && (
          <section className="pb-16">
            <div className="rounded-[36px] bg-white p-7 shadow-xl shadow-black/5">
              <p className="text-sm font-bold text-black/40">GENERATING</p>
              <h3 className="mt-2 text-3xl font-black">
                AI가 자료를 바탕으로 쇼츠 구성을 만들고 있어요
              </h3>
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-3xl bg-[#F5F5F7]" />
                ))}
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="pb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/40">
                  RESULT · {platform} · {genre}
                </p>
                <h3 className="text-4xl font-black">생성 결과</h3>
              </div>

              <button
                onClick={() => copyText(result)}
                className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-bold transition hover:bg-black hover:text-white"
              >
                전체 복사
              </button>
            </div>

            <div className="grid gap-5">
              {sections.map((section) => {
                const content = extractSection(result, section);
                if (!content) return null;

                return (
                  <div key={section} className="rounded-[28px] bg-white p-6 shadow-xl shadow-black/5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h4 className="text-2xl font-black">{section}</h4>
                      <button
                        onClick={() => copyText(content)}
                        className="rounded-xl bg-[#F5F5F7] px-4 py-2 text-sm font-bold text-black/55 hover:bg-black hover:text-white"
                      >
                        복사
                      </button>
                    </div>

                    <div className="whitespace-pre-wrap rounded-3xl bg-[#F5F5F7] p-5 text-lg leading-9 text-black/75">
                      {content}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="pb-20">
            <div className="mb-5">
              <p className="text-sm font-bold text-black/40">HISTORY</p>
              <h3 className="text-3xl font-black">최근 생성 기록</h3>
            </div>

            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <button onClick={() => loadHistory(item)} className="text-left">
                    <p className="text-lg font-black">{item.topic}</p>
                    <p className="mt-1 text-sm text-black/40">
                      {item.platform || "유튜브 쇼츠"} · {item.genre} · {item.createdAt}
                    </p>
                  </button>

                  <button
                    onClick={() => deleteHistory(item.id)}
                    className="rounded-2xl bg-[#F5F5F7] px-4 py-2 text-sm font-bold text-black/50 hover:bg-black hover:text-white"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}