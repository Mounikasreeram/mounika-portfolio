// A free, local question-answering engine over the parsed resume.
// No external AI service: intent rules + BM25 keyword retrieval with synonyms.
import { formatDuration } from "./parse-resume.js";

// ---------------------------------------------------------------- text utils

const PHRASES = [
  [/\breact\.?js\b/g, "react"],
  [/\bnext\.?\s?js\b/g, "nextjs"],
  [/\bnode\.?\s?js\b|\bnode\b/g, "nodejs"],
  [/\bci\s*\/\s*cd\b|\bci-cd\b/g, "cicd"],
  [/\bag[\s-]?grid\b/g, "aggrid"],
  [/\bmaterial[\s-]?ui\b|\bmui\b/g, "mui"],
  [/\bant[\s-]?design\b|\bantd\b/g, "antd"],
  [/\breact testing library\b|\brtl\b/g, "rtl"],
  [/\bweb[\s-]?components?\b/g, "webcomponents"],
  [/\bstencil(\s?js)?\b/g, "stenciljs"],
  [/\bredux[\s-]?toolkit\b|\brtk\b/g, "redux reduxtoolkit"],
  [/\bend[\s-]to[\s-]end\b|\be2e\b/g, "e2e"],
  [/\btype\s?script\b|\bts\b/g, "typescript"],
  [/\bjava\s?script\b|\bjs\b|\bes6\+?/g, "javascript"],
  [/\bhtml5?\b/g, "html"],
  [/\bcss3?\b/g, "css"],
  [/\bgithub copilot\b|\bcopilot\b/g, "copilot"],
  [/\bclaude code\b/g, "claude"],
  [/\bopenai codex\b|\bcodex\b/g, "codex"],
  [/\bgoogle maps?\b/g, "googlemaps"],
  [/\bdesign[\s-]systems?\b/g, "designsystem"],
  [/\bcode[\s-]splitting\b/g, "codesplitting"],
  [/\blazy[\s-]loading\b/g, "lazyloading"],
  [/\brole[\s-]based( access)?\b|\brbac\b/g, "rbac"],
  [/\bm\.\s?tech\b|\bmtech\b|\bmasters?\b|\bpost\s?graduat\w*/g, "mtech"],
  [/\bb\.\s?tech\b|\bbtech\b|\bbachelors?\b|\bundergrad\w*/g, "btech"],
  [/\bdata[\s-]visuali[sz]ation\b|\bvisuali[sz]\w*/g, "dataviz"],
  [/\boptimi[sz]\w*/g, "optimise"],
  [/\bwcag\b|\ba11y\b/g, "accessibility"],
  [/\bapp store\b/g, "appstore"],
  [/\bpre[\s-]?bgv\b/g, "prebgv"],
  [/\bco[\s-]?pilot\b/g, "copilot"],
];

const STOP = new Set(
  `a an the and or but if of to in on at for with by from as is are was were be been being do does did doing has have had having
  i me my we our you your he him his she her hers they them their it its this that these those there here what which who whom whose
  when where why how can could would should will shall may might must about into over under again further then once more most
  some any all each other such only own same so than too very just also not no yes please tell show give know let lets want need
  mounika sreeram mounika's candidate person someone anything something ok okay hey hi hello`.split(/\s+/)
);

function normalize(text) {
  let s = ` ${String(text).toLowerCase().replace(/[’']s\b/g, "")} `;
  for (const [re, rep] of PHRASES) s = s.replace(re, ` ${rep} `);
  return s;
}

function stem(w) {
  if (w.length <= 4 || /\d/.test(w)) return w;
  if (w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.endsWith("ing") && w.length > 6) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 5) w = w.slice(0, -2);
  else if (/(ss|sh|ch|x)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.endsWith("e") && w.length > 5) w = w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9+#%]+/)
    .filter((w) => w && w.length > 1 && !STOP.has(w))
    .map(stem);
}

// Query-side expansions (keys/values are pre-stem words).
const EXPANSIONS = {
  lead: ["led", "lead", "mentor", "team", "review"],
  leader: ["led", "lead", "mentor", "team"],
  leadership: ["led", "lead", "mentor", "team", "leadership"],
  manage: ["led", "lead", "mentor", "team", "coordinated"],
  manager: ["led", "lead", "mentor", "team"],
  mentor: ["mentor", "review", "led"],
  team: ["team", "led"],
  test: ["test", "testing", "coverage", "jest", "vitest", "cypress", "rtl", "msw"],
  testing: ["test", "testing", "coverage", "jest", "vitest", "cypress", "rtl", "msw"],
  qa: ["test", "coverage", "quality"],
  quality: ["quality", "test", "coverage", "review"],
  unit: ["test", "jest", "vitest"],
  automation: ["automated", "test", "e2e"],
  e2e: ["e2e", "cypress"],
  performance: ["performance", "lazyloading", "codesplitting", "optimise"],
  speed: ["performance", "lazyloading", "codesplitting"],
  fast: ["performance", "lazyloading", "codesplitting"],
  optimise: ["optimise", "performance", "lazyloading", "codesplitting"],
  accessibility: ["accessibility"],
  cicd: ["cicd", "jenkins", "pipelines", "vercel"],
  devops: ["cicd", "jenkins", "pipelines", "deployment"],
  pipeline: ["cicd", "jenkins", "pipelines"],
  deploy: ["deployed", "deployment", "vercel", "appstore", "cicd"],
  deployment: ["deployed", "deployment", "vercel", "appstore", "cicd"],
  state: ["redux", "reduxtoolkit", "state"],
  designsystem: ["designsystem", "stenciljs", "webcomponents", "component", "morph"],
  component: ["component", "reusable", "designsystem"],
  library: ["library", "component", "designsystem"],
  design: ["design", "figma", "designsystem"],
  figma: ["figma", "design"],
  ux: ["figma", "design", "user"],
  ui: ["ui", "responsive", "component"],
  dashboard: ["dashboard", "recharts", "dataviz"],
  chart: ["recharts", "dataviz", "dashboard"],
  dataviz: ["dataviz", "recharts", "dashboard"],
  api: ["api", "rest", "oidc", "integration"],
  backend: ["nodejs", "backend", "api"],
  auth: ["oidc", "authentication", "secure", "rbac"],
  authentication: ["oidc", "authentication", "secure"],
  security: ["oidc", "secure", "cybersecurity", "rbac"],
  secure: ["oidc", "secure", "authentication"],
  ai: ["ai", "copilot", "claude", "gemini", "codex", "generative"],
  genai: ["ai", "generative", "copilot", "claude", "gemini", "codex"],
  agile: ["agile", "scrum", "sprint"],
  scrum: ["agile", "scrum", "sprint"],
  mobile: ["ios", "appstore", "responsive"],
  ios: ["ios", "appstore"],
  responsive: ["responsive"],
  bank: ["citi", "trading", "positions", "custody"],
  banking: ["citi", "trading", "positions", "custody"],
  finance: ["citi", "trading", "payment", "custody"],
  fintech: ["citi", "trading", "payment", "custody"],
  trading: ["trading", "positions", "citi"],
  payment: ["payment", "intuit", "ngp"],
  insurance: ["insurance", "cna"],
  healthcare: ["healthcare", "sahatty"],
  health: ["healthcare", "sahatty"],
  grid: ["aggrid", "filtering", "grouping", "pagination"],
  table: ["aggrid", "filtering", "grouping", "pagination"],
  stakeholder: ["stakeholder", "client", "product", "architects"],
  communication: ["communication", "stakeholder", "client"],
  client: ["client", "stakeholder"],
  architecture: ["architecture", "architected", "designed", "reusable"],
  architect: ["architecture", "architected", "designed"],
  scale: ["enterprise", "scalable", "5,000+", "20+"],
  enterprise: ["enterprise", "scalable"],
  impact: ["5,000+", "20+", "25+", "coverage", "improved"],
  achievement: ["award", "5,000+", "20+", "improved"],
  hr: ["staffing", "workforce", "interview", "allocation"],
  workforce: ["workforce", "staffing", "allocation"],
  map: ["googlemaps", "address"],
};

const KNOWN_TECH = {
  vue: "Vue.js", vuejs: "Vue.js", angular: "Angular", svelte: "Svelte", solid: "SolidJS", ember: "Ember",
  python: "Python", java: "Java", kotlin: "Kotlin", swift: "Swift", go: "Go", golang: "Go", rust: "Rust",
  php: "PHP", ruby: "Ruby", rail: "Rails", django: "Django", flask: "Flask", spring: "Spring", dotnet: ".NET",
  "c#": "C#", "c++": "C++", flutter: "Flutter", "react native": "React Native", reactnative: "React Native",
  graphql: "GraphQL", apollo: "Apollo", aws: "AWS", azure: "Azure", gcp: "Google Cloud", docker: "Docker",
  kubernete: "Kubernetes", k8: "Kubernetes", terraform: "Terraform", tailwind: "Tailwind CSS", tailwindcss: "Tailwind CSS",
  storybook: "Storybook", playwright: "Playwright", selenium: "Selenium", mocha: "Mocha", chai: "Chai",
  sql: "SQL", mysql: "MySQL", postgr: "PostgreSQL", postgresql: "PostgreSQL", mongodb: "MongoDB", mongo: "MongoDB",
  firebase: "Firebase", redi: "Redis", kafka: "Kafka", jquery: "jQuery", sass: "Sass", less: "Less",
  zustand: "Zustand", mobx: "MobX", rxj: "RxJS", "react query": "React Query", tanstack: "TanStack",
  remix: "Remix", gatsby: "Gatsby", astro: "Astro", nuxt: "Nuxt", express: "Express", nestj: "NestJS",
  jira: "Jira", confluence: "Confluence", github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket",
  sonar: "SonarQube", sonarqube: "SonarQube", microfrontend: "Micro-frontends", "micro frontend": "Micro-frontends",
  pwa: "PWAs", websocket: "WebSockets", threej: "Three.js", d3: "D3.js", highchart: "Highcharts",
};
const RELATED = {
  "Vue.js": "React.js / Next.js", Angular: "React.js / Next.js and Web Components (StencilJS)", Svelte: "React.js",
  Python: "JavaScript/TypeScript and Node.js (working knowledge)", Java: "TypeScript and Node.js (working knowledge)",
  "Tailwind CSS": "SCSS, Material UI, Ant Design and Bootstrap", Storybook: "building a React documentation site for the MORPH design system",
  Playwright: "Cypress end-to-end testing", Selenium: "Cypress end-to-end testing", GraphQL: "REST API integration (OIDC-secured)",
  AWS: "CI/CD with Jenkins and deployments on Vercel", Azure: "CI/CD with Jenkins and Vercel", Docker: "CI/CD with Jenkins",
  Kubernetes: "CI/CD with Jenkins", "React Native": "React.js and iOS app delivery (SAHATTY)", Flutter: "iOS app delivery (SAHATTY)",
  Zustand: "Redux Toolkit", MobX: "Redux Toolkit", "React Query": "Redux Toolkit and REST API integration",
  "Micro-frontends": "Web Components (StencilJS) and reusable frontend architecture", "D3.js": "Recharts data visualisation",
  Highcharts: "Recharts data visualisation", Sass: "SCSS", Express: "Node.js (working knowledge)",
  GitHub: "Git and GitHub Copilot", Jira: "Agile/Scrum delivery",
};

// ---------------------------------------------------------------- index

function bm25Index(docs) {
  const N = docs.length;
  const df = {};
  let total = 0;
  for (const d of docs) {
    d.tf = {};
    for (const t of d.tokens) d.tf[t] = (d.tf[t] || 0) + 1;
    for (const t of Object.keys(d.tf)) df[t] = (df[t] || 0) + 1;
    total += d.tokens.length;
  }
  const avg = total / Math.max(N, 1);
  const idf = (t) => Math.log(1 + (N - (df[t] || 0) + 0.5) / ((df[t] || 0) + 0.5));
  const score = (d, terms) => {
    let s = 0;
    for (const [t, w] of terms) {
      const f = d.tf[t];
      if (!f) continue;
      s += w * idf(t) * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.tokens.length / avg))));
    }
    return s;
  };
  return { df, score };
}

const ACRONYM = (s) =>
  s
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("")
    .toLowerCase();

const GENERIC_ALIAS = new Set(
  ["frontend", "engineer", "senior", "lead", "developer", "develop", "application", "assistant", "team", "platform", "portal",
    "website", "project", "react", "employe", "used", "adopt", "user", "live", "site", "source", "code", "github", "frontend)", "engin"].map(stem)
);

const capsWords = (text) =>
  (text.match(/\b([A-Z]{2,}[A-Za-z]*|[A-Z][a-z]+[A-Z]\w*)\b/g) || []).filter(
    (w) => !/^(API|APIs|REST|OIDC|MSW|CEO|COO|CI|CD|UI|UX|HTML|CSS|SCSS|AG|JS|ES6|WCAG|MUI|RBAC|iOS)$/.test(w)
  );

export function buildEngine(resume, extras = {}) {
  const docs = [];
  const add = (text, section, context = "", entity = null, weight = 1) => {
    if (!text) return;
    docs.push({ text, section, context, entity, weight, tokens: [...tokenize(text), ...tokenize(context)] });
  };

  // entities (roles / projects) for "tell me about X" questions
  const entities = [];
  const addEntity = (e, aliasSources) => {
    const aliases = {};
    for (const [text, w] of aliasSources) {
      for (const t of tokenize(text)) if (!GENERIC_ALIAS.has(t)) aliases[t] = Math.max(aliases[t] || 0, w);
      const ac = ACRONYM(text);
      if (ac.length >= 3 && text.split(/\s+/).length >= 3) aliases[ac] = Math.max(aliases[ac] || 0, w);
    }
    e.aliases = aliases;
    entities.push(e);
    return e;
  };

  (resume.summary || []).forEach((p) => p.split(/(?<=\.)\s+(?=[A-Z])/).forEach((s) => add(s, "summary", "Profile")));
  (resume.highlights || []).forEach((h) => add(`${h.value} ${h.label}`, "highlights", "Highlights"));
  if (resume.authorization) add(resume.authorization, "authorization", "Work authorisation");
  (resume.contact?.lines || []).forEach((l) => add(l, "contact", "Contact"));
  (resume.skills || []).forEach((s) => add(`${s.category}: ${s.items.join(", ")}`, "skills", "Technical skills"));

  (resume.experience || []).forEach((role, i) => {
    const roleLabel = [role.title, role.org].filter(Boolean).join(" — ");
    const roleEntity = addEntity(
      { id: `role-${i}`, kind: "role", role, label: roleLabel },
      [
        [role.org, 1],
        ...role.meta.map((m) => [m.replace(/^[^:]*:/, " "), 0.5]),
        ...role.bullets.flatMap((b) => capsWords(b).map((w) => [w, 0.6])),
      ]
    );
    role.meta.forEach((m) => add(m, "experience", roleLabel, roleEntity.id));
    role.bullets.forEach((b) => add(b, "experience", roleLabel, roleEntity.id));
    role.notes.forEach((n) => add(n, "experience", "Career note", roleEntity.id));
    role.projects.forEach((p, j) => {
      const e = addEntity({ id: `proj-${i}-${j}`, kind: "project", project: p, role, label: p.name }, [[p.name, 1]]);
      add(`${p.name} · ${p.meta.join(" · ")}`, "experience", roleLabel, e.id, 0.8);
      p.bullets.forEach((b) => add(b, "experience", `${p.name} (${role.org})`, e.id));
    });
  });

  (resume.projects || []).forEach((p, i) => {
    const e = addEntity({ id: `pp-${i}`, kind: "personal", project: p, label: p.title }, [[p.title, 1]]);
    p.bullets.forEach((b) => add(b, "projects", `${p.title} (personal project)`, e.id));
  });

  (resume.education || []).forEach((ed) => add(`${ed.text} ${ed.dates?.text || ""}`, "education", "Education"));
  (resume.certifications || []).forEach((c) =>
    c.items.forEach((it) => add(it, /award/i.test(c.category) ? "awards" : "certifications", c.category || "Certifications"))
  );
  (resume.other || []).forEach((o) => add(o, "other", "Other"));

  // Extra portfolio data (site project descriptions + awards detail)
  for (const sp of extras.projects || []) {
    const nameTokens = tokenize(sp.name).filter((t) => !GENERIC_ALIAS.has(t));
    const owner = entities.find(
      (e) => nameTokens.length && nameTokens.filter((t) => e.aliases[t]).length >= Math.ceil(nameTokens.length / 2)
    );
    if (owner) {
      owner.tools = sp.tools;
      owner.url = sp.url;
      owner.siteDescription = sp.description;
      add(sp.description, "site", owner.label, owner.id, 0.6);
      continue;
    }
    const e = addEntity({ id: `site-${sp.id}`, kind: "site", site: sp, label: sp.name, tools: sp.tools, url: sp.url }, [[sp.name, 1]]);
    add(sp.description, "site", `${sp.name} (${sp.company})`, e.id, 0.9);
  }
  for (const a of extras.achievements || []) add(`${a.title}: ${a.description}`, "awards", "Awards", null, 0.9);

  const index = bm25Index(docs);

  // display names for skills, keyed by token
  const skillNames = {};
  for (const s of resume.skills || [])
    for (const item of s.items) {
      const toks = tokenize(item.replace(/\(.*?\)/g, ""));
      if (toks.length) skillNames[toks.join(" ")] = { name: item, category: s.category };
      if (toks.length === 1 || toks.length === 2) for (const t of toks) skillNames[t] ||= { name: item, category: s.category };
    }

  const skillCategories = {};
  for (const s of resume.skills || []) if (s.category) skillCategories[tokenize(s.category).join(" ")] = s;

  const awardNotes = (extras.achievements || []).map((a) => ({ toks: tokenize(a.title), description: a.description }));

  return { resume, docs, entities, index, skillNames, skillCategories, awardNotes };
}

// ---------------------------------------------------------------- helpers

const first = (name) => (name ? name.split(/\s+/)[0].replace(/^./, (c) => c.toUpperCase()).replace(/(?<=.)\S+/, (s) => s.toLowerCase()) : "She");
const bullets = (arr) => arr.filter(Boolean).map((l) => `- ${l}`).join("\n");

function search(engine, query, { filter, limit = 5, extraTerms = [] } = {}) {
  const terms = new Map();
  const words = normalize(query)
    .split(/[^a-z0-9+#%]+/)
    .filter((w) => w && !STOP.has(w));
  for (const w of words) {
    const t = stem(w);
    terms.set(t, Math.max(terms.get(t) || 0, 1));
    for (const x of EXPANSIONS[w] || EXPANSIONS[t] || []) {
      const st = stem(x);
      if (!terms.has(st)) terms.set(st, 0.45);
    }
  }
  for (const t of extraTerms) if (!terms.has(t)) terms.set(t, 0.6);
  const scored = engine.docs
    .filter((d) => !filter || filter(d))
    .map((d) => ({ d, s: engine.index.score(d, terms) * d.weight }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return [];
  const top = scored[0].s;
  const seen = new Set();
  return scored
    .filter((x) => x.s >= top * 0.4)
    .filter((x) => (seen.has(x.d.text) ? false : seen.add(x.d.text)))
    .slice(0, limit);
}

function groupByContext(hits) {
  const groups = new Map();
  for (const { d } of hits) {
    const key = d.context || "Resume";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d.text);
  }
  return [...groups.entries()].map(([ctx, lines]) => `**${ctx}**\n${bullets(lines)}`).join("\n\n");
}

function matchEntity(engine, q) {
  const toks = new Set(tokenize(q));
  // count how many entities each alias belongs to (rarer = stronger)
  const owners = {};
  for (const e of engine.entities) for (const t of Object.keys(e.aliases)) owners[t] = (owners[t] || 0) + 1;
  let best = null;
  for (const e of engine.entities) {
    let s = 0;
    for (const t of toks) if (e.aliases[t]) s += e.aliases[t] / owners[t];
    if (!s) continue;
    const rank = { role: 3, project: 2, personal: 2, site: 1 }[e.kind];
    if (!best || s > best.s + 1e-9 || (Math.abs(s - best.s) < 1e-9 && rank > best.rank)) best = { e, s, rank };
  }
  return best && best.s >= 0.5 ? best.e : null;
}

function describeEntity(engine, e, focusQuery) {
  const name = first(engine.resume.name);
  if (focusQuery) {
    const hits = search(engine, focusQuery, { filter: (d) => d.entity === e.id || d.entity?.startsWith(`${e.id}-`), limit: 4 });
    const focusToks = tokenize(focusQuery).filter((t) => !e.aliases[t]);
    if (hits.length && focusToks.length) return `**${e.label}**\n${bullets(hits.map((h) => h.d.text))}`;
  }
  if (e.kind === "role") {
    const r = e.role;
    const dur = r.dates ? formatDuration(r.dates.from, r.dates.to) : "";
    const parts = [`**${r.title}** at **${r.org}**${r.dates ? ` · ${r.dates.text}${dur ? ` (${dur})` : ""}` : ""}`];
    if (r.meta.length) parts.push(r.meta.join(" · "));
    if (r.projects.length) {
      parts.push(`Key work at ${r.org}:`);
      parts.push(bullets(r.projects.map((p) => `**${p.name}**${p.meta.length ? ` (${p.meta.join(", ")})` : ""}: ${p.bullets[0] || ""}`)));
      parts.push(`Ask me about any of these projects for the full details.`);
    }
    if (r.bullets.length) parts.push(bullets(r.bullets));
    if (r.notes.length) parts.push(`_${r.notes.join(" ")}_`);
    return parts.join("\n\n");
  }
  if (e.kind === "project") {
    const p = e.project;
    const parts = [
      `**${p.name}**${p.meta.length ? ` · ${p.meta.join(" · ")}` : ""}`,
      `${name} worked on this as **${e.role.title}** at **${e.role.org}** (${e.role.dates?.text || ""}).`,
      bullets(p.bullets),
    ];
    if (e.tools?.length) parts.push(`**Tech used:** ${e.tools.join(", ")}`);
    return parts.join("\n\n");
  }
  if (e.kind === "personal") {
    const p = e.project;
    return [`**${p.title}**${p.org ? ` · ${p.org}` : ""} (personal project)`, bullets(p.bullets)].join("\n\n");
  }
  const sp = e.site;
  return [
    `**${sp.name}** · ${sp.company}`,
    sp.description,
    sp.role && `**Role:** ${sp.role}`,
    sp.tools?.length && `**Tech used:** ${sp.tools.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function skillsOverview(engine) {
  const rows = engine.resume.skills || [];
  return `Here's ${first(engine.resume.name)}'s technical toolkit:\n\n${bullets(rows.map((s) => `**${s.category || "Skills"}:** ${s.items.join(", ")}`))}`;
}

function experienceTimeline(engine) {
  const r = engine.resume;
  const lines = (r.experience || []).map((x) => {
    const dur = x.dates ? formatDuration(x.dates.from, x.dates.to) : "";
    const extra = x.meta.length ? ` · ${x.meta.join(" · ")}` : "";
    return `**${x.title}** — ${x.org} · ${x.dates?.text || ""}${dur ? ` (${dur})` : ""}${extra}`;
  });
  const notes = (r.experience || []).flatMap((x) => x.notes);
  return `${bullets(lines)}${notes.length ? `\n\n_${notes.join(" ")}_` : ""}`;
}

function yearsLine(engine) {
  const s = (engine.resume.summary || []).join(" ");
  const m = s.match(/[^.]*\d+\+?\s*years?[^.]*\./i);
  if (m) return m[0].trim();
  const h = (engine.resume.highlights || []).find((x) => /year/i.test(x.label));
  return h ? `${h.value} ${h.label}.` : "";
}

const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const SUGGEST = {
  default: [
    "What's her tech stack?",
    "Tell me about DEX WorkBench",
    "Has she led a team?",
    "Does she need visa sponsorship?",
    "What testing experience does she have?",
    "Tell me about the MORPH design system",
    "What did she build for Citi?",
    "What's her education?",
    "Why should we hire her?",
    "How many years of experience?",
    "Does she know Next.js?",
    "What awards has she won?",
  ],
};

// ---------------------------------------------------------------- answer

const has = (q, re) => re.test(q);

export function answer(engine, message, ctx = {}) {
  const r = engine.resume;
  const name = first(r.name);
  const fullName = r.name ? r.name.replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase()) : "the candidate";
  const q = ` ${String(message || "").toLowerCase().trim()} `;
  const wordCount = q.trim().split(/\s+/).filter(Boolean).length;
  const reply = (text, extra = {}) => ({
    answer: text,
    suggestions: pick(SUGGEST.default.filter((s) => s.toLowerCase() !== q.trim()), 3),
    ...extra,
  });

  if (!q.trim()) return reply(`Ask me anything about ${name}'s experience, skills, projects or availability.`);

  // small talk
  if (has(q, /^\s*(hi|hello|hey|hiya|yo|good (morning|afternoon|evening)|greetings)\b/) && wordCount <= 4)
    return reply(`Hi! 👋 I'm ${name}'s resume assistant. Ask me about her experience, skills, projects, education or availability.`);
  if (has(q, /\b(thanks|thank you|thx|cheers|appreciate)\b/) && wordCount <= 6)
    return reply(`You're welcome! If you'd like to talk to ${name} directly, email **${r.contact?.email}**.`);
  if (has(q, /\b(bye|goodbye|see you)\b/) && wordCount <= 4) return reply(`Thanks for stopping by! 👋`);
  if (has(q, /\b(who are you|what are you|are you (a bot|ai|human|real))\b/))
    return reply(`I'm an assistant that reads ${name}'s latest resume (the PDF on this site) and answers from it. No paid AI service — everything runs on this site.`);
  if (has(q, /\b(help|what can (i|you) ask|what (can|do) you (do|know))\b/))
    return reply(`I can answer questions from ${name}'s resume, for example:\n${bullets(["Experience, roles and dates", "Projects (DEX WorkBench, Citi CSL, MORPH…)", "Specific skills: “Does she know AG Grid?”", "Education, certifications and awards", "Right to work, location and availability", "Contact details"])}`);

  // contact
  if (has(q, /\b(contact|e-?mail|mail|phone|call|reach|number|linkedin|get in touch|connect|portfolio link)\b/)) {
    const c = r.contact || {};
    return reply(
      `You can reach ${name} here:\n${bullets([
        c.email && `**Email:** ${c.email}`,
        c.phone && `**Phone:** ${c.phone}`,
        c.linkedin && `**LinkedIn:** ${c.linkedin}`,
        c.location && `**Location:** ${c.location}`,
      ])}\n\nOr use the contact form at the bottom of this page.`,
      { intent: "contact" }
    );
  }

  // work authorisation / availability / location
  const asksAuth = has(q, /\b(visa|sponsor\w*|right to work|work permit|authori[sz]\w*|eligib\w*|citizen\w*|immigration|legally)\b/);
  const asksAvail = has(q, /\b(availab\w*|notice|start date|when can|how soon|join|immediate\w*|open to work|looking for (a )?(job|role|work|opportunit)|job search|free to)\b/);
  const asksLoc = has(q, /\b(where|location|located|based|lives?|relocat\w*|remote|hybrid|on-?site|office|commute|city|country)\b/) && !has(q, /\bwhere (has|did|does) she work/);
  if (asksAuth || asksAvail || asksLoc) {
    const parts = [];
    const auth = (r.authorization || "").split(/\s*·\s*/).filter(Boolean);
    if (asksAuth || asksAvail) parts.push(auth.length ? bullets(auth) : `Her resume doesn't state her work authorisation. Best to ask her directly.`);
    if (asksLoc || asksAuth) parts.push(`📍 Based in **${r.contact?.location || "the UK"}**.`);
    return reply(parts.join("\n\n"), { intent: "availability" });
  }

  if (has(q, /\b(salary|compensation|ctc|day rate|pay (range|expectation)|expected (pay|salary)|package)\b/))
    return reply(`Salary expectations aren't on ${name}'s resume. It's best to discuss them with her directly at **${r.contact?.email}**.`);

  if (has(q, /\b(resume|cv|download)\b/) && !has(q, /\b(in|on|from) (her|the) (resume|cv)\b/))
    return reply(`You can open or download ${name}'s resume using the **Get Resume** button at the top of this page. I answer from that same PDF, so feel free to ask me anything about it.`);

  // career gap
  if (has(q, /\b(gap|break|career break|between jobs)\b/)) {
    const notes = (r.experience || []).flatMap((x) => x.notes);
    if (notes.length) return reply(bullets(notes));
  }

  // education / certifications / awards
  if (has(q, /\b(educat\w*|degree|universit\w*|college|stud(y|ied)|qualification\w*|graduat\w*|masters?|bachelors?|m\.?\s?tech|b\.?\s?tech|cgpa|gpa|percentage|marks|academic\w*|cybersecurity|school)\b/)) {
    const lines = (r.education || []).map(
      (e) => `**${e.degree}** — ${e.institution}${e.score ? ` · ${e.score}` : ""}${e.dates ? ` · ${e.dates.text}` : ""}`
    );
    return reply(`${name}'s education:\n${bullets(lines)}`, { intent: "education" });
  }
  const asksCert = has(q, /\b(certif\w*|courses?|trainings?|licen[cs]es?)\b/);
  const asksAward = has(q, /\b(awards?|achievements?|recogni\w*|honou?rs?|accomplish\w*|prizes?)\b/);
  if (asksCert || asksAward) {
    const out = [];
    for (const c of r.certifications || []) {
      const isAward = /award/i.test(c.category);
      if ((isAward && asksAward) || (!isAward && asksCert)) {
        const items = c.items.map((it) => {
          if (!isAward) return it;
          const itTokens = tokenize(it);
          const note = engine.awardNotes.find((n) => n.toks.filter((t) => itTokens.includes(t)).length >= Math.min(2, itTokens.length));
          return note ? `**${it}**: ${note.description}` : `**${it}**`;
        });
        out.push(`**${c.category || "Certifications"}:**\n${bullets(items)}`);
      }
    }
    if (out.length) return reply(out.join("\n\n"), { intent: "certs" });
  }

  // "tell me more" follow-ups
  const followUp = has(q, /\b(it|that|this|those|there|more|elaborate|details?|explain|expand)\b/);
  let entity = matchEntity(engine, q);
  if (!entity && followUp && ctx.lastEntity) entity = engine.entities.find((e) => e.id === ctx.lastEntity) || null;

  // years of experience
  if (has(q, /\b(how (many|much) (years|experience)|years of (experience|exp)|how long|total experience|yoe|experience level|seniority|how senior)\b/) && !entity) {
    return reply(`${yearsLine(engine)}\n\n**Career timeline:**\n${experienceTimeline(engine)}`, { intent: "years" });
  }

  // current / latest role
  if (has(q, /\b(current\w*|right now|presently|latest|most recent|recent|last) (role|job|position|company|employer|work)|\bwhere (does|is) she work(ing)?\b|\bcurrently\b/)) {
    const latest = (r.experience || [])[0];
    if (latest) {
      const ended = latest.dates && !/present|current|now/i.test(latest.dates.to);
      const e = engine.entities.find((x) => x.role === latest && x.kind === "role");
      return reply(
        `${ended ? "Her most recent role" : "She currently works as"}:\n\n${describeEntity(engine, e)}${ended && r.authorization ? `\n\n✅ ${r.authorization}` : ""}`,
        { entity: e?.id }
      );
    }
  }

  // work history
  if (has(q, /\b(compan(y|ies)|employers?|worked (at|for)|work history|career|previous (jobs?|roles?|companies)|job history|employment|organi[sz]ations?|where (has|did) she work\w*|work experience|experience so far)\b|^\s*(her )?experiences?\??\s*$/) && !entity) {
    return reply(`${yearsLine(engine)}\n\n${experienceTimeline(engine)}\n\nAsk about any company or project for details.`, { intent: "experience" });
  }

  // entity questions ("tell me about DEX WorkBench", "what did she do at TCS?")
  if (entity) {
    const focus = q.replace(/\b(tell me|about|more|what|did|she|do|at|for|on|her|work|worked|role|in|the|details?|explain)\b/g, " ");
    return reply(describeEntity(engine, entity, focus), { entity: entity.id });
  }

  // projects list
  if (has(q, /\b(projects?|products?|what (has|did) she (build|built|make|made|work on|worked on)|worked on|portfolio)\b/)) {
    const items = [];
    for (const e of engine.entities)
      if (e.kind === "project") items.push(`**${e.label}** (${e.role.org})${e.project.meta.length ? ` · ${e.project.meta.join(", ")}` : ""}`);
      else if (e.kind === "personal") items.push(`**${e.label}** (personal project)`);
      else if (e.kind === "site") items.push(`**${e.label}** (${e.site.company})`);
    for (const x of r.experience || []) for (const b of x.bullets) if (/\b(project|app)\b/i.test(b) && !/app store/i.test(b)) items.push(`${b.replace(/\.$/, "")} (${x.org})`);
    return reply(`Projects ${name} has worked on:\n${bullets(items)}\n\nAsk about any of them for details.`, { intent: "projects" });
  }

  // strengths / why hire / summary
  if (has(q, /\b(why (should|would|do) (we|i|you|they) hire|why hire|good fit|stand out|unique|what makes her|bring to|value (she|can)|best (qualities|at)|selling points?|strengths?|strong points?)\b/)) {
    const hl = (r.highlights || []).map((h) => `**${h.value}** ${h.label}`);
    const strengths = (r.skills || []).find((s) => /strength/i.test(s.category));
    return reply(
      [
        `A few reasons ${name} stands out:`,
        bullets(hl),
        (r.summary || [])[1] || "",
        strengths ? `**Strengths:** ${strengths.items.join(", ")}` : "",
        r.authorization ? `✅ ${r.authorization}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      { intent: "pitch" }
    );
  }
  if (has(q, /\b(about (her|mounika|yourself|the candidate)|who is|introduce|summary|summari[sz]e|overview|profile|background|describe (her|mounika)|elevator pitch|tell me about (her|mounika))\b/) || q.trim() === "mounika") {
    return reply(
      `**${fullName}** — ${r.headline}\n\n${(r.summary || []).join("\n\n")}\n\n${bullets((r.highlights || []).map((h) => `**${h.value}** ${h.label}`))}`,
      { intent: "summary" }
    );
  }

  // specific skill / technology questions
  const qNorm = normalize(q);
  const missing = Object.entries(KNOWN_TECH)
    .filter(([k]) => new RegExp(`\\b${k.replace(/[+#]/g, "\\$&")}s?\\b`).test(qNorm))
    .map(([, v]) => v)
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter((v) => !engine.docs.some((d) => d.text.toLowerCase().includes(v.toLowerCase().replace(/\.js$/, ""))));
  const qTokens = tokenize(q);
  const known = [];
  for (let i = 0; i < qTokens.length; i++) {
    const two = qTokens.slice(i, i + 2).join(" ");
    const hit = engine.skillNames[two] || engine.skillNames[qTokens[i]];
    if (hit && !known.some((k) => k.name === hit.name)) known.push(hit);
  }
  const catKey = Object.keys(engine.skillCategories).find((k) => {
    const kt = k.split(" ").filter(Boolean);
    return kt.length && kt.every((t) => qTokens.includes(t));
  });
  if (catKey && !missing.length && !known.length) {
    const cat = engine.skillCategories[catKey];
    const evidence = search(engine, `${message} ${cat.items.join(" ")}`, { filter: (d) => d.section !== "skills", limit: 4 });
    return reply(
      `**${cat.category}:** ${cat.items.join(", ")}${
        evidence.length
          ? `\n\nWhere she's applied it:\n${bullets(evidence.map((h) => `${h.d.text}${h.d.section === "experience" ? ` _(${h.d.context})_` : ""}`))}`
          : ""
      }`,
      { intent: "skill-category" }
    );
  }
  const genericSkillQ = has(q, /\b(skills?|tech(nical)? stack|stack|technolog\w*|tools?|tech|expertise|proficien\w*|languages?|frameworks?|libraries|good at|speciali[sz]\w*)\b/);
  if (genericSkillQ && !known.length && !missing.length) return reply(skillsOverview(engine), { intent: "skills" });

  if (known.length || missing.length) {
    const out = [];
    for (const k of known.slice(0, 3)) {
      const kt = tokenize(k.name.replace(/\(.*?\)/g, ""));
      const evidence = search(engine, k.name.replace(/\(.*?\)/g, ""), {
        filter: (d) => d.section !== "skills" && kt.every((t) => tokenize(d.text).includes(t)),
        limit: 3,
      });
      out.push(
        `✅ **${k.name}**: yes, listed under _${k.category || "skills"}_.${evidence.length ? `\n${bullets(evidence.map((h) => `${h.d.text}${h.d.context && h.d.section === "experience" ? ` _(${h.d.context})_` : ""}`))}` : ""}`
      );
    }
    for (const m of missing.slice(0, 3)) {
      out.push(`➖ **${m}** isn't mentioned on her resume.${RELATED[m] ? ` Closest related experience: ${RELATED[m]}.` : ""}`);
    }
    return reply(out.join("\n\n"), { intent: "skill-check" });
  }

  // general retrieval
  const hits = search(engine, q, { limit: 5 });
  if (hits.length) {
    const top = hits[0].d;
    return reply(groupByContext(hits), { entity: top.entity || undefined });
  }

  return reply(
    `I couldn't find that in ${name}'s resume. Try asking about her experience, projects, skills, education or availability. Or contact her directly at **${r.contact?.email}**.`
  );
}

export function getWelcome(engine) {
  const r = engine.resume;
  const name = first(r.name);
  return {
    name,
    headline: r.headline,
    message: `Hi! 👋 I'm ${name}'s resume assistant. I've read her latest resume, so ask me anything about her experience, projects, skills or availability.`,
    suggestions: [
      "Summarise her profile",
      "Does she need visa sponsorship?",
      "Tell me about DEX WorkBench",
      "What's her tech stack?",
    ],
  };
}
