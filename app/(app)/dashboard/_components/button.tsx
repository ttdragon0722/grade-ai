"use client";

import { useRouter } from "next/navigation";
import React from "react";

interface ButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, href, onClick }) => {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else if (onClick) {
            onClick();
        }
    };

    return (
        <button
            type="button"
            className="inline-flex font-black items-center justify-center rounded-full h-8 w-fit px-4 bg-white text-neutral-900 shadow-md hover:bg-neutral-100 transition-colors"
            onClick={handleClick}
        >
            {children}
            <span className="sr-only">{children}</span>
        </button>
    );
};

export default Button;
