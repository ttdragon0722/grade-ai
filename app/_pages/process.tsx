import { Container } from "@/components/container";
import Carousel from "../_components/Carousel";
import DottedHr from "./ui/DottedHr";
const slides = [
    {
        title: "資料增強",
        description: "使用文獻提供的資料增強方法，增強後資料集能顯著提升模型的泛化能力與穩定性。",
        img: "/資料增強debug.png",
    },
    {
        title: "YOLO訓練結果",
        description: "mAP@0.5 ≈ 97%：題號、答案區、題幹皆達高準確率。強健性高：低對比度、雜訊背景下仍能穩定定位。",
        img: "/yolo new - 複製.png",
    },
    {
        title: "資料增強比較",
        description: "直覺化的使用體驗，簡化操作流程。",
        img: "/result vs - 複製.png",
    },
    {
        title: "CNN-OCR訓練結果",
        description: "能有效辨識手寫選項（A–F）及布林符號（○、✗）",
        img: "/訓練成果 - 複製.png",
    },
    {
        title: "排序匹配和分組",
        description: "每張試卷少於 1000 個框，選擇 最近鄰居法 (Nearest Neighbor)，在準確度與速度間取得最佳平衡。",
        img: "/image.png",
    },
];

const Process = () => {
    return <div className="relative h-screen flex justify-center items-center pt-16 bg-white z-10 text-black">
        <Container>
            <h1 className="text-3xl font-bold mb-6">專題成果展示</h1>
            <Carousel slides={slides} />
            <DottedHr/>
        </Container>
    </div>
}

export default Process;