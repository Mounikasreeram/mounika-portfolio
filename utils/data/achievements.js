import { FaTrophy } from "react-icons/fa";
import { RiMedalFill } from "react-icons/ri";
import { GiDiamondTrophy } from "react-icons/gi";

export const achievements = [
  {
    id: 1,
    title: "Trendsetters Award",
    description:
      "Recognized for presenting an innovative solution during Altimetrik's Think Thursday initiative.",
    icon: FaTrophy,
    iconClass: "text-yellow-400",
    certificate: ["/certificates/trendsetters-award.png"],

  },
  {
    id: 2,
    title: "Rise & Shine Award (2x)",
    description:
      "Recognized for consistent performance and team collaboration.",
    icon: RiMedalFill,
    iconClass: "text-purple-400",
    certificate: [
      "/certificates/rise-shine/rise-shine-1.pdf",
      "/certificates/rise-shine/rise-shine-2.pdf",
    ],
  },
  {
    id: 3,
    title: "GEM Award",
    description:
      "Awarded for outstanding engineering excellence.",
    icon: GiDiamondTrophy,
    iconClass: "text-cyan-400",
    certificate: ["/certificates/gem-award.pdf"],

  },
];
