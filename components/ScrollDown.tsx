import React from "react";
import { motion } from "framer-motion";
import { AiFillDownCircle } from "react-icons/ai";

type Props = {
    /** id of the element to scroll to when clicked (optional) */
    targetId?: string;
    /** size in px */
    size?: number;
    /** Tailwind color classes to apply to the arrow/container (optional) */
    className?: string;
    /** show small caption text */
    showLabel?: boolean;
};

/**
 * ScrollDownBounce
 * A minimal, accessible, tailwind-friendly React + TypeScript component
 * that shows a bouncing "scroll down" indicator. Click will scroll to
 * the element with `targetId` if provided.
 *
 * Usage:
 * 1. Ensure Tailwind CSS is enabled in your project and install framer-motion:
 *    npm install framer-motion
 * 2. Import and use: <ScrollDownBounce targetId="next" />
 */
export default function ScrollDownBounce({
    targetId,
    size = 56,
    className = "",
    showLabel = false,
}: Props) {
    const handleClick = () => {
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const containerStyle: React.CSSProperties = {
        width: size,
        height: size * 1.4,
    };

    return (
        <div className={`flex flex-col items-center gap-2  ${className}`}>
            <button
                onClick={handleClick}
                aria-label={targetId ? `Scroll to ${targetId}` : "Scroll down"}
                className="group focus:outline-none "
                style={containerStyle}
            >
                <motion.div
                    className="w-full h-full flex items-start justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* outer rounded frame */}
                    <div className="w-16 h-16 flex items-center justify-center rounded-full">
                        <motion.div
                            className=" p-2 flex items-center justify-center"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            style={{ width: "100%", height: "100%" }}
                        >
                            {/* bouncing arrow - animate Y */}
                            <motion.div
                                animate={{ y: [0, 8, 0], opacity: [1, 0.95, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            >

                                <AiFillDownCircle size={48} />
                            </motion.div>
                            {/* 改成這個icon */}
                        </motion.div>
                    </div>
                </motion.div>
            </button>

            {showLabel && (
                <motion.span
                    className="text-xs select-none text-white-600 "
                    animate={{ opacity: [0, 1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    滑動以查看更多
                </motion.span>
            )}
        </div>
    );
}

/*
Example usage (place in a page):

import ScrollDownBounce from './ScrollDownBounce';

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="h-screen flex items-center justify-center"> 
        <h1 className="text-4xl">Hero Section</h1>
        <div className="absolute bottom-8 w-full flex justify-center">
          <ScrollDownBounce targetId="next" showLabel />
        </div>
      </section>

      <section id="next" className="h-screen bg-slate-50  flex items-center justify-center">
        <h2>下一段內容</h2>
      </section>
    </main>
  );
}
*/