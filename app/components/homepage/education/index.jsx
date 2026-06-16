// @flow strict
"use client";
import { educations } from "@/utils/data/educations";
import { achievements } from "@/utils/data/achievements";
import Image from "next/image";
import { BsPersonWorkspace } from "react-icons/bs";
import lottieFile from "../../../assets/lottie/study.json";
import AnimationLottie from "../../helper/animation-lottie";
import GlowCard from "../../helper/glow-card";
import { Progress } from "antd";
import { Modal, Image as AntImage } from "antd";
import { useState } from "react";

function Education() {
  const [open, setOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  return (
    <div
      id="education"
      className="relative z-50 border-t my-12 lg:my-24 border-[#25213b]"
    >
      <Image
        src="/section.svg"
        alt="Hero"
        width={1572}
        height={795}
        className="absolute top-0 -z-10"
      />
      <div className="flex justify-center -translate-y-[1px]">
        <div className="w-3/4">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent  w-full" />
        </div>
      </div>

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex  items-center">
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
          <span className="bg-[#1a1443] w-fit text-white p-2 px-5 text-xl rounded-md">
            Educations
          </span>
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="flex justify-center items-start">
            <div className="w-3/4 h-3/4">
              <AnimationLottie animationPath={lottieFile} />
            </div>
          </div>

          <div>
            <div className="relative flex flex-col gap-10">
              {/* Timeline Line */}
              <div className="absolute left-[95] top-0 bottom-0 w-[2px] bg-gradient-to-b from-violet-500 via-purple-500 to-cyan-500" />
              {educations.map((education) => (
                <div
                  key={education.id}
                  className="relative flex items-center gap-8"
                >
                  {/* Year + Circle */}
                  <div className="relative flex items-center w-[120px] shrink-0">
                    <span className="text-[#16f2b3] font-semibold text-lg w-[60px] text-right">
                      {education.year}
                    </span>

                    <div className="relative ml-6 z-10">
                      <div className="w-6 h-6 rounded-full border-4 border-violet-500 bg-[#0d1224]" />
                      <div className="absolute inset-0 animate-ping rounded-full bg-violet-500 opacity-30" />
                    </div>
                  </div>
                  {/* Card */}
                  <div className="flex-1">
                    <GlowCard identifier={`education-${education.id}`}>
                      <div className="flex justify-between items-center p-6 w-full min-h-[160px]">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-full border border-violet-500 flex items-center justify-center shrink-0">
                            <BsPersonWorkspace
                              size={20}
                              className="text-violet-500"
                            />
                          </div>

                          <div>
                            <h3 className="text-white text-xl font-semibold">
                              {education.title}
                            </h3>

                            <p className="text-gray-300">
                              {education.institution}
                            </p>

                            <p className="text-sm text-gray-500">
                              📍 {education.location}
                            </p>
                          </div>
                        </div>

                        {/* Percentage Circle */}
                        <div className="flex-shrink-0">
                          <Progress
                            type="circle"
                            percent={education.percentage}
                            size={90}
                            strokeWidth={8}
                            format={(percent) => (
                              <span className="text-white font-semibold text-sm">
                                {percent}%
                              </span>
                            )}
                            strokeColor={{
                              "0%": "#8b5cf6",
                              "100%": "#06b6d4",
                            }}
                          />
                        </div>
                      </div>
                    </GlowCard>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements Section */}
            <div className="mt-16">
              <h3 className="text-2xl font-semibold text-white mb-6">
                Achievements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;

                  return (
                    <GlowCard
                      key={achievement.id}
                      identifier={`achievement-${achievement.id}`}
                    >
                      <div
                        className="p-5 h-full min-h-[220px] flex flex-col"
                        onClick={() => {
                          console.log(achievement,"achievement")
                          setSelectedAchievement(achievement);
                          setOpen(true);
                        }}
                      >
                        <Icon
                          size={40}
                          className={`${achievement.iconClass} mb-4`}
                        />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-400 flex-grow">
                          {achievement.description}
                        </p>
                      </div>
                    </GlowCard>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={900}
        centered
        title={selectedAchievement?.title}
      >
        <div className="flex flex-col gap-6">
          {selectedAchievement?.certificate?.map((cert, index) => {
                  const isPdf = cert.toLowerCase().endsWith(".pdf");

            console.log(cert,"certofi")
            return isPdf ? (
              <iframe
              key={index}
              src={cert}
              title={`PDF ${index + 1}`}
              className="w-full h-[700px] rounded-lg border"
            />
            ) : (
              <AntImage
                key={index}
                src={cert}
                alt={`Certificate ${index + 1}`}
                width="100%"
              />
            );
           
})}
        </div>
      </Modal>
    </div>
  );
}

export default Education;
