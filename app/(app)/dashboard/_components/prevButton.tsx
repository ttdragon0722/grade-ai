"client"

import { useRouter } from "next/navigation";
import { BsChevronLeft } from "react-icons/bs";

const PrevButton = () => {
    const route = useRouter();

    const goBack = () => {
        route.back();
    };

    return (
        <button
            onClick={goBack}
            className="bg-neutral-800 w-9 h-9 flex justify-center items-center rounded-full 
                 transition-all duration-300 hover:bg-neutral-700 hover:scale-110 active:scale-95"
        >
            <BsChevronLeft className="text-white" />
        </button>
    );
};

export default PrevButton;