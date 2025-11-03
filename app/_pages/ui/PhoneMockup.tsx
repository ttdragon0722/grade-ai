// PhoneMockup.tsx
import clsx from "clsx";
import React, { ReactNode } from "react";

interface PhoneMockupProps {
    className?: string;
    children?: ReactNode;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ className,children }) => {
    return <div className={clsx("w-84 h-168",className)}>
        <div className="relative w-full h-full rounded-3xl bg-black shadow-xl flex flex-col items-center p-2">
            {/* 上方感應器/鏡頭 */}
            <div className="w-16 h-1 bg-gray-700 rounded-full mt-2"></div>
            <div className="w-4 h-4 bg-gray-700 rounded-full mt-1"></div>

            {/* 螢幕 */}
            <div className="flex-1 w-full mt-2 rounded-2xl overflow-hidden bg-neutral-800">
                {children ? (
                    children
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        螢幕預覽
                    </div>
                )}
            </div>

            {/* 下方Home鍵 */}
            <div className="w-12 h-1 bg-gray-700 rounded-full mb-2 mt-2"></div>
        </div>
    </div>
};

export default PhoneMockup;
