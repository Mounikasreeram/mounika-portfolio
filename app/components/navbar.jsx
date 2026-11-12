"use client";

import { personalData } from "@/utils/data/personal-data";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { MdDownload } from "react-icons/md";

const LINKS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      className={`sticky top-0 z-[90] -mx-6 px-6 sm:-mx-12 sm:px-12 transition-all duration-300 ${
        scrolled || open ? "border-b border-[#1b2c68a0] bg-[#0d1224]/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-between py-4">
        <Link href="/" className="group flex items-center gap-2 text-2xl font-bold text-[#16f2b3]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 text-base text-white transition-transform group-hover:rotate-6">
            MS
          </span>
          <span className="hidden sm:inline">MOUNIKA</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              <Link
                href={`/#${id}`}
                className={`relative block rounded-md px-3 py-2 text-sm uppercase tracking-wide transition-colors hover:text-pink-500 ${
                  active === id ? "text-[#16f2b3]" : "text-white"
                }`}
              >
                {label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-pink-500 to-violet-600 transition-transform duration-300 ${
                    active === id ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <a
              href={personalData.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:scale-105"
            >
              Resume <MdDownload size={15} />
            </a>
          </li>
        </ul>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-white md:hidden"
        >
          {open ? <HiX size={26} /> : <HiMenuAlt3 size={26} />}
        </button>
      </div>

      {open && (
        <ul className="flex flex-col gap-1 pb-4 md:hidden">
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              <Link
                href={`/#${id}`}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2.5 text-sm uppercase tracking-wide hover:bg-white/5 ${
                  active === id ? "text-[#16f2b3]" : "text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <a
              href={personalData.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Download Resume <MdDownload size={15} />
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
