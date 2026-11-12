"use client";

import { personalData } from "@/utils/data/personal-data";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { BsRobot } from "react-icons/bs";
import { IoClose, IoRefresh, IoSend } from "react-icons/io5";

const FALLBACK_SUGGESTIONS = [
  "Summarise her profile",
  "Does she need visa sponsorship?",
  "Tell me about DEX WorkBench",
  "What's her tech stack?",
];

// ---- fallback: run the same engine in the browser (e.g. static hosting with no API routes) ----
let localEnginePromise;
function getLocalEngine() {
  localEnginePromise ||= (async () => {
    const [{ parseResume }, { buildEngine }, { projectsData }, { achievements }] = await Promise.all([
      import("@/utils/resume/parse-resume"),
      import("@/utils/resume/chat-engine"),
      import("@/utils/data/projects-data"),
      import("@/utils/data/achievements"),
    ]);
    const res = await fetch(personalData.resume);
    if (!res.ok) throw new Error("resume not found");
    const resume = await parseResume(await res.arrayBuffer());
    return buildEngine(resume, {
      projects: projectsData,
      achievements: achievements.map(({ title, description }) => ({ title, description })),
    });
  })().catch((err) => {
    localEnginePromise = null;
    throw err;
  });
  return localEnginePromise;
}

async function callApi(init) {
  const res = await fetch("/api/chat", init);
  if (!res.ok || !res.headers.get("content-type")?.includes("json")) throw new Error("api unavailable");
  return res.json();
}

async function fetchWelcome() {
  try {
    return await callApi();
  } catch {
    const { getWelcome } = await import("@/utils/resume/chat-engine");
    return getWelcome(await getLocalEngine());
  }
}

async function fetchAnswer(message, lastEntity) {
  try {
    return await callApi({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, lastEntity }),
    });
  } catch {
    const { answer } = await import("@/utils/resume/chat-engine");
    return answer(await getLocalEngine(), message, { lastEntity });
  }
}

// ---- tiny, safe markdown renderer (bold, italics, bullets, links) ----
const INLINE = /(\*\*[^*]+\*\*|_[^_]+_|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g;

function Inline({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) return <em key={i} className="text-gray-400">{part.slice(1, -1)}</em>;
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-[#16f2b3] underline underline-offset-2">
          {part.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      );
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part))
      return (
        <a key={i} href={`mailto:${part}`} className="text-[#16f2b3] underline underline-offset-2">
          {part}
        </a>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function RichText({ text }) {
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        const items = lines.filter((l) => l.startsWith("- "));
        const head = lines.filter((l) => !l.startsWith("- "));
        return (
          <div key={i}>
            {head.map((l, j) => (
              <p key={j}>
                <Inline text={l} />
              </p>
            ))}
            {items.length > 0 && (
              <ul className="mt-1 space-y-1">
                {items.map((l, j) => (
                  <li key={j} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#16f2b3]/70">
                    <Inline text={l.slice(2)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PortfolioChatbot() {
  const firstName = personalData.name.split(" ")[0].replace(/^(.)(.*)$/, (_, a, b) => a + b.toLowerCase());
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [lastEntity, setLastEntity] = useState();
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const welcomed = useRef(false);

  const welcome = useCallback(async () => {
    const fallback = `Hi! 👋 I'm ${firstName}'s resume assistant. Ask me anything about her experience, projects, skills or availability.`;
    try {
      const data = await fetchWelcome();
      setMessages([{ role: "assistant", content: data.message || fallback }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages([{ role: "assistant", content: fallback }]);
    }
  }, [firstName]);

  useEffect(() => {
    if (isOpen && !welcomed.current) {
      welcomed.current = true;
      welcome();
    }
    if (isOpen) {
      setShowNudge(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, welcome]);

  // Gentle nudge for recruiters after a few seconds
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("chat-nudge") === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setShowNudge(true);
      try {
        sessionStorage.setItem("chat-nudge", "1");
      } catch {}
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sendMessage = async (value = input) => {
    const clean = value.trim();
    if (!clean || loading) return;
    setMessages((m) => [...m, { role: "user", content: clean }]);
    setInput("");
    setLoading(true);
    const started = Date.now();
    let reply = "Sorry, something went wrong. Please try again.";
    try {
      const data = await fetchAnswer(clean, lastEntity);
      reply = data.answer || reply;
      if (data.entity) setLastEntity(data.entity);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {}
    // small natural pause so the typing indicator is visible
    const wait = Math.max(0, 450 - (Date.now() - started));
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, wait);
  };

  const reset = () => {
    setLastEntity(undefined);
    setSuggestions(FALLBACK_SUGGESTIONS);
    welcome();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Chat with ${firstName}'s resume assistant`}
          className="chat-pop mb-3 flex h-[min(36rem,calc(100dvh-7rem))] w-[calc(100vw-2.5rem)] max-w-[25rem] flex-col overflow-hidden rounded-2xl border border-[#2b3158] bg-[#0d1224]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <div className="relative flex items-center justify-between border-b border-[#2b3158] bg-gradient-to-r from-[#1a1443] to-[#11152c] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600">
                <BsRobot className="text-white" size={20} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1a1443] bg-[#16f2b3]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ask about {firstName}</p>
                <p className="text-[11px] text-gray-400">Answers straight from her latest resume</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Restart chat" onClick={reset} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                <IoRefresh size={18} />
              </button>
              <button type="button" aria-label="Close chat" onClick={() => setIsOpen(false)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                <IoClose size={20} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-gradient-to-r from-pink-500 to-violet-600 text-white"
                    : "rounded-bl-sm border border-[#232a4d] bg-[#151b34] text-gray-200"
                }`}
              >
                {m.role === "user" ? m.content : <RichText text={m.content} />}
              </div>
            ))}
            {loading && (
              <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-[#232a4d] bg-[#151b34] px-4 py-3" aria-label="Assistant is typing">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#16f2b3]" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[#2b3158] px-3 py-2.5 [scrollbar-width:none]">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(s)}
                className="shrink-0 rounded-full border border-[#2b3158] bg-[#11152c] px-3 py-1 text-xs text-gray-200 transition-colors hover:border-[#16f2b3] hover:text-[#16f2b3] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-[#2b3158] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              ref={inputRef}
              aria-label="Ask the resume assistant"
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[#353a52] bg-[#10172d] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#16f2b3]"
              placeholder="e.g. Has she led a team?"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16f2b3] text-[#0d1224] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <IoSend size={17} />
            </button>
          </form>
        </div>
      )}

      {showNudge && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="chat-pop mb-3 max-w-[16rem] rounded-2xl rounded-br-sm border border-[#2b3158] bg-[#151b34] px-4 py-3 text-left text-sm text-gray-200 shadow-xl"
        >
          👋 Recruiter? Ask me anything about {firstName}&apos;s experience, skills or availability.
        </button>
      )}

      <button
        type="button"
        aria-label={isOpen ? "Close resume assistant" : "Open resume assistant"}
        onClick={() => setIsOpen((v) => !v)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-950/40 transition-transform hover:scale-105"
      >
        {!isOpen && messages.length === 0 && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-pink-500/40" />}
        {isOpen ? <IoClose size={24} /> : <BsRobot size={25} />}
      </button>
    </div>
  );
}
