"use client"

import { useRouter } from "next/router";
import React, { ReactNode } from "react";

interface CreatePanelProps {
    children?: ReactNode; // 可放入其他內容
}

const CreatePanel: React.FC<CreatePanelProps> = ({ children }) => {
    const router = useRouter();

    const handleClose = () => {
        router.back(); // 點擊背景或叉叉返回上一頁
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 半透明黑色蒙版 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            ></div>

            {/* 面板 */}
            <div className="relative w-full max-w-lg bg-neutral-800 rounded-2xl shadow-lg p-6 z-10">
                {/* 右上角關閉按鈕 */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200"
                >
                    ✕
                </button>

                {/* Panel 內容 */}
                <div>{children}</div>
            </div>
        </div>
    );
};

export default CreatePanel;
