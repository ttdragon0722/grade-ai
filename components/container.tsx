import { ReactNode, forwardRef } from "react";
import clsx from "clsx";

type ContainerMobileProps = {
    children?: ReactNode;
    className?: string;
};

// ✅ 改成 forwardRef
const ContainerMobile = forwardRef<HTMLDivElement, ContainerMobileProps>(
    ({ children, className }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    "mx-auto px-2 sm:px-6 md:px-8 max-w-full md:max-w-2xl relative py-2",
                    className
                )}
            >
                {children}
            </div>
        );
    }
);

ContainerMobile.displayName = "ContainerMobile"; // 避免 dev warning

// ===================================================

const Container = forwardRef<HTMLDivElement, { children: ReactNode, className?: string }>(
    ({ children,className }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx("min-[1540px]:w-pc xl:w-[1024px] w-full  m-auto p-3 relative",className)}
            >
                {children}
            </div>
        );
    }
);

Container.displayName = "Container";

export { Container };
export default ContainerMobile;
