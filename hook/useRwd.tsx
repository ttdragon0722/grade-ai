import React, { useEffect, useRef, useState } from "react";


type Breakpoints = {
    mobile?: number;
    tablet?: number;
    desktop?: number;
};


type UseRwdOptions = {
    breakpoints?: Breakpoints;
    debounceMs?: number;
    listenHeight?: boolean;
};


export function useRwd(options: UseRwdOptions = {}) {
    const { breakpoints = { mobile: 640, tablet: 1024 }, debounceMs = 80, listenHeight = false } = options;
    const isClient = typeof window !== "undefined" && typeof window.addEventListener === "function";


    const [size, setSize] = useState(() => ({
        width: isClient ? window.innerWidth : 0,
        height: isClient ? window.innerHeight : 0,
    }));


    const rafRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);


    useEffect(() => {
        if (!isClient) return;


        const handle = () => {
            // throttle with requestAnimationFrame for smoothness
            if (rafRef.current !== null) return;
            rafRef.current = window.requestAnimationFrame(() => {
                setSize({ width: window.innerWidth, height: window.innerHeight });
                if (rafRef.current) {
                    window.cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }
            });
        };


        const debounced = () => {
            if (debounceMs <= 0) return handle();
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(handle, debounceMs);
        };


        window.addEventListener("resize", debounced);


        // also listen to orientationchange for mobile
        window.addEventListener("orientationchange", debounced);


        return () => {
            window.removeEventListener("resize", debounced);
            window.removeEventListener("orientationchange", debounced);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, [debounceMs, isClient]);


    const { width, height } = size;


    const breakpointName = (() => {
        const m = breakpoints.mobile ?? 640;
        const t = breakpoints.tablet ?? 1024;
        if (width <= m) return "mobile";
        if (width <= t) return "tablet";
        return "desktop";
    })();


    const isMobile = breakpointName === "mobile";
    const isTablet = breakpointName === "tablet";
    const isDesktop = breakpointName === "desktop";


    return {
        width,
        height,
        breakpoint: breakpointName,
        isMobile,
        isTablet,
        isDesktop,
    } as const;
}