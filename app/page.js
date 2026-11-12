import { experiences } from "@/utils/data/experience";
import { personalData } from "@/utils/data/personal-data";
import { loadResumeSafe } from "@/utils/resume/load-resume";
import AboutSection from "./components/homepage/about";
import Blog from "./components/homepage/blog";
import ContactSection from "./components/homepage/contact";
import Education from "./components/homepage/education";
import Experience from "./components/homepage/experience";
import HeroSection from "./components/homepage/hero-section";
import Skills from "./components/homepage/skills";

async function getBlogs() {
  if (!personalData.devUsername) return [];
  const res = await fetch(`https://dev.to/api/articles?username=${personalData.devUsername}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.filter((item) => item?.cover_image).sort(() => Math.random() - 0.5);
}

// Static fallbacks, used only if the resume PDF can't be parsed.
const fallbackRoles = experiences.map((e) => {
  const [from, to] = e.duration.split(/\s*-\s*/);
  return { title: e.title, org: e.company, dates: { from, to, text: `${from} – ${to}` }, meta: [], bullets: [], projects: [], notes: [] };
});

function buildFacts(resume) {
  if (!resume) return [];
  const years = resume.highlights?.find((h) => /year/i.test(h.label));
  const led = resume.highlights?.find((h) => /led|team/i.test(h.label));
  const auth = (resume.authorization || "").split(/\s*·\s*/).filter(Boolean);
  const workMode = resume.contact?.location?.match(/\(([^)]+)\)/)?.[1];
  return [
    years && { icon: "🚀", label: "Experience", value: `${years.value} ${years.label.toLowerCase()}` },
    resume.contact?.location && { icon: "📍", label: "Location", value: resume.contact.location.replace(/\s*\(.*\)/, "") },
    workMode && { icon: "💻", label: "Work mode", value: workMode.replace(/\b\w/g, (c) => c.toUpperCase()) },
    auth[0] && { icon: "🛂", label: "Right to work", value: auth.slice(0, 2).join(" · ") },
    auth[2] && { icon: "📅", label: "Availability", value: auth.slice(2).join(" · ") },
    led && { icon: "👥", label: "Leadership", value: `${led.value} ${led.label.toLowerCase()}` },
  ].filter(Boolean);
}

export default async function Home() {
  const [blogs, resume] = await Promise.all([getBlogs(), loadResumeSafe()]);

  const education = resume?.education?.map((e, i) => ({
    id: i + 1,
    year: e.dates?.text || "",
    percentage: e.score || "",
    title: e.degree,
    institution: e.institution,
  }));
  const certifications = (resume?.certifications || []).filter((c) => !/award/i.test(c.category)).flatMap((c) => c.items);

  return (
    <div suppressHydrationWarning>
      <HeroSection
        highlights={resume?.highlights || []}
        authorization={resume?.authorization || ""}
        location={resume?.contact?.location?.replace(/\s*\(.*\)/, "") || personalData.address}
      />
      <AboutSection summary={resume?.summary || []} facts={buildFacts(resume)} />
      <Experience roles={resume?.experience?.length ? resume.experience : fallbackRoles} />
      <Skills categories={(resume?.skills || []).filter((c) => c.category && !/strength/i.test(c.category))} />
      <Education items={education} certifications={certifications} />
      {blogs.length > 0 && <Blog blogs={blogs} />}
      <ContactSection />
    </div>
  );
}
