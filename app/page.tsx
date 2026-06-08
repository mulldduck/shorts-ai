"use client";

import { useEffect, useState } from "react";

const sections = [
  "제목",
  "썸네일 문구",
  "오프닝 훅",
  "쇼츠 대본",
  "씬 분할",
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
  const pattern = new RegExp(
    `\\[${title}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`,
    "i"
  );

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

  useEffect(() => {
    const saved = localStorage.getItem("shortslab-history");

    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const nextHistory = [newItem, ...history].slice(0, 10);

    setHistory(nextHistory);
    localStorage.setItem("shortslab-history", JSON.stringify(nextHistory));
  };

  const generateScript = async () => {
    if (!topic.trim()) return alert("주제를 입력해주세요.");

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, genre, platform }),
      });

      const data = await response.json();
      const generated = data.result || "결과를 불러오지 못했습니다.";

      setResult(generated);

      saveHistory({
        id: Date.now(),
        topic,
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
            <p className="text-sm text-black/45">AI Shorts Generator</p>
          </div>

          <button className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white">
            Pro 준비중
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
            AI 쇼츠 대본 생성기
          </div>

          <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.05em] md:text-7xl">
            플랫폼에 맞는
            <br />
            쇼츠 대본을
            <br />
            AI로 빠르게 생성하세요.
          </h2>

          <p className="mt-8 max-w-2xl text-xl leading-9 text-black/55">
            유튜브 쇼츠, 틱톡, 인스타 릴스에 맞게 제목, 대본,
            씬 분할, BGM 추천까지 한 번에 생성합니다.
          </p>

          <div className="mt-12 w-full max-w-3xl rounded-[32px] bg-white p-5 shadow-xl shadow-black/5">
            <div className="mb-5 text-left">
              <p className="mb-3 text-sm font-black text-black/40">
                플랫폼 선택
              </p>

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
              <p className="mb-3 text-sm font-black text-black/40">
                장르 선택
              </p>

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
              {loading ? "AI가 쇼츠 생성 중..." : "쇼츠 대본 생성하기"}
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["플랫폼 최적화", "장르 선택", "AI 자동 생성", "씬 분할"].map(
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

          <div className="mt-14 w-full max-w-3xl rounded-[32px] bg-black p-7 text-left text-white shadow-xl">
            <p className="text-sm font-bold text-white/50">SHORTSLAB PRO</p>

            <h3 className="mt-3 text-3xl font-black leading-snug">
              더 강력한 기능이
              <br />
              곧 추가됩니다.
            </h3>

            <p className="mt-4 leading-8 text-white/65">
              AI 더빙, 자동 자막, 조회수 분석,
              쇼츠 템플릿 추천 기능을 준비 중입니다.
            </p>

            <button className="mt-6 rounded-2xl bg-white px-5 py-4 font-black text-black">
              출시 알림 받기
            </button>
          </div>
        </section>

        {loading && (
          <section className="pb-16">
            <div className="rounded-[36px] bg-white p-7 shadow-xl shadow-black/5">
              <p className="text-sm font-bold text-black/40">GENERATING</p>
              <h3 className="mt-2 text-3xl font-black">
                AI가 플랫폼에 맞는 쇼츠 구성을 만들고 있어요
              </h3>

              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-3xl bg-[#F5F5F7]"
                  />
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
                  <div
                    key={section}
                    className="rounded-[28px] bg-white p-6 shadow-xl shadow-black/5"
                  >
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
                      {item.platform || "유튜브 쇼츠"} · {item.genre} ·{" "}
                      {item.createdAt}
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