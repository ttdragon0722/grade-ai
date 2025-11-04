import { Container } from "@/components/container";
import DottedHr from "./ui/DottedHr";
import SectionTitle from "./ui/SectionTitle";
import WorkHoursChart from "./ui/WorkHoursChart";

const Motivation = () => {
    return <section id="motivation" className="relative bg-white z-10">
        <Container>
            <SectionTitle>研究動機：教師現場的「批改」之痛</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">

                {/* 痛點卡片 1 */}
                <div className="bg-red-50 p-6 rounded-xl shadow-lg hover-lift">
                    <div className="text-5xl text-red-600 mb-4">⏱️</div>
                    <h3 className="text-2xl font-bold mb-2 text-red-700">耗時的重複勞動</h3>
                    <p className="text-gray-600">批改作業與評估工作佔用教師每日約 **2.7小時**，嚴重壓縮備課、進修與教學創新的時間。</p>
                </div>

                {/* 痛點卡片 2 */}
                <div className="bg-red-50 p-6 rounded-xl shadow-lg hover-lift">
                    <div className="text-5xl text-red-600 mb-4">📉</div>
                    <h3 className="text-2xl font-bold mb-2 text-red-700">主觀與疲勞誤差</h3>
                    <p className="text-gray-600">人工批改可能因標準不一產生主觀偏差，或因長期疲勞導致評分準確度下降，影響教學品質。</p>
                </div>

                {/* 痛點卡片 3 */}
                <div className="bg-red-50 p-6 rounded-xl shadow-lg hover-lift">
                    <div className="text-5xl text-red-600 mb-4">🚀</div>
                    <h3 className="text-2xl font-bold mb-2 text-red-700">推動教育科技</h3>
                    <p className="text-gray-600">缺乏「全校可用、即裝即用」的智慧評量工具，本專題目標填補此空缺，推動教育數位化。</p>
                </div>
            </div>
            <DottedHr />
            <WorkHoursChart />
            <DottedHr />
        </Container>
    </section>
}


export default Motivation;