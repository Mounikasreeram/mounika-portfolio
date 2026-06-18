"use client";

import { personalData } from "@/utils/data/personal-data";
import { projectsData } from "@/utils/data/projects-data";
import { skillsData } from "@/utils/data/skills";
import { useMemo, useState } from "react";
import { BsRobot } from "react-icons/bs";
import { IoClose, IoSend } from "react-icons/io5";

const starters = [
  "What is Mounika's experience?",
  "Which skills does she use?",
  "Tell me about DEX WorkBench",
  "How can I contact her?",
];

function getReply(message) {
  const text = message.toLowerCase();

  if (text.includes("contact") || text.includes("email") || text.includes("phone")) {
    return `You can contact Mounika at ${personalData.gmail} or ${personalData.phone}. She is based in ${personalData.address}.`;
  }

  if (text.includes("resume") || text.includes("cv")) {
    return "Her resume is available through the Get Resume button on the page. It opens the PDF added to this portfolio.";
  }

  if (text.includes("skill") || text.includes("tech") || text.includes("stack")) {
    return `Her core skills include ${skillsData.slice(0, 12).join(", ")}. She also works with testing automation, design systems, accessibility, performance optimization, and CI/CD.`;
  }

  if (text.includes("project") || text.includes("dex") || text.includes("workbench")) {
    const project = projectsData[0];
    return `${project.name}: ${project.description}`;
  }

  if (text.includes("experience") || text.includes("work") || text.includes("altimetrik")) {
    return "Mounika is a Senior Frontend Engineer at Altimetrik with 6+ years of experience building scalable enterprise web applications, leading frontend delivery, mentoring engineers, and designing reusable component systems.";
  }

  if (text.includes("linkedin")) {
    return `You can view her LinkedIn profile here: ${personalData.linkedIn}`;
  }

  return "I can help with Mounika's experience, skills, projects, resume, and contact details. Try asking about her frontend work, DEX WorkBench, or design systems experience.";
}

export default function PortfolioChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I am Mounika's portfolio assistant. Ask me about her frontend experience, skills, projects, or contact details.",
    },
  ]);

  const visibleStarters = useMemo(() => starters.filter(Boolean), []);

  const sendMessage = (value = input) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: cleanValue },
      { role: "assistant", content: getReply(cleanValue) },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {isOpen && (
        <div className="mb-3 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-[#2b3158] bg-[#0d1224] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-[#2b3158] bg-[#11152c] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BsRobot className="text-[#16f2b3]" size={20} />
              Portfolio Assistant
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-gray-300 transition-colors hover:bg-[#1a2142] hover:text-white"
            >
              <IoClose size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-gradient-to-r from-pink-500 to-violet-600 text-white"
                    : "bg-[#151b34] text-gray-100"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#2b3158] px-4 py-3">
            {visibleStarters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => sendMessage(starter)}
                className="rounded-full border border-[#2b3158] px-3 py-1 text-xs text-gray-200 transition-colors hover:border-[#16f2b3] hover:text-[#16f2b3]"
              >
                {starter}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-[#2b3158] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              aria-label="Ask the portfolio assistant"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-[#353a52] bg-[#10172d] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#16f2b3]"
              placeholder="Ask about Mounika..."
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-[#16f2b3] text-[#0d1224] transition-transform hover:scale-105"
            >
              <IoSend size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label="Open portfolio assistant"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-950/40 transition-transform hover:scale-105"
      >
        <BsRobot size={25} />
      </button>
    </div>
  );
}
