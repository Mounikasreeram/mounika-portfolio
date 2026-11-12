import { NextResponse } from "next/server";
import { achievements } from "@/utils/data/achievements";
import { projectsData } from "@/utils/data/projects-data";
import { answer, buildEngine, getWelcome } from "@/utils/resume/chat-engine";
import { loadResume } from "@/utils/resume/load-resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached = { resume: null, engine: null };

async function getEngine(request) {
  const resume = await loadResume(new URL(request.url).origin);
  if (cached.resume !== resume) {
    cached = {
      resume,
      engine: buildEngine(resume, {
        projects: projectsData,
        achievements: achievements.map(({ title, description }) => ({ title, description })),
      }),
    };
  }
  return cached.engine;
}

export async function GET(request) {
  try {
    return NextResponse.json(getWelcome(await getEngine(request)));
  } catch (err) {
    console.error("[chat] welcome failed:", err);
    return NextResponse.json({ error: "Resume unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || "").slice(0, 500);
    const lastEntity = typeof body?.lastEntity === "string" ? body.lastEntity : undefined;
    const engine = await getEngine(request);
    return NextResponse.json(answer(engine, message, { lastEntity }));
  } catch (err) {
    console.error("[chat] answer failed:", err);
    return NextResponse.json(
      { answer: "Sorry, I couldn't read the resume just now. Please try again in a moment.", suggestions: [] },
      { status: 500 }
    );
  }
}
