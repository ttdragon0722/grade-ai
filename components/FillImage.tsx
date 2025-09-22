import Image from "next/image";
import { FC } from "react";
import clsx from "clsx";

export enum EObjectFit {
    Contain = "object-contain",
    Cover = "object-cover",
    Fill = "object-fill",
    None = "object-none",
    ScaleDown = "object-scale-down"
}

interface FillImageProps {
    className?: string;
    src: string;
    objectFit?: EObjectFit;
    alt?: string;
    imageClass?: string;
}

const FillImage: FC<FillImageProps> = ({ className = "", src, objectFit = EObjectFit.Contain, alt = "image", imageClass }) => {
    return (
        <div className={clsx("relative overflow-hidden", className)}>
            <Image src={src} alt={alt} fill className={clsx(objectFit, imageClass)} />
        </div>
    );
};

export default FillImage;
