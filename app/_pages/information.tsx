import { Container } from "@/components/container";
import { FaFilePdf } from "react-icons/fa";
import DottedHr from "./ui/DottedHr";
import SectionTitle from "./ui/SectionTitle";

const Information = () => {
    const openFC = () => {
        window.open("/FC_2025_paper_21.pdf", "_blank");
    };
    const openTWELF = () => {
        window.open("/基於光學字元辨識之智慧閱卷模型.pdf", "_blank");
    };

    return (
        <div className="relative pt-16 bg-white z-10 text-black">
            <Container>
                <SectionTitle>專題介紹與技術文件</SectionTitle>
                <br/>
                <br/>

                <div className="flex flex-col md:flex-row-reverse gap-8 items-start">

                    {/* 更多資訊區塊 */}
                    <div className="w-full md:w-1/2 space-y-6">
                        <h2 className="text-2xl font-semibold border-b-2 border-gray-300 pb-1">
                            更多資訊
                        </h2>

                        {/* PDF 一整條區塊 */}
                        <div
                            onClick={openFC}
                            className="flex items-center gap-1 justify-between p-4 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer shadow-md transition"
                        >
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        The 16th International Conference on Frontier Computing (FC 2026)
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        點擊開啟 PDF 檔案
                                    </p>
                                </div>
                            </div>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                開啟
                            </button>
                        </div>

                        {/* 第二份 PDF */}
                        <div
                            onClick={openTWELF}
                            className="flex items-center justify-between p-4 gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer shadow-md transition"
                        >
                            <div className="flex items-center gap-3">
                                
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        第二十屆台灣數位學習發展研討會 (TWELF 2025)
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        點擊開啟 PDF 檔案
                                    </p>
                                </div>
                            </div>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                開啟
                            </button>
                        </div>

                        <p className="text-gray-700 leading-relaxed">
                            了解更多關於我們專題的技術、研究背景與成果。
                        </p>
                    </div>

                    {/* 專題影片區塊 */}
                    <div className="w-full md:w-1/2 space-y-4">
                        <h2 className="text-2xl font-semibold border-b-2 border-gray-300 pb-1">
                            專題影片
                        </h2>
                        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/YaaCPuPxjYQ?si=41GU88r1DDKMxxnK"
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>

                </div>
                <DottedHr />
            </Container>
        </div>
    );
};

export default Information;
