"use client";
import FillImage, { EObjectFit } from "@/components/FillImage";
import { useState } from "react";

const Photo = ({ className, src }: { className?: string; src: string }) => {
    // 使用 useState 來追蹤圖片是否處於全螢幕模式
    const [isFullScreen, setIsFullScreen] = useState(false);

    // 點擊圖片時切換全螢幕模式
    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    return (
        <>
            <div
                className={`cursor-pointer h-[200px] w-[200px] aspect-square rounded-lg overflow-hidden`}
                onClick={toggleFullScreen}
            >
                <FillImage objectFit={EObjectFit.Cover}  src={src} className="w-full h-full duration-300 transition-transform transform hover:scale-105"/>
            </div>

            {/* 全螢幕彈窗，當 isFullScreen 為 true 時顯示 */}
            {isFullScreen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl bg-opacity-90 flex justify-center items-center p-4"
                    onClick={toggleFullScreen}
                >
                    <div className="w-full h-full flex justify-center items-center">

                        <FillImage src={src} className="w-full h-full" />
                    </div>
                </div>
            )}
        </>
    );
};

export default Photo;
