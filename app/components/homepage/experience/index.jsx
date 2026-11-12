import { formatDuration } from "@/utils/resume/parse-resume";
import Image from "next/image";
import { BsBriefcaseFill } from "react-icons/bs";

const VISIBLE = 3;

function Bullets({ items }) {
  if (!items.length) return null;
  const shown = items.slice(0, VISIBLE);
  const rest = items.slice(VISIBLE);
  const li = (b) => (
    <li key={b} className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-r before:from-pink-500 before:to-violet-600">
      {b}
    </li>
  );
  return (
    <>
      <ul className="space-y-2 text-sm leading-relaxed text-gray-300">{shown.map(li)}</ul>
      {rest.length > 0 && (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-[#16f2b3] hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">+ {rest.length} more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-gray-300">{rest.map(li)}</ul>
        </details>
      )}
    </>
  );
}

function Experience({ roles = [] }) {
  return (
    <div id="experience" className="relative z-50 my-12 scroll-mt-24 border-t border-[#25213b] lg:my-24">
      <Image src="/section.svg" alt="" width={1572} height={795} className="absolute top-0 -z-10" />

      <div className="my-5 flex justify-center lg:py-8">
        <div className="flex items-center">
          <span className="h-[2px] w-24 bg-[#1a1443]"></span>
          <span className="w-fit rounded-md bg-[#1a1443] p-2 px-5 text-xl text-white">Experience</span>
          <span className="h-[2px] w-24 bg-[#1a1443]"></span>
        </div>
      </div>

      <ol className="relative mx-auto max-w-5xl space-y-10 py-4 before:absolute before:bottom-0 before:left-[15px] before:top-2 before:w-[2px] before:bg-gradient-to-b before:from-pink-500 before:via-violet-600 before:to-transparent">
        {roles.map((role) => {
          const duration = role.dates ? formatDuration(role.dates.from, role.dates.to) : "";
          return (
            <li key={`${role.title}-${role.org}`} className="relative pl-12">
              <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-violet-500 bg-[#0d1224] text-violet-400">
                <BsBriefcaseFill size={13} />
              </span>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white sm:text-xl">{role.title}</h3>
                  <p className="text-base font-medium text-pink-500">{role.org}</p>
                  {role.meta.map((m) => (
                    <p key={m} className="mt-0.5 text-sm text-gray-400">
                      {m}
                    </p>
                  ))}
                </div>
                {role.dates && (
                  <div className="shrink-0 sm:text-right">
                    <span className="inline-block rounded-full border border-[#16f2b3]/30 bg-[#16f2b3]/10 px-3 py-1 text-xs font-medium text-[#16f2b3]">
                      {role.dates.text}
                    </span>
                    {duration && <p className="mt-1 text-xs text-gray-500">{duration}</p>}
                  </div>
                )}
              </div>

              {role.projects.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {role.projects.map((p) => (
                    <article
                      key={p.name}
                      className="group relative overflow-hidden rounded-xl border border-[#1b2c68a0] bg-gradient-to-br from-[#11152c] to-[#0a0d37] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-950/40"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-violet-600" />
                      <h4 className="font-semibold text-[#16f2b3]">{p.name}</h4>
                      {p.meta.length > 0 && (
                        <div className="mb-3 mt-2 flex flex-wrap gap-1.5">
                          {p.meta.map((m) => (
                            <span key={m} className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] text-violet-200">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={p.meta.length ? "" : "mt-3"}>
                        <Bullets items={p.bullets} />
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {role.bullets.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#1b2c68a0] bg-[#11152c]/70 p-5">
                  <Bullets items={role.bullets} />
                </div>
              )}

              {role.notes.map((n) => (
                <p key={n} className="mt-4 text-sm italic text-gray-500">
                  {n}
                </p>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default Experience;
