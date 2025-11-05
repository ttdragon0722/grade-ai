"use client";
import FillImage, { EObjectFit } from "@/components/FillImage";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Slide {
    title: string;
    description: string;
    img: string; // 放在 public 資料夾
}

interface CarouselProps {
    slides: Slide[];
    autoPlay?: boolean;
    interval?: number;
}

const Carousel: React.FC<CarouselProps> = ({
    slides,
    autoPlay = true,
    interval = 5000,
}) => {
    const [current, setCurrent] = useState(0);

    // 自動播放
    useEffect(() => {
        if (!autoPlay || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, slides.length, interval]);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prevSlide = () =>
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative w-full h-[500px] overflow-hidden rounded-2xl shadow-lg bg-gray-200">
            {/* 圖片與文字層 */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <FillImage
                        src={slide.img}
                        alt={slide.title}
                        objectFit={EObjectFit.Contain}
                        className="w-full h-full"
                    />

                    {/* 文字區塊（毛玻璃背景） */}
                    <div className="absolute bottom-0 left-0 w-full text-white p-6">
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 shadow-lg max-w-3xl">
                            <h2 className="text-2xl font-semibold mb-2">
                                {slide.title}
                            </h2>
                            <p className="text-sm md:text-base leading-relaxed">
                                {slide.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            {/* 按鈕區塊（右下角） */}
            <div className="absolute bottom-4 right-4 flex gap-3">
                <button
                    onClick={prevSlide}
                    className="p-2 bg-white/80 text-gray-800 rounded-full hover:bg-white transition"
                    aria-label="Previous Slide"
                >
                    <FaChevronLeft />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-2 bg-white/80 text-gray-800 rounded-full hover:bg-white transition"
                    aria-label="Next Slide"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Carousel;
