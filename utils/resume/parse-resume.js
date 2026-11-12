// Turns a resume PDF into structured, searchable data.
// Works off font + position information so it adapts when the PDF is replaced.
import { getDocumentProxy } from "unpdf";

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE = `(?:${MONTH}\\s+)?\\d{4}`;
const DATE_RANGE = new RegExp(`(${DATE})\\s*[–—-]\\s*(${DATE}|present|current|now|today)`, "i");
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const SECTION_TYPES = [
  { type: "summary", title: "Professional Profile", test: /PROFILE|SUMMARY|ABOUT|OBJECTIVE/ },
  { type: "skills", title: "Technical Skills", test: /SKILL|TECHNOLOG|COMPETENC|EXPERTISE/ },
  { type: "experience", title: "Professional Experience", test: /EXPERIENCE|EMPLOYMENT|WORKHISTORY|CAREER/ },
  { type: "projects", title: "Personal Projects", test: /PROJECT/ },
  { type: "education", title: "Education", test: /EDUCATION|ACADEMIC|QUALIFICATION/ },
  { type: "certifications", title: "Certifications & Awards", test: /CERTIF|AWARD|ACHIEVEMENT|HONOU|LICEN/ },
];

const clean = (s) =>
  s
    .replace(/\s*\|+\s*$/g, "")
    .replace(/\s*\|+\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();

function parseDate(str, end = false) {
  if (!str) return null;
  if (/present|current|now|today/i.test(str)) return new Date();
  const year = Number(str.match(/\d{4}/)?.[0]);
  const m = MONTHS.indexOf(str.slice(0, 3).toLowerCase());
  return new Date(year, m >= 0 ? m : end ? 11 : 0, 1);
}

export function formatDuration(from, to) {
  const a = parseDate(from);
  const b = parseDate(to, true);
  if (!a || !b) return "";
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, m && `${m} mo${m > 1 ? "s" : ""}`].filter(Boolean).join(" ");
}

async function extractRows(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const rows = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const { items } = await page.getTextContent();
    const pageRows = [];
    for (const it of items) {
      if (!it.str) continue;
      const y = it.transform[5];
      let row = pageRows.find((r) => Math.abs(r.y - y) <= 2);
      if (!row) {
        row = { y, page: p, items: [] };
        pageRows.push(row);
      }
      row.items.push({
        x: it.transform[4],
        w: it.width,
        h: it.height || Math.abs(it.transform[3]),
        str: it.str,
        font: it.fontName,
      });
    }
    pageRows.sort((a, b) => b.y - a.y);
    rows.push(...pageRows);
  }
  return { rows, pages: pdf.numPages };
}

function buildLine(row) {
  row.items.sort((a, b) => a.x - b.x);
  let text = "";
  let prev = null;
  for (const it of row.items) {
    const gap = prev ? it.x - (prev.x + prev.w) : 0;
    if (prev && gap > 1.5 && !text.endsWith(" ") && !it.str.startsWith(" ")) text += " ";
    text += it.str;
    prev = it;
  }
  const solid = row.items.filter((i) => i.str.trim());
  const first = solid[0] || row.items[0];
  // A leading run in one font followed by text in another font = "Label: value" row.
  let run = 0;
  while (run < solid.length && solid[run].font === first.font) run++;
  const lead = solid.slice(0, run).map((i) => i.str).join("").trim();
  const label = run < solid.length && lead.length < 40 ? lead : null;
  return {
    page: row.page,
    y: row.y,
    raw: solid,
    text: clean(text),
    font: first.font,
    size: Math.max(...row.items.map((i) => i.h)),
    right: Math.max(...row.items.map((i) => i.x + i.w)),
    label,
  };
}

function sectionOf(line) {
  const compact = line.text.replace(/\s+/g, "");
  if (compact.length < 4 || compact.length > 45 || !/^[A-Z&/,-]+$/.test(compact)) return null;
  const known = SECTION_TYPES.find((s) => s.test.test(compact));
  return known ? { ...known } : { type: "other", title: compact[0] + compact.slice(1).toLowerCase() };
}

export async function parseResume(buffer) {
  const { rows, pages } = await extractRows(buffer);
  const lines = rows.map(buildLine).filter((l) => l.text);

  // Most common font by characters = body font (font ids are per page in PDFs).
  const fontChars = {};
  for (const l of lines)
    for (const i of l.raw) {
      const k = `${l.page}|${i.font}`;
      fontChars[k] = (fontChars[k] || 0) + i.str.length;
    }
  const bodyFont = {};
  for (const [k, n] of Object.entries(fontChars)) {
    const [page, font] = k.split("|");
    if (!bodyFont[page] || n > fontChars[`${page}|${bodyFont[page]}`]) bodyFont[page] = font;
  }
  for (const l of lines) l.body = l.font === bodyFont[l.page];
  const bodySize = lines.find((l) => l.body)?.size || 10;
  const maxRight = {};
  for (const l of lines) maxRight[l.page] = Math.max(maxRight[l.page] || 0, l.right);

  // Split into header + sections.
  const header = [];
  const sections = [];
  let current = null;
  for (const line of lines) {
    const sec = sectionOf(line);
    if (sec && header.length) {
      current = { ...sec, lines: [] };
      delete current.test;
      sections.push(current);
      continue;
    }
    const m = line.text.match(DATE_RANGE);
    if (m) {
      line.date = { from: m[1], to: m[2], text: `${m[1]} – ${m[2]}` };
      line.text = clean(line.text.replace(m[0], " "));
    }
    (current ? current.lines : header).push(line);
  }

  // Merge lines that were wrapped by the PDF layout.
  const isSub = (l) => !l.body && / [—–-] /.test(l.text);
  const mergeWrapped = (arr) => {
    const out = [];
    for (const l of arr) {
      const p = out[out.length - 1];
      const startsLow = /^[a-z0-9(]/.test(l.text);
      const nearEdge = p && p.right >= maxRight[p.page] - 45;
      if (
        p &&
        !p.date &&
        !l.date &&
        !/[.!?:]$/.test(p.text) &&
        p.size <= bodySize * 1.2 &&
        l.size <= bodySize * 1.2 &&
        (startsLow || (nearEdge && !isSub(p)) || (p.label && !l.label && l.body && !isSub(p)))
      ) {
        p.text = clean(`${p.text} ${l.text}`);
        p.right = l.right;
        p.page = l.page;
        continue;
      }
      out.push({ ...l });
    }
    return out;
  };

  // ---------- Header ----------
  const [nameLine, ...headerRest] = header;
  const highlights = [];
  const headerLines = [];
  for (let i = 0; i < headerRest.length; i++) {
    const l = headerRest[i];
    const next = headerRest[i + 1];
    if (l.size >= bodySize * 1.35 && next && l.raw.length >= 2 && l.raw.length === next.raw.length) {
      l.raw.forEach((it, idx) => highlights.push({ value: it.str.trim(), label: next.raw[idx].str.trim() }));
      i++;
      continue;
    }
    headerLines.push(l);
  }
  const merged = mergeWrapped(headerLines).map((l) => l.text);
  const headline = merged[0] || "";
  const contact = merged.slice(1);
  const emailMatch = contact.join(" ").match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = contact.join(" ").match(/\+?\d[\d\s()-]{8,}\d/);
  const linkedinMatch = contact.join(" ").match(/linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = contact.join(" ").match(/portfolio:\s*([\w.-]+\.[a-z]{2,}[\w/.-]*)/i);
  const authorization = contact.find((c) => /right to work|visa|sponsor|authori[sz]|permit|citizen/i.test(c)) || "";
  const locationLine = contact.find((c) => !/^(linkedin|github|portfolio)|right to work/i.test(c)) || "";
  const location = locationLine.split(/\s*\|\s*|\s+\+?\d[\d\s()-]{7,}|\s+[\w.+-]+@/)[0].trim();

  // ---------- Sections ----------
  const parsed = { summary: [], skills: [], experience: [], projects: [], education: [], certifications: [], other: [] };
  const sectionTitles = {};

  for (const sec of sections) {
    sectionTitles[sec.type] = sec.title;
    const ls = mergeWrapped(sec.lines);

    if (sec.type === "summary") {
      parsed.summary.push(...ls.map((l) => l.text));
    } else if (sec.type === "skills") {
      for (const l of ls) {
        if (l.label && l.text.startsWith(l.label)) {
          parsed.skills.push({ category: l.label.replace(/:$/, ""), items: splitList(l.text.slice(l.label.length)) });
        } else {
          parsed.skills.push({ category: "", items: splitList(l.text) });
        }
      }
    } else if (sec.type === "experience" || sec.type === "projects") {
      const target = parsed[sec.type];
      let role = null;
      let project = null;
      for (const l of ls) {
        const isNote = l.date && /^[:(]|\.$/.test(l.text);
        if (l.date && !isNote) {
          const [title, org = ""] = l.text.split(/\s+[—–]\s+|\s+at\s+/);
          role = { title: title.trim(), org: org.trim(), dates: l.date, meta: [], bullets: [], projects: [], notes: [] };
          project = null;
          target.push(role);
        } else if (isNote) {
          (role ? role.notes : parsed.other).push(`${l.date.text}${l.text.startsWith(":") ? "" : " "}${l.text}`);
        } else if (!l.body && !/\.$/.test(l.text)) {
          const [name, ...metaParts] = l.text.split(/\s+·\s+/);
          if (role && sec.type === "experience") {
            project = { name: name.trim(), meta: metaParts, bullets: [] };
            role.projects.push(project);
          } else {
            // A standalone project entry (e.g. under "Personal Project").
            const [title, org = ""] = name.split(/\s+[—–]\s+/);
            role = { title: title.trim(), org: org.trim(), dates: null, meta: metaParts, bullets: [], projects: [], notes: [], isProject: true };
            project = null;
            target.push(role);
          }
        } else if (!/\.$/.test(l.text) && role && !project && role.bullets.length === 0) {
          role.meta.push(l.text);
        } else if (project) {
          project.bullets.push(l.text);
        } else if (role) {
          role.bullets.push(l.text);
        }
      }
    } else if (sec.type === "education") {
      for (const l of ls) {
        const [degree, rest = ""] = l.text.split(/\s+[—–]\s+/);
        const score = rest.match(/(\d{1,3}(?:\.\d+)?\s*%|\d(?:\.\d+)?\s*\/\s*10|cgpa[:\s]*[\d.]+|gpa[:\s]*[\d.]+)/i)?.[0] || "";
        const institution = rest.replace(score, "").replace(/\s*·\s*$/, "").trim();
        parsed.education.push({ degree: degree.trim(), institution, score: score.replace(/\s/g, ""), dates: l.date || null, text: l.text });
      }
    } else if (sec.type === "certifications") {
      for (const l of ls) {
        const m = l.text.match(/^([^:]{2,40}):\s*(.+)$/);
        if (m) parsed.certifications.push({ category: m[1].trim(), items: m[2].split(/\s*;\s*/).filter(Boolean) });
        else parsed.certifications.push({ category: "", items: [l.text] });
      }
    } else {
      parsed.other.push(...ls.map((l) => `${sec.title}: ${l.text}`));
    }
  }

  return {
    pages,
    name: nameLine?.text || "",
    headline,
    contact: {
      lines: contact,
      email: emailMatch?.[0] || "",
      phone: phoneMatch?.[0]?.trim() || "",
      linkedin: linkedinMatch ? `https://www.${linkedinMatch[0]}` : "",
      portfolio: portfolioMatch ? `https://${portfolioMatch[1]}` : "",
      location,
    },
    authorization,
    highlights,
    sectionTitles,
    ...parsed,
  };
}

function splitList(str) {
  // Split on commas / middots, but not commas inside parentheses.
  const out = [];
  let depth = 0;
  let buf = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if ((ch === "," || ch === "·") && depth === 0) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  // Re-join phrases split on an adjective comma, e.g. "architecture for fast, maintainable apps".
  return out.reduce((acc, item) => {
    const prev = acc[acc.length - 1];
    if (prev && /\b(for|with|of|to|in|and)\s+\w+$/i.test(prev) && /^[a-z]/.test(item)) acc[acc.length - 1] = `${prev}, ${item}`;
    else acc.push(item);
    return acc;
  }, []);
}
