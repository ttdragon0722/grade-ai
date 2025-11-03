"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react';
// 引入 GSAP 核心函式庫
import gsap from 'gsap';
// 引入 ScrollTrigger 插件
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 在應用程式初始化時註冊 ScrollTrigger 插件
// 確保只執行一次，讓 GSAP 知道如何使用 ScrollTrigger 的功能
gsap.registerPlugin(ScrollTrigger);


// ===================================================================
// 數據定義
// ===================================================================

interface StepContent {
  number: number;
  title: string;
  imgUrl: string;
}

const stepContent: StepContent[] = [
    { number: 1, title: "登入並新增資料", imgUrl: "https://placehold.co/400x700/0d47a1/ffffff?text=Step+1%0A(App+Login)" },
    { number: 2, title: "設定班級與學生", imgUrl: "https://placehold.co/400x700/312e81/ffffff?text=Step+2%0A(Class+Setup)" },
    { number: 3, title: "新增考卷與答案", imgUrl: "https://placehold.co/400x700/0f766e/ffffff?text=Step+3%0A(Answer+Key)" },
    { number: 4, title: "拍照/掃描考卷", imgUrl: "https://placehold.co/400x700/7e22ce/ffffff?text=Step+4%0A(Image+Input)" },
    { number: 5, title: "AI 運算與輸出報表", imgUrl: "https://placehold.co/400x700/15803d/ffffff?text=Step+5%0A(Result+Report)" },
];

const App: React.FC = () => {
    // ===================================================================
    // Ref 和 State 定義
    // ===================================================================
    const scrollWrapperRef = useRef<HTMLDivElement>(null);
    const stickyContainerRef = useRef<HTMLDivElement>(null);
    const horizontalSectionRef = useRef<HTMLDivElement>(null);
    const mockupImageRef = useRef<HTMLImageElement>(null);
    const carouselTrackRef = useRef<HTMLDivElement>(null);

    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 3;

    // ===================================================================
    // GSAP 水平滾動邏輯
    // ===================================================================
    useEffect(() => {
        // 由於已經在外部使用 import 並註冊，這裡不需要再檢查
        // if (!isGsapReady || !window.ScrollTrigger) return; 

        const container = horizontalSectionRef.current;
        const scrollWrapper = scrollWrapperRef.current;
        const mockupImage = mockupImageRef.current;

        if (!container || !scrollWrapper || !mockupImage) return;

        // const stepCards = container.querySelectorAll('.step-card'); // 這個變數沒有被使用，可以移除
        const totalSegments = stepContent.length - 1; 
        const scrollDistance = totalSegments * 100; // 400%

        let lastStepIndex = 0;

        const scrollTriggerInstance = ScrollTrigger.create({ // 使用導入的 ScrollTrigger
            trigger: scrollWrapper,
            pin: stickyContainerRef.current,
            start: "top top",
            end: () => `+=${scrollWrapper.offsetHeight - window.innerHeight}`,
            scrub: 1,
            
            animation: gsap.to(container, { // 使用導入的 gsap
                x: `-${scrollDistance}%`,
                ease: "none",
            }),

            onUpdate: (self: any) => {
                const segmentProgress = self.progress * totalSegments;
                const currentStepIndex = Math.max(0, Math.min(Math.round(segmentProgress), totalSegments));

                if (currentStepIndex !== lastStepIndex) {
                    lastStepIndex = currentStepIndex;
                    
                    // 手機畫面內容更新動畫
                    gsap.to(mockupImage, { opacity: 0, duration: 0.15, onComplete: () => { // 使用導入的 gsap
                        const content = stepContent[currentStepIndex];
                        
                        // 確保元素存在才能更新
                        const stepNumDisplay = document.getElementById('step-number-display');
                        const stepMockupTitle = document.getElementById('step-mockup-title');

                        if (stepNumDisplay) stepNumDisplay.innerText = content.number.toString();
                        if (stepMockupTitle) stepMockupTitle.innerText = content.title;
                        
                        mockupImage.src = content.imgUrl; // 更新圖片源
                        gsap.to(mockupImage, { opacity: 1, duration: 0.3 }); // 使用導入的 gsap 淡入新圖片
                    }});
                }
            }
        });

        return () => {
            scrollTriggerInstance.kill(); // 清理 ScrollTrigger
        };
    }, []); // 空依賴陣列，確保只執行一次

    // ===================================================================
    // 旋轉木馬邏輯
    // ===================================================================
    const changeSlide = useCallback((direction: number) => {
        const carouselTrack = carouselTrackRef.current;
        if (!carouselTrack) return; // 移除 isGsapReady 檢查

        let nextSlide = currentSlide + direction;
        
        if (nextSlide < 0) {
            nextSlide = totalSlides - 1; // 循環到最後
        } else if (nextSlide >= totalSlides) {
            nextSlide = 0; // 循環到開始
        }
        
        setCurrentSlide(nextSlide);
        
        // GSAP animation for smooth slide
        gsap.to(carouselTrack, { // 使用導入的 gsap
            x: `-${nextSlide * (100 / totalSlides)}%`, // 計算正確的 track 翻譯百分比
            duration: 0.6,
            ease: "power2.inOut"
        });
    }, [currentSlide, totalSlides]); // 依賴 currentSlide

    // ===================================================================
    // UI 結構
    // ===================================================================

    // 自定義 CSS 樣式元件
    const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="text-4xl section-title mx-auto text-center">{children}</h2>
    );

    // 內聯樣式覆蓋 (模擬原本 <style> 標籤中的樣式)
    const customStyles = `
        .section-title {
            position: relative;
            display: inline-block;
            margin-bottom: 2rem;
            color: #0d47a1;
            font-weight: 700;
        }
        .section-title::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -8px;
            width: 50%;
            height: 4px;
            background-color: #4f46e5;
            border-radius: 2px;
        }
        .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        #horizontal-section {
            display: flex;
            flex-direction: row;
            width: 500%;
            height: 100%;
        }
        .step-card {
            min-width: 20%;
            box-sizing: border-box;
            height: 100%;
        }
        #carousel-track {
            display: flex;
            width: 300%; 
            /* transition is handled by GSAP, remove from inline CSS */
        }
        .carousel-slide {
            flex-shrink: 0;
            width: calc(100% / 3);
            box-sizing: border-box;
        }
    `;

    return (
        <>
            {/* 注入自定義樣式 */}
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            {/* 導航列 (Navigation) */}
            <nav className="bg-white sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 text-xl font-bold text-indigo-600">
                            AI 智慧閱卷系統
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="#motivation" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150">研究動機</a>
                            <a href="#solution" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150">解決方案</a>
                            <a href="#results" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150">訓練成果</a>
                            <a href="#technology" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150">核心技術</a>
                            <a href="#future" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150">成果與展望</a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 區塊 I: 頂部介紹 (Hero) */}
            <header className="bg-indigo-600 text-white py-20 md:py-32 text-center shadow-2xl">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4">基於YOLO整合光學字元辨識之測驗閱卷文字特徵判別系統</h1>
                    <p className="text-xl md:text-2xl font-light mb-8 opacity-90">解放教師時間，讓 AI 專注於重複繁瑣的批改工作</p>
                    <p className="text-sm md:text-lg">
                        <span className="font-semibold">學院/學程:</span> 2025資訊與流通學院專題成果展 - 智慧運算創新應用 (日間部)
                    </p>
                    <p className="text-sm md:text-lg">
                        <span className="font-semibold">指導老師:</span> 黃祈勝、劉嘉雯 | 
                        <span className="font-semibold">組員:</span> 資工五甲 賴家煜、黃馨蝶
                    </p>
                </div>
            </header>

            {/* 區塊 II: 研究動機與痛點 (Motivation) */}
            <section id="motivation" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
                </div>
            </section>

            {/* 區塊 III: 解決方案與流程 (Solution) - 使用 GSAP 實現水平滾動動畫 */}
            <section id="solution" className="bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 text-center">
                    <SectionTitle>我們的解決方案：五步自動化批改</SectionTitle>
                    <p className="text-xl text-gray-700 mb-12">向下滾動，查看如何透過五個簡單步驟完成智慧閱卷！</p>
                </div>
                
                {/* 滾動動畫容器 - 模擬超長滾動條 (300vh) */}
                <div id="scroll-wrapper" ref={scrollWrapperRef} className="h-[300vh] relative bg-gray-100">
                    {/* 黏性容器 - 保持內容在視窗中不動 (h-screen) */}
                    <div id="sticky-container" ref={stickyContainerRef} className="sticky top-0 flex items-center h-screen overflow-hidden">
                        
                        {/* 左側：手機模型顯示 (電腦版佔 2/5) */}
                        <div className="hidden lg:flex w-2/5 h-full items-center justify-center p-8 bg-gray-50 relative border-r border-gray-200">
                            <div id="phone-mockup" className="w-full max-w-sm h-[80vh] bg-gray-900 rounded-[3rem] shadow-2xl border-[10px] border-gray-800 relative overflow-hidden">
                                {/* 動態螢幕內容 */}
                                <div id="mockup-screen" className="w-full h-full bg-white transition-all duration-700 ease-in-out">
                                    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
                                        <span id="step-number-display" className="text-6xl font-black text-indigo-500 mb-2">
                                            {stepContent[0].number}
                                        </span>
                                        <h4 id="step-mockup-title" className="text-2xl font-bold text-gray-800 mb-4">
                                            {stepContent[0].title}
                                        </h4>
                                        {/* 動態圖片佔位符 */}
                                        <img 
                                            ref={mockupImageRef}
                                            id="mockup-image" 
                                            src={stepContent[0].imgUrl} 
                                            alt="Step Screenshot" 
                                            className="w-full h-auto rounded-lg shadow-md transition-opacity duration-500"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null; 
                                                target.src = "https://placehold.co/400x700/0d47a1/ffffff?text=Image+Load+Error";
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* 底部Home Bar/Notch */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-xl"></div>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gray-300 rounded-full"></div>
                            </div>
                        </div>

                        {/* 右側：水平移動的內容區 (電腦版佔 3/5) */}
                        <div className="w-full lg:w-3/5 overflow-hidden h-full">
                            <div id="horizontal-section" ref={horizontalSectionRef} className="flex flex-nowrap h-full">
                                {stepContent.map((step, index) => (
                                    <div key={step.number} className={`step-card flex flex-col items-center justify-center p-8 text-center shadow-2xl 
                                        ${index === 0 ? 'bg-white' : index === 1 ? 'bg-indigo-50' : index === 2 ? 'bg-blue-50' : index === 3 ? 'bg-purple-50' : 'bg-green-50'}`}>
                                        
                                        <div className={`w-20 h-20 flex items-center justify-center text-white font-black text-4xl rounded-full mb-4 shadow-md 
                                            ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-indigo-600' : index === 2 ? 'bg-teal-600' : index === 3 ? 'bg-purple-600' : 'bg-green-600'}`}>
                                            {step.number}
                                        </div>
                                        <h3 className={`text-3xl font-extrabold mb-2 
                                            ${index === 0 ? 'text-blue-800' : index === 1 ? 'text-indigo-800' : index === 2 ? 'text-teal-800' : index === 3 ? 'text-purple-800' : 'text-green-800'}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-lg max-w-md text-gray-600">
                                            {index === 0 && '教師透過 Web 或 Line Bot 登入系統，建立課程或班級的基本資料。實現多平台接入。'}
                                            {index === 1 && '匯入學生名單，設定學號與姓名對應，建立數據報告的基礎，便於後續成績追蹤。'}
                                            {index === 2 && '上傳考卷範本並輸入正確答案，系統自動生成標準格式，作為 AI 批改時的對照基準。'}
                                            {index === 3 && '教師或學生使用手機或掃描儀批量上傳影像，影像會自動進行校正與預處理。'}
                                            {index === 4 && '系統立即啟動 YOLO/OCR 模組，完成批改並產生個人與班級成績分析報表，一鍵下載。'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 模組化設計 - 脫離滾動動畫 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pb-24">
                    <div className="mt-12 p-6 bg-indigo-100 border-l-4 border-indigo-500 rounded-lg text-left shadow-lg">
                        <p className="text-lg font-semibold text-indigo-800">平台模組化設計：</p>
                        <p className="text-indigo-700">支援 Web App、Line Bot、掃描系統、嵌入式系統等多種平台，實現真正的跨平台應用，確保隨時隨地可用性。</p>
                    </div>
                </div>
            </section>
            
            {/* 區塊 IV: 模型訓練成果展示 (Results Carousel) */}
            <section id="results" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionTitle>模型訓練成果展示：我們是如何做到的？</SectionTitle>
                    <p className="text-xl text-gray-700 mb-12">透過精確的物件偵測和手寫辨識，實現高準確度的自動批改。</p>

                    {/* 旋轉木馬容器 */}
                    <div className="relative overflow-hidden w-full max-w-5xl mx-auto rounded-xl shadow-2xl">
                        <div id="carousel-track" ref={carouselTrackRef}>
                            
                            {/* Slide 1: YOLOv7 區域偵測 */}
                            <div className="carousel-slide bg-blue-50 p-8 flex flex-col md:flex-row items-center justify-center">
                                <div className="md:w-1/2 p-4">
                                    {/* 佔位圖：YOLOv7 偵測結果 */}
                                    <img src="https://placehold.co/600x400/1e40af/ffffff?text=YOLOv7+區域偵測成果" alt="YOLOv7 Detection Results" className="rounded-lg shadow-xl mx-auto" onError={(e) => {const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/600x400/1e40af/ffffff?text=YOLOv7+區域偵測成果';}}/>
                                </div>
                                <div className="md:w-1/2 p-4 text-left">
                                    <h3 className="text-3xl font-bold text-blue-800 mb-3">YOLOv7 區域偵測</h3>
                                    <p className="text-xl text-gray-700 mb-4">精確定位題號、答案區與題幹</p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 font-medium">
                                        <li>**高準確率：** mAP@0.5 $\approx 97\%$</li>
                                        <li>**優勢：** 適用於大量影像處理，高強健性。</li>
                                        <li>**應用：** 將考卷影像切分成可辨識的小區域。</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Slide 2: CNN-OCR 手寫辨識 */}
                            <div className="carousel-slide bg-indigo-50 p-8 flex flex-col md:flex-row items-center justify-center">
                                <div className="md:w-1/2 p-4">
                                    {/* 佔位圖：CNN-OCR 訓練曲線 */}
                                    <img src="https://placehold.co/600x400/312e81/ffffff?text=CNN-OCR+訓練成果" alt="CNN-OCR Training Results" className="rounded-lg shadow-xl mx-auto" onError={(e) => {const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/600x400/312e81/ffffff?text=CNN-OCR+訓練成果';}}/>
                                </div>
                                <div className="md:w-1/2 p-4 text-left">
                                    <h3 className="text-3xl font-bold text-indigo-800 mb-3">CNN-OCR 手寫辨識</h3>
                                    <p className="text-xl text-gray-700 mb-4">專門識別手寫的選項符號</p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 font-medium">
                                        <li>**高準確率：** 驗證集接近 $100\%$ (已知樣本)</li>
                                        <li>**優勢：** 透過資料增強，泛化能力強。</li>
                                        <li>**應用：** 辨識手寫 (A-F) 及布林符號 (○、✗)。</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Slide 3: 數據增強比較 */}
                            <div className="carousel-slide bg-teal-50 p-8 flex flex-col md:flex-row items-center justify-center">
                                <div className="md:w-1/2 p-4">
                                    {/* 佔位圖：資料增強比較 */}
                                    <img src="https://placehold.co/600x400/047857/ffffff?text=數據增強比較" alt="Data Augmentation Comparison" className="rounded-lg shadow-xl mx-auto" onError={(e) => {const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/600x400/047857/ffffff?text=數據增強比較';}}/>
                                </div>
                                <div className="md:w-1/2 p-4 text-left">
                                    <h3 className="text-3xl font-bold text-teal-800 mb-3">數據增強效果</h3>
                                    <p className="text-xl text-gray-700 mb-4">確保模型對複雜環境的穩定性</p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 font-medium">
                                        <li>**YOLOv7 比較：** 增強後 mAP 穩定提升。</li>
                                        <li>**處理技術：** 旋轉、縮放、亮度變化、雜訊模擬。</li>
                                        <li>**效益：** 系統對低對比度、陰影、模糊等惡劣影像條件有高強健性。</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        {/* Carousel Nav Buttons */}
                        <button onClick={() => changeSlide(-1)} className="absolute bottom-4 right-16 bg-gray-900 text-white p-2 rounded-full opacity-75 hover:opacity-100 transition duration-300 shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button onClick={() => changeSlide(1)} className="absolute bottom-4 right-4 bg-gray-900 text-white p-2 rounded-full opacity-75 hover:opacity-100 transition duration-300 shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* 區塊 V: 核心技術架構 (Technology) */}
            <section id="technology" className="py-16 md:py-24 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionTitle>AI 核心技術：多模型整合架構</SectionTitle>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 items-center">
                        
                        {/* 技術說明 */}
                        <div>
                            <h3 className="text-3xl font-bold mb-6 text-gray-800">我們的解決方案採用三個核心模型協同工作，確保識別的**精確性**與**穩定性**。</h3>
                            
                            <ul className="space-y-6">
                                <li className="flex items-start space-x-3 p-4 border-l-4 border-green-500 bg-green-50 rounded-lg">
                                    <span className="text-2xl text-green-600 font-extrabold">1.</span>
                                    <div>
                                        <h4 className="text-xl font-semibold text-green-700">YOLOv7 區域偵測</h4>
                                        <p className="text-gray-700">負責精確定位題號、答案區與題幹。成果：**mAP@0.5 $\approx 97\%$**，適用於高速度、即時批改。</p>
                                    </div>
                                </li>
                                <li className="flex items-start space-x-3 p-4 border-l-4 border-red-500 bg-red-50 rounded-lg">
                                    <span className="text-2xl text-red-600 font-extrabold">2.</span>
                                    <div>
                                        <h4 className="text-xl font-semibold text-red-700">CNN-OCR 手寫辨識</h4>
                                        <p className="text-gray-700">使用 TensorFlow Keras CNN，專門識別手寫的選項 (A-F) 及布林符號 (○、✗)。透過資料增強，泛化能力強。</p>
                                    </div>
                                </li>
                                <li className="flex items-start space-x-3 p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg">
                                    <span className="text-2xl text-yellow-600 font-extrabold">3.</span>
                                    <div>
                                        <h4 className="text-xl font-semibold text-yellow-700">Tesseract-OCR 與數據匹配</h4>
                                        <p className="text-gray-700">負責識別印刷體題號，並結合**最近鄰居法** (Nearest Neighbor) 將題號與答案框進行精確配對。</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        {/* 視覺化圖表/流程圖佔位 */}
                        <div className="p-8 bg-white rounded-xl shadow-inner text-center">
                            <div className="text-9xl mb-4 text-gray-400">🤖</div>
                            <p className="text-lg text-gray-600 font-semibold">（此處為核心技術流程圖或系統架構圖佔位，實際應放上簡報中的架構圖）</p>
                            <p className="text-sm text-gray-500 mt-2">模型：YOLOv7 & CNN-OCR & Tesseract</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* 區塊 VI: 結論與未來展望 (Future) */}
            <section id="future" className="py-16 md:py-24 bg-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionTitle>結論與未來展望</SectionTitle>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        
                        {/* 階段成果 */}
                        <div className="p-8 bg-indigo-100 rounded-xl shadow-lg hover-lift">
                            <h3 className="text-3xl font-bold mb-4 text-indigo-700">✅ 階段性研究成果</h3>
                            <ul className="text-left space-y-3 text-indigo-800 font-medium">
                                <li className="flex items-start"><span className="mr-3 text-xl">🏆</span>已投稿至 **TWELF 2025** 第20屆台灣數位學習發展研討會。</li>
                                <li className="flex items-start"><span className="mr-3 text-xl">🌍</span>已投稿至 **The 15th International Conference on Frontier Computing (FC 2025)**。</li>
                                <li className="flex items-start"><span className="mr-3 text-xl">💡</span>核心 YOLOv7 區域偵測準確率達 **mAP@0.5 $\approx 97\%$**。</li>
                            </ul>
                        </div>

                        {/* 未來展望 */}
                        <div className="p-8 bg-green-100 rounded-xl shadow-lg hover-lift">
                            <h3 className="text-3xl font-bold mb-4 text-green-700">📈 持續優化與推廣</h3>
                            <ul className="text-left space-y-3 text-green-800 font-medium">
                                <li className="flex items-start"><span className="mr-3 text-xl">🖼️</span>技術優化：加強模型對潦草字跡、拍攝條件與背景雜訊的穩定性。</li>
                                <li className="flex items-start"><span className="mr-3 text-xl">⚙️</span>應用擴展：結合多媒體與複雜題型，擴展系統的應用範圍。</li>
                                <li className="flex items-start"><span className="mr-3 text-xl">🤝</span>教育影響：持續推廣至教學現場，為教師創造更多專業發展空間。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 頁腳 (Footer) */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm">
                        &copy; 2025 智慧運算創新應用 | 基於YOLO整合光學字元辨識之測驗閱卷文字特徵判別系統
                    </p>
                    <p className="text-xs mt-2 text-gray-400">
                        專案聯絡：資工五甲 賴家煜, 黃馨蝶
                    </p>
                </div>
            </footer>
        </>
    );
};

export default App;
