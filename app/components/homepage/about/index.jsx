import { personalData } from "@/utils/data/personal-data";
import Image from "next/image";

function AboutSection({ summary = [], facts = [] }) {
  const paragraphs = summary.length ? summary : [personalData.description];

  return (
    <div id="about" className="relative my-12 scroll-mt-24 lg:my-16">
      <div className="absolute -right-6 top-0 hidden flex-col items-center lg:flex">
        <span className="rounded-md bg-[#1a1443] px-2 py-5 text-xl tracking-wider text-white [writing-mode:vertical-rl]">
          ABOUT ME
        </span>
        <span className="h-36 w-[2px] bg-[#1a1443]"></span>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:pr-16">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-xl font-medium uppercase text-[#16f2b3]">Who I am?</p>
          <div className="space-y-4 text-sm text-gray-200 lg:text-lg">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          {facts.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Quick facts for recruiters</p>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-xl border border-[#1b2c68a0] bg-[#11152c]/80 p-4 transition-colors hover:border-violet-500/60">
                    <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                      <span aria-hidden>{f.icon}</span>
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-white">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative h-fit">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-600 to-[#16f2b3] opacity-60 blur-md" />
            <Image
              src={personalData.profile}
              width={280}
              height={280}
              alt="Mounika Sreeram"
              className="relative cursor-pointer rounded-2xl grayscale transition-all duration-1000 hover:scale-105 hover:grayscale-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
