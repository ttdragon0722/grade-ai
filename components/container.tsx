import { ReactNode } from "react";
import clsx from "clsx";

type ContainerMobileProps = {
    children?: ReactNode;
    className?: string;
};

const ContainerMobile = ({ children, className }: ContainerMobileProps) => {
    return (
        <div
            className={clsx(
                "mx-auto px-2 sm:px-6 md:px-8 max-w-full md:max-w-2xl relative py-2",
                className
            )}
        >
            {children}
        </div>
    );
};

export default ContainerMobile;
