"use client";

import { achievements } from "@/utils/data/achievements";
import { educations as staticEducations } from "@/utils/data/educations";
import { Image as AntImage, Modal } from "antd";
import Image from "next/image";
import { useState } from "react";
import { FaGraduationCap } from "react-icons/fa";
import { HiOutlineArrowRight } from "react-icons/hi";
import { PiCertificateFill } from "react-icons/pi";

function SectionTitle({ children }) {
  return (
    <div className="my-5 flex justify-center lg:py-8">
      <div className="flex items-center">
        <span className="h-[2px] w-12 bg-[#1a1443] sm:w-24"></span>
        <span className="w-fit rounded-md bg-[#1a1443] p-2 px-5 text-lg text-white sm:text-xl">{children}</span>
        <span className="h-[2px] w-12 bg-[#1a1443] sm:w-24"></span>
      </div>
    </div>
  );
}

function SubHeading({ children }) {
  return (
    <h3 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
      <span className="h-[2px] w-8 bg-gradient-to-r from-pink-500 to-violet-600" />
      {children}
    </h3>
  );
}

function ScoreRing({ value }) {
  const pct = Number.parseFloat(value);
  if (!Number.isFinite(pct)) return null;
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#16f2b3 0%, #8b5cf6 ${pct}%, #1f2547 ${pct}% 100%)` }}
      role="img"
      aria-label={`Score ${pct}%`}
    >
      <div className="flex h-[66px] w-[66px] flex-col items-center justify-center rounded-full bg-[#0f1430]">
        <span className="text-lg font-bold leading-none text-white">{pct}%</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">score</span>
      </div>
    </div>
  );
}

function Education({ items, certifications = [] }) {
  const educations = items?.length ? items : staticEducations;
  const [selected, setSelected] = useState(null);

  return (
    <div id="education" className="relative z-50 my-12 scroll-mt-24 border-t border-[#25213b] lg:my-24">
      <Image src="/section.svg" alt="" width={1572} height={795} className="absolute top-0 -z-10" />
      <div className="flex -translate-y-[1px] justify-center">
        <div className="w-3/4">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        </div>
      </div>

      <SectionTitle>Education & Achievements</SectionTitle>

      <div className="mx-auto max-w-5xl space-y-14 py-4">
        {/* Education */}
        <section aria-labelledby="edu-heading">
          <SubHeading>
            <span id="edu-heading">Education</span>
          </SubHeading>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {educations.map((e) => (
              <article
                key={e.id}
                className="group relative overflow-hidden rounded-2xl border border-[#1b2c68a0] bg-gradient-to-br from-[#11152c] to-[#0a0d37] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-950/40"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-pink-500 via-violet-600 to-[#16f2b3]" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-950/30">
                      <FaGraduationCap size={20} />
                    </span>
                    <h4 className="text-lg font-semibold leading-snug text-white sm:text-xl">{e.title}</h4>
                    <p className="mt-1.5 text-sm text-gray-300">{e.institution}</p>
                    {e.location && <p className="mt-1 text-xs text-gray-500">📍 {e.location}</p>}
                  </div>
                  <ScoreRing value={e.percentage} />
                </div>

                {e.year && (
                  <span className="mt-5 inline-block rounded-full border border-[#16f2b3]/30 bg-[#16f2b3]/10 px-3 py-1 text-xs font-medium text-[#16f2b3]">
                    {e.year}
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section aria-labelledby="ach-heading">
          <SubHeading>
            <span id="ach-heading">Awards & Recognition</span>
          </SubHeading>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => {
              const Icon = a.icon;
              const hasProof = a.certificate?.length > 0;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!hasProof}
                  onClick={() => setSelected(a)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#1b2c68a0] bg-[#101123] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16f2b3] disabled:cursor-default"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/0 to-pink-500/0 transition-all duration-500 group-hover:from-violet-600/10 group-hover:to-pink-500/5" />
                  <span className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon size={28} className={a.iconClass} />
                  </span>
                  <h4 className="relative text-lg font-semibold text-white">{a.title}</h4>
                  <p className="relative mt-2 flex-grow text-sm leading-relaxed text-gray-400">{a.description}</p>
                  {hasProof && (
                    <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#16f2b3]">
                      View certificate{a.certificate.length > 1 ? "s" : ""}
                      <HiOutlineArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Certifications */}
        {certifications.length > 0 && (
          <section aria-labelledby="cert-heading">
            <SubHeading>
              <span id="cert-heading">Certifications</span>
            </SubHeading>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {certifications.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-3 rounded-xl border border-[#1b2c68a0] bg-[#11152c]/80 px-4 py-3.5 text-sm text-gray-200 transition-colors hover:border-violet-500/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <PiCertificateFill size={18} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} width={900} centered title={selected?.title}>
        <div className="flex flex-col gap-6">
          {selected?.certificate?.map((cert, i) =>
            cert.toLowerCase().endsWith(".pdf") ? (
              <iframe key={cert} src={cert} title={`${selected.title} certificate ${i + 1}`} className="h-[70vh] w-full rounded-lg border" />
            ) : (
              <AntImage key={cert} src={cert} alt={`${selected.title} certificate ${i + 1}`} width="100%" />
            )
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Education;
