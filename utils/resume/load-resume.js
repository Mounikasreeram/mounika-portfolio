// Server-only: loads + parses the resume PDF, re-parsing automatically when the file changes.
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { personalData } from "../data/personal-data.js";
import { parseResume } from "./parse-resume.js";

const RESUME_URL = personalData.resume || "/resume.pdf";
const REMOTE_TTL = 10 * 60 * 1000;

let cache = null; // { key, at, promise }

function remember(key, factory) {
  if (cache?.key === key) return cache.promise;
  const promise = factory().catch((err) => {
    if (cache?.promise === promise) cache = null;
    throw err;
  });
  cache = { key, at: Date.now(), promise };
  return promise;
}

/**
 * @param {string} [origin] request origin, used as a fallback when the file
 * is not on the server's disk (e.g. some serverless deployments).
 */
export async function loadResume(origin) {
  const file = path.join(process.cwd(), "public", RESUME_URL.replace(/^\//, ""));
  try {
    const info = await stat(file);
    return await remember(`fs:${info.mtimeMs}:${info.size}`, async () => parseResume(await readFile(file)));
  } catch (err) {
    if (!origin) throw err;
    if (cache?.key?.startsWith("url:") && Date.now() - cache.at < REMOTE_TTL) return cache.promise;
    return remember(`url:${Date.now()}`, async () => {
      const res = await fetch(new URL(RESUME_URL, origin), { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not download resume (${res.status})`);
      return parseResume(Buffer.from(await res.arrayBuffer()));
    });
  }
}

/** Same as loadResume but never throws — returns null so pages can fall back to static data. */
export async function loadResumeSafe(origin) {
  try {
    return await loadResume(origin);
  } catch (err) {
    console.error("[resume] failed to parse resume PDF:", err?.message);
    return null;
  }
}
