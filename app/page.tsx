"use client";
export const dynamic = "error"; // 🔒 強制靜態生成

import Image from "next/image";

import { motion } from "framer-motion";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import AnimatedImageHighlights from "@/components/AnimatedImageHighlights";
import Header from "./_components/homeHeader";
import ContainerMobile, { Container } from "@/components/container";
import ScrollDownBounce from "@/components/ScrollDown";
import SectionTitle from "./_pages/ui/SectionTitle";
import Motivation from "./_pages/motivation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import DottedHr from "./_pages/ui/DottedHr";
import System from "./_pages/system";
gsap.registerPlugin(ScrollTrigger);


const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // 每個子元素延遲 0.2 秒
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

function ListExample() {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="space-y-4"
    >
      {["A", "B", "C"].map((text) => (
        <motion.li
          key={text}
          variants={item}
          className="p-4 bg-purple-500 text-white rounded-lg"
        >
          {text}
        </motion.li>
      ))}
    </motion.ul>
  );
}



export default function Home() {
  const questionScan = [
    { top: 1.1, left: 10, width: 85, height: 8, labelText: "Question" },
    { top: 8.5, left: 9, width: 85, height: 8, labelText: "Question" },
    { top: 16, left: 8.5, width: 85, height: 8, labelText: "Question" },
    { top: 23, left: 8.3, width: 85, height: 8, labelText: "Question" },
    { top: 30, left: 7.9, width: 85, height: 10, labelText: "Question" },
    { top: 39, left: 7.3, width: 85, height: 9, labelText: "Question" },
    { top: 47, left: 6.5, width: 87, height: 9, labelText: "Question" },
    { top: 55, left: 6.13, width: 88, height: 9, labelText: "Question" },
    { top: 63, left: 5.3, width: 88, height: 9, labelText: "Question" },
    { top: 71, left: 4.9, width: 90, height: 9.5, labelText: "Question" },
    { top: 80, left: 3.5, width: 90, height: 9.5, labelText: "Question" },
    { top: 89, left: 3.5, width: 90, height: 9.5, labelText: "Question" },

  ];
  const answerScan = [
    { top: 1.1, left: 10 - 3, width: 4, height: 5, labelText: "" },
    { top: 8.5, left: 9 - 3, width: 4, height: 5, labelText: "" },
    { top: 16, left: 8.5 - 3, width: 4, height: 5, labelText: "" },
    { top: 23.3, left: 4.3, width: 4, height: 6, labelText: "" },
    { top: 32, left: 4.5, width: 4, height: 5.2, labelText: "" },
    { top: 39.5, left: 3.5, width: 4, height: 5.2, labelText: "" },
    { top: 47, left: 6.5 - 3, width: 4, height: 5, labelText: "" },
    { top: 56.2, left: 2, width: 4, height: 5, labelText: "" },
    { top: 64, left: 1.3, width: 4, height: 5, labelText: "" },
    { top: 72.5, left: 1.5, width: 4, height: 6, labelText: "" },
    { top: 80, left: 3.5 - 3, width: 4, height: 5, labelText: "" },
    { top: 89, left: 0, width: 4, height: 5.5, labelText: "" },

  ];

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    gsap.fromTo(
      
      heroRef.current,
      { scale: 1, opacity: 1 },
      {
        scale: 0.8, // 縮小到 80%
        opacity: 0, // 淡出
        y: 100, // 向上移動 100px
        ease: "power1.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top", // 當 div 頂端到達 viewport 頂端開始
          end: "bottom 70%", // 當 div 底端到達 viewport 70% 高度時結束
          scrub: true,

        },
      }
    );
  }, []);

  return (
    <>
      <NeuralNetworkBackground />
      <Header />
      <div ref={heroRef} className="relative w-full h-screen z-10 font-sans text-white">
        <Container className="h-full flex flex-col justify-center">
          {/* H1 標題區塊 */}
          <h1 className="flex flex-col text-center sm:text-left max-w-4xl mx-auto pt-10 pb-0 w-full">

            {/* 1. 技術背景 (最小字、淺色) */}
            <span className="text-xl sm:text-2xl font-normal tracking-wider text-gray-400 mb-2">
              基於YOLO整合光學字元辨識之
            </span>

            {/* 2. 核心功能 (最大字、最粗、突出顯示) */}
            {/* 注意：這裡將 text-4xl 改為 sm:text-7xl，讓手機上的字體更適合置中排版 */}
            <span className="font-extrabold text-5xl sm:text-7xl lg:text-8xl leading-tight text-white drop-shadow-lg">
              測驗閱卷文字特徵
            </span>

            {/* 3. 系統名稱 (中等字、稍淺色收尾) */}
            <span className="font-extrabold text-5xl sm:text-7xl lg:text-8xl leading-tight text-blue-300">
              判別系統
            </span>

          </h1>

          {/* 附屬資訊區塊：指導老師、組員、課程 */}
          {/*
              * 關鍵調整：
              * 1. 移除 sm:items-start，改用 items-center 實現手機置中。
              * 2. 移除 sm:text-left，改用 text-center 實現手機置中。
              * 3. 在所有 flex 子元素上使用 sm:justify-start 覆蓋手機上的 justify-center。
            */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left my-8 lg:mb-16  max-w-4xl mx-auto w-full">

            {/* 第一區塊：指導老師 */}
            <div className="flex flex-wrap justify-center sm:justify-start text-sm sm:text-base font-light text-gray-400 mb-2">
              <span className="mr-4">指導老師:</span>
              <span className="font-medium text-white mr-4">黃祈勝</span>
              <span className="font-medium text-white">劉嘉雯</span>
            </div>

            {/* 第二區塊：組員 */}
            <div className="flex flex-wrap justify-center sm:justify-start text-base sm:text-lg font-medium text-white border-t border-b border-gray-700 py-2 my-2">
              <span className="mr-4 text-gray-400">組員:</span>
              <span className="mr-4">資工五甲</span>
              <span className="text-blue-300 mr-4">賴家煜</span>
              <span className="text-blue-300">黃馨蝶</span>
            </div>

            {/* 第三區塊：所屬課程/單位 */}
            {/* 這裡的 text-center/sm:text-left 繼承自父層，但單獨確保 text-center 即可 */}
            <div className="text-xs sm:text-sm font-light italic text-white mt-2">
              <span className="mr-4 text-gray-400">組別:</span>智慧運算創新應用 (日間部)
            </div>
          </div>
          {/* <div className="w-full md:flex justify-end relative md:bottom-[180px] lg:bottom-[280px] ">
            <AnimatedImageHighlights className="md:w-[500px]" autoPlayInterval={8000} imageUrl="/demo.jpg" questionScan={questionScan} answerScan={answerScan} />
          </div> */}
          <ScrollDownBounce className="absolute bottom-8 left-1/2 right-1/2" />
        </Container>
      </div>
      <Motivation />

      <System />
      <Motivation />

    </>
  );
}
