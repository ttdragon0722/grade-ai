"use client";
import React, { useEffect, useState } from 'react';
import { useExam } from '../_context/ExamContext';
import Button from '../../_components/button';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import PrevButton from '../../_components/prevButton';
interface NavButtonProps {
    href: string;
    children: React.ReactNode;
    cur: string;
}

/**
 * 導航按鈕元件，根據當前 URL 決定是否為 active 狀態。
 * @param {object} props - 元件屬性。
 * @param {string} props.href - 按鈕的連結目標。
 * @param {React.ReactNode} props.children - 按鈕的子元素（文字或圖標）。
 * @param {string} props.cur - 代表當前頁面 URL 的字串。
 */
const NavButton: React.FC<NavButtonProps> = ({ href, children, cur }) => {
    // 根據傳入的 `cur` 和 `href` 判斷是否為活動狀態
    const isActive = cur === href;

    // 共用樣式
    const commonClasses = "inline-flex items-center justify-center rounded-full h-8 w-fit px-4 transition-colors font-black";

    // 反白樣式（被選中時）
    const activeClasses = "bg-white text-neutral-900 shadow-md";

    // 預設樣式（未被選中時）
    const inactiveClasses = "bg-transparent text-white border border-neutral-700 hover:bg-neutral-800";

    return (
        <Link
            href={href}
            className={clsx(commonClasses, {
                [activeClasses]: isActive,
                [inactiveClasses]: !isActive,
            })}
        >
            {children}
            <span className="sr-only">{children}</span>
        </Link>
    );
};

const Header = () => {
    const { exam, examId, loading, error } = useExam();
    const pathname = usePathname();

    return (
        <div className="py-2 mt-2">
            {/* 上方返回按鈕 */}
            <div className="flex gap-5 items-center mb-3">
                <PrevButton />
                {loading && "載入中..."}
                {error && <span className="text-red-500">{error}</span>}
                {!loading && !error && !exam && (
                    <span className="text-red-500">找不到測驗資訊。</span>
                )}
                {exam && (
                    <div className=''>
                        <h1 className="text-3xl font-bold">{exam.exam_name}</h1>
                        <p className="text-neutral-400">Pages: {exam.total_pages}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end py-2 gap-2.5">
                <NavButton cur={pathname} href={`/dashboard/exam/${examId}`}>
                    檔案上傳
                </NavButton>
                <NavButton cur={pathname} href={`/dashboard/exam/${examId}/gallery`}>
                    上傳列表
                </NavButton>
                <NavButton cur={pathname} href={`/dashboard/exam/${examId}/answer`}>
                    批改/成績
                </NavButton>
            </div>
        </div>
    );
};

export default Header;