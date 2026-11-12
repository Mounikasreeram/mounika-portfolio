import { GoogleTagManager } from "@next/third-parties/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./components/footer";
import PortfolioChatbot from "./components/portfolio-chatbot";
import ScrollToTop from "./components/helper/scroll-to-top";
import Navbar from "./components/navbar";
import "./css/card.scss";
import "./css/globals.scss";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mounika-sreeram.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mounika Sreeram | Senior Frontend Engineer (React, TypeScript, Next.js) · Leeds, UK",
  description:
    "Senior Frontend Engineer with 7+ years building enterprise React/TypeScript apps for Citi and Intuit. Led a team of 6 on a 5,000+ user platform and architected a design system used by 20+ teams. UK right to work, no sponsorship required, available immediately.",
  keywords: [
    "Senior Frontend Engineer", "React developer", "TypeScript", "Next.js", "Redux Toolkit", "Design systems",
    "StencilJS", "Frontend lead", "Leeds", "United Kingdom", "Mounika Sreeram",
  ],
  authors: [{ name: "Mounika Sreeram" }],
  openGraph: {
    type: "profile",
    title: "Mounika Sreeram | Senior Frontend Engineer",
    description: "7+ years in React, TypeScript & Next.js · Design systems · Team leadership · UK right to work · Available immediately.",
    url: SITE_URL,
    images: [{ url: "/profile.png", width: 280, height: 280, alt: "Mounika Sreeram" }],
  },
  twitter: {
    card: "summary",
    title: "Mounika Sreeram | Senior Frontend Engineer",
    description: "7+ years in React, TypeScript & Next.js · Available immediately in the UK.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastContainer />
        <main className="min-h-screen relative mx-auto px-6 sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem] text-white">
          <Navbar />
          {children}
          <ScrollToTop />
          <PortfolioChatbot />
        </main>
        <Footer />
      </body>
      {process.env.NEXT_PUBLIC_GTM && <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM} />}
    </html>
  );
}
