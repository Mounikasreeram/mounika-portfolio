// @flow strict
"use client";
import { personalData } from "@/utils/data/personal-data";
import Image from "next/image";
import Link from "next/link";
import { BsGithub, BsLinkedin } from "react-icons/bs";
import { MdDownload } from "react-icons/md";
import { RiContactsFill } from "react-icons/ri";
import { SiLeetcode } from "react-icons/si";
import { BiLogoGmail } from "react-icons/bi";

function HeroSection() {
  const socialLinks = [
    {
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${personalData.gmail}`,
      icon: <BiLogoGmail size={30} />,
      label: "Gmail",
    },
    {
      href: personalData.linkedIn,
      icon: <BsLinkedin size={30} />,
      label: "LinkedIn",
    },
  ].filter((link) => link.href);

  const coderData = {
    name: "Mounika Sreeram",
    role: "Senior Frontend Engineer",
    experience: "6+ Years",
    skills: [
      "React",
      "Redux Toolkit",
      "StencilJS",
      "Javascript",
      "TypeScript",
      "Next.js",
      "Jest",
      "React Testing Library",
      "Cypress",
      "CI/CD",
    ],
    strengths: [
      "Frontend Architecture",
      "Performance Optimization",
      "Accessibility",
      "Responsive Design",
      "Code Reviews",
      "Technical Mentoring",
    ],
    aiTools: ["GitHub Copilot", "Claude Code", "OpenAI Codex", "Gemini"],
    traits: {
      hardWorker: true,
      quickLearner: true,
      problemSolver: true,
      teamPlayer: true,
    },
  };
  return (
    <section className="relative flex flex-col items-center justify-between py-4 lg:py-12">
      <Image
        src="/hero.svg"
        alt="Hero"
        width={1572}
        height={795}
        className="absolute -top-[98px] -z-10"
      />

      <div className="grid grid-cols-1 items-start lg:grid-cols-2 lg:gap-12 gap-y-8">
        <div className="order-2 lg:order-1 flex flex-col items-start justify-center p-2 pb-20 md:pb-10 lg:pt-10">
          <h1 className="text-3xl font-bold leading-10 text-white md:font-extrabold lg:text-[2.6rem] lg:leading-[3.5rem]">
            Hello, <br />
            This is <span className=" text-pink-500">{personalData.name}</span>
            {` , I'm a Professional `}
            <span className=" text-[#16f2b3]">{personalData.designation}</span>.
          </h1>

          <div className="my-12">
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
              LET&apos;S CONNECT
            </p>

            <div className="flex items-center gap-5 w-fit rounded-2xl border border-pink-500/40 bg-[#0b0f2a]/80 px-6 py-4 shadow-[0_0_30px_rgba(236,72,153,0.15)] backdrop-blur-md">
              {socialLinks.map((link) => (
                <a
                  href={link.href}
                  target={ "_blank"}
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="
                  text-pink-500
                  transition-all
                  duration-300
                  hover:scale-125
                  hover:text-cyan-400
                "
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="#contact"
              className="bg-gradient-to-r to-pink-500 from-violet-600 p-[1px] rounded-full transition-all duration-300 hover:from-pink-500 hover:to-violet-600"
            >
              <button className="px-3 text-xs md:px-8 py-3 md:py-4 bg-[#0d1224] rounded-full border-none text-center md:text-sm font-medium uppercase tracking-wider text-[#ffff] no-underline transition-all duration-200 ease-out  md:font-semibold flex items-center gap-1 hover:gap-3">
                <span>Contact me</span>
                <RiContactsFill size={16} />
              </button>
            </Link>

            <Link
              className="flex items-center gap-1 hover:gap-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-3 md:px-8 py-3 md:py-4 text-center text-xs md:text-sm font-medium uppercase tracking-wider text-white no-underline transition-all duration-200 ease-out hover:text-white hover:no-underline md:font-semibold"
              role="button"
              target="_blank"
              href={personalData.resume}
            >
              <span>Get Resume</span>
              <MdDownload size={16} />
            </Link>
          </div>
        </div>
        <div className="order-1 lg:order-2 from-[#0d1224] border-[#1b2c68a0] relative rounded-lg border bg-gradient-to-r to-[#0a0d37]">
          <div className="flex flex-row">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-pink-500 to-violet-600"></div>
            <div className="h-[1px] w-full bg-gradient-to-r from-violet-600 to-transparent"></div>
          </div>
          <div className="px-4 lg:px-8 py-5">
            <div className="flex flex-row space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-orange-400"></div>
              <div className="h-3 w-3 rounded-full bg-green-200"></div>
            </div>
          </div>
          <div className="overflow-hidden border-t-[2px] border-indigo-900 px-4 lg:px-8 py-4 lg:py-8">
            <code className="font-mono text-xs md:text-sm lg:text-base">
              <div>
                <span className="text-pink-500">const</span>{" "}
                <span className="text-white">coder</span>{" "}
                <span className="text-pink-500">=</span>{" "}
                <span className="text-gray-400">{"{"}</span>
              </div>

              {/* Name */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">name:</span>{" "}
                <span className="text-amber-300">'{coderData.name}'</span>,
              </div>

              {/* Role */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">role:</span>{" "}
                <span className="text-amber-300">'{coderData.role}'</span>,
              </div>

              {/* Experience */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">experience:</span>{" "}
                <span className="text-amber-300">'{coderData.experience}'</span>
                ,
              </div>

              {/* Skills */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">skills:</span>{" "}
                <span className="text-gray-400">[</span>
                {coderData.skills.map((skill, index) => (
                  <span key={skill}>
                    <span className="text-amber-300">'{skill}'</span>
                    {index !== coderData.skills.length - 1 && (
                      <span className="text-gray-400">, </span>
                    )}
                  </span>
                ))}
                <span className="text-gray-400">]</span>,
              </div>

              {/* Strengths */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">strengths:</span>{" "}
                <span className="text-gray-400">[</span>
                {coderData.strengths.map((strength, index) => (
                  <span key={strength}>
                    <span className="text-cyan-400">'{strength}'</span>
                    {index !== coderData.strengths.length - 1 && (
                      <span className="text-gray-400">, </span>
                    )}
                  </span>
                ))}
                <span className="text-gray-400">]</span>,
              </div>

              {/* AI Tools */}
              <div className="ml-4 lg:ml-8">
                <span className="text-white">aiTools:</span>{" "}
                <span className="text-gray-400">[</span>
                {coderData.aiTools.map((tool, index) => (
                  <span key={tool}>
                    <span className="text-purple-400">'{tool}'</span>
                    {index !== coderData.aiTools.length - 1 && (
                      <span className="text-gray-400">, </span>
                    )}
                  </span>
                ))}
                <span className="text-gray-400">]</span>,
              </div>

              {/* Traits */}
              {Object.entries(coderData.traits).map(([key, value]) => (
                <div key={key} className="ml-4 lg:ml-8">
                  <span className="text-white">{key}:</span>{" "}
                  <span className="text-orange-400">{String(value)}</span>,
                </div>
              ))}

              {/* Hireable */}
              <div className="ml-4 lg:ml-8">
                <span className="text-green-400">hireable:</span>{" "}
                <span className="text-orange-400">true</span>,
              </div>

              <div>
                <span className="text-gray-400">{"};"}</span>
              </div>
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
