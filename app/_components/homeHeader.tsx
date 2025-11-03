"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const Header = () => {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // 滾動超過 100px 時改變背景
            setScrolled(window.scrollY > 100);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 w-full z-50 flex h-16 items-center gap-4 px-4 backdrop-blur-sm shadow-lg transition-colors duration-500 ${scrolled ? "bg-white/80 dark:bg-black/80" : "bg-white/5 dark:bg-black/5"
                }`}
        >
            {/* 左側區塊 */}
            <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => router.push("/dashboard")}
            >
                {/* 標題 */}
                <nav className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="font-black text-neutral-900 dark:text-neutral-50">
                        Grade AI
                    </span>
                </nav>
            </div>

            {/* 右側區塊 */}
            <div className="ml-auto flex items-center gap-3"></div>
        </header>
    );
};

export default Header;
