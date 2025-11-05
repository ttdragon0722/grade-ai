"use client";
import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { Container } from "@/components/container";
import PhoneMockup from "./ui/PhoneMockup";
import Image from "next/image";
import FillImage, { EObjectFit } from "@/components/FillImage";

gsap.registerPlugin(ScrollTrigger);

const steps = [
    { title: "第一步：註冊並登入網站", desc: ["教育工作者登入或註冊帳號"] },
    { title: "第二步：新增班級資料", desc: ["新增班級資料"] },
    { title: "第三步：新增考卷資料", desc: ["新增考卷和正確答案"] },
    { title: "第四步：上傳學生作答答案", desc: ["拍照或掃描學生作答圖片"] },
    { title: "第五步AI運算並統計分數：", desc: ["使用ai批改考卷並輸出報表"] },
];

const System = () => {
    const stepRefs = useRef<HTMLDivElement[]>([]);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const textTrackRef = useRef<HTMLDivElement | null>(null);
    const phoneTrackRef = useRef<HTMLDivElement | null>(null);

    const tl = useRef<gsap.core.Timeline | null>(null);
    useLayoutEffect(() => {
        if (!textTrackRef.current || !phoneTrackRef.current) return;

        const triggers: ScrollTrigger[] = [];

        steps.forEach((_, i) => {
            const triggerEl = stepRefs.current[i];
            if (!triggerEl) return;

            // 文字動畫
            triggers.push(
                ScrollTrigger.create({
                    trigger: triggerEl,
                    start: "top center",
                    end: "bottom center",
                    onEnter: () => {
                        gsap.to(textTrackRef.current, {
                            xPercent: -100 * i,
                            duration: 0.6,
                            ease: "power2.out",
                        });
                        gsap.to(phoneTrackRef.current, {
                            xPercent: -100 * i,
                            duration: 0.6,
                            ease: "power2.out",
                        });
                    },
                    onLeaveBack: () => {
                        const targetIndex = i === 0 ? 0 : i - 1;
                        gsap.to(textTrackRef.current, {
                            xPercent: -100 * targetIndex,
                            duration: 0.6,
                            ease: "power2.out",
                        });
                        gsap.to(phoneTrackRef.current, {
                            xPercent: -100 * targetIndex,
                            duration: 0.6,
                            ease: "power2.out",
                        });
                    },
                })
            );
        });

        return () => {
            triggers.forEach((t) => t.kill());
        };
    }, []);


    return (
        <div className="bg-white text-black relative">
            {/* === Sticky 區塊 === */}
            <div className="w-full h-screen sticky z-40 top-0 left-0 overflow-hidden">
                <div className="relative w-full h-full pt-16">
                    <Container className="md:pl-100 pl-0 md:pt-32 pt-5 flex flex-col max-md:items-center w-full h-full">
                        <h1 className="font-black text-4xl mb-2 max-md:text-lg">
                            系統架構及使用者流程
                        </h1>

                        {/* === 多步驟橫向區 === */}
                        <div className="overflow-hidden w-full h-[300px] relative">
                            <div
                                ref={textTrackRef}
                                className="flex w-full h-full relative pt-5"
                                style={{ width: `${steps.length * 100}%` }}
                            >
                                {steps.map((step, i) => (
                                    <div
                                        key={i}
                                        className="w-full flex-shrink-0 max-md:px-5"
                                        style={{
                                            width: "100%",
                                            flex: "0 0 100%",
                                        }}
                                    >
                                        <h1 className="font-black text-5xl mb-4 max-md:text-3xl">
                                            {step.title}
                                        </h1>
                                        <div className="text-2xl mb-4 max-md:text-xl">
                                            {step.desc.map((t, j) => (
                                                <div key={j}>{t}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <FillImage className="max-md:hidden absolute w-240 -left-36 h-128" src="/sys.png" />
                    </Container>

                    <PhoneMockup
                        className="
                            absolute transition-transform duration-75
                            left-1/18
                            max-lg:left-1/20 md:-bottom-12
                            max-md:left-1/2 max-md:-translate-x-1/2 
                            max-md:top-2/6"
                    >
                        <div ref={phoneTrackRef} className="flex w-84 h-168" style={{ width: `${steps.length * 100}%` }}>
                            {[
                                "/step1.png",
                                "/step2 (2).png",
                                "/step3.png",
                                "/step4.png",
                                "/step5.png",
                            ].map((src, i) => (
                                <div key={i} className="flex-shrink-0 w-84 h-168" style={{ flex: "0 0 100%" }}>
                                    <FillImage
                                        src={src}
                                        objectFit={EObjectFit.Cover}
                                        className="w-84 h-168"
                                        alt={`step ${i + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </PhoneMockup>
                </div>
            </div>

            {/* === ScrollTrigger 區塊 === */}
            <div className="relative z-10 text-black w-full h-[360vh]">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            if (el) stepRefs.current[i] = el;
                        }}
                        className="h-[60vh]"
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default System;
