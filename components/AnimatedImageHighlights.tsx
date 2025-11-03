import React, { useState, useMemo, useEffect, JSX } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// --- 1. Props 型別定義 (保持不變) ---
interface Highlight {
    top: number;
    left: number;
    width: number;
    height: number;
    labelText: string;
}

type SceneHighlights = Highlight[];

interface AnimatedQAHighlightsProps {
    imageUrl: string;
    questionScan: SceneHighlights;
    answerScan: SceneHighlights;
    // 總循環週期
    autoPlayInterval?: number;
    className?:string;
}

// --- 定義組件的四個階段 (保持不變) ---
type DisplayStage = 'idle' | 'question' | 'answer_boxes' | 'connection';

// --- 輔助函式：計算高亮框的中心點 (百分比) (保持不變) ---
interface Point { x: number; y: number; }
const getCenter = (h: Highlight): Point => ({
    x: h.left + h.width / 2,
    y: h.top + h.height / 2,
});
const getTopLeft = (h: Highlight): Point => ({
    x: h.left,
    y: h.top,
});

// **新常數：設定退出動畫的時長 (0.4 秒 = 400 毫秒)**
const EXIT_ANIMATION_DURATION = 400;

// --- 2. 連線組件 (使用 SVG) ---
interface ConnectionLinesProps {
    questionScan: SceneHighlights;
    answerScan: SceneHighlights;
}

// Framer Motion SVG Path Variants for drawing the line (連線動畫)
const lineVariants: Variants = {
    // 使用 EXIT_ANIMATION_DURATION
    exit: { pathLength: 0, opacity: 0, transition: { duration: EXIT_ANIMATION_DURATION / 1000 } }, 
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
        pathLength: 1, 
        opacity: 1, 
        transition: { 
            duration: 0.8,
            ease: "easeInOut",
            delay: 0.1
        } 
    }),
};

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ questionScan, answerScan }) => {
    
    // 一對一連線：取較短的長度
    const connectionCount = Math.min(questionScan.length, answerScan.length);
    if (connectionCount === 0) return null;
    
    const connections: JSX.Element[] = [];
    let lineIndex = 0; 
    
    for (let i = 0; i < connectionCount; i++) {
        const q = questionScan[i];
        const a = answerScan[i];

        const qCenter = getCenter(q);
        const qTopLeft = getTopLeft(q);
        const aCenter = getCenter(a);
        
        // 1. 題目中心點 -> 作答中心點 (紅色)
        const pathDataCenterToCenter = `M ${qCenter.x} ${qCenter.y} L ${aCenter.x} ${aCenter.y}`;
        connections.push(
            <motion.path
                key={`cc-${i}`}
                d={pathDataCenterToCenter}
                stroke="#FF0000"
                strokeWidth="0.5"
                fill="none"
                variants={lineVariants}
                custom={lineIndex++}
            />
        );
        
        // 2. 題目左上角 -> 作答中心點 (藍色)
        const pathDataTopLeftToCenter = `M ${qTopLeft.x} ${qTopLeft.y} L ${aCenter.x} ${aCenter.y}`;
        connections.push(
            <motion.path
                key={`tlc-${i}`}
                d={pathDataTopLeftToCenter} 
                stroke="#0000FF"
                strokeWidth="0.5" 
                fill="none"
                variants={lineVariants}
                custom={lineIndex++}
                style={{ pathLength: 0, opacity: 0 }}
            />
        );
    }

    return (
        <motion.svg
            key="connection-lines"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {connections}
        </motion.svg>
    );
};


const AnimatedQAHighlights: React.FC<AnimatedQAHighlightsProps> = ({
    imageUrl,
    questionScan,
    answerScan,
    // 預設總時長 6000ms (2000 + 1500 + 2500)
    autoPlayInterval = 8000 ,
    className
}) => {

    const [stage, setStage] = useState<DisplayStage>('idle');
    
    // --- 定義各階段的時長 (保持不變) ---
    const QUESTION_DISPLAY_TIME = 2000; 
    const ANSWER_BOXES_DISPLAY_TIME = 1500; 
    const CONNECTION_DISPLAY_TIME = 2500; 
    
    const TOTAL_CYCLE_TIME = autoPlayInterval;
    // IDLE_TIME 仍按照總週期計算，但最短為 0
    const IDLE_TIME = Math.max(0, TOTAL_CYCLE_TIME - QUESTION_DISPLAY_TIME - ANSWER_BOXES_DISPLAY_TIME - CONNECTION_DISPLAY_TIME); 


    // --- 核心功能：使用 setTimeout 精確控制階段切換 ---
    useEffect(() => {
        if (questionScan.length === 0 && answerScan.length === 0) return;

        let timer: NodeJS.Timeout;

        switch (stage) {
            case 'idle':
                // **修正的關鍵點：等待 IDLE_TIME + EXIT_ANIMATION_DURATION 之後才進入 'question'**
                const totalWaitTime = IDLE_TIME + EXIT_ANIMATION_DURATION;
                timer = setTimeout(() => {
                    setStage('question');
                }, totalWaitTime);
                break;
                
            case 'question':
                // 階段 1 (顯示題目框): 經過 QUESTION_DISPLAY_TIME 後，進入 'answer_boxes'
                timer = setTimeout(() => {
                    setStage('answer_boxes');
                }, QUESTION_DISPLAY_TIME);
                break;

            case 'answer_boxes':
                // 階段 2 (顯示答案框，等待連線): 經過 ANSWER_BOXES_DISPLAY_TIME 後，進入 'connection'
                timer = setTimeout(() => {
                    setStage('connection');
                }, ANSWER_BOXES_DISPLAY_TIME);
                break;
                
            case 'connection':
                // 階段 3 (連線動畫): 經過 CONNECTION_DISPLAY_TIME 後，循環回 'idle'
                timer = setTimeout(() => {
                    setStage('idle');
                }, CONNECTION_DISPLAY_TIME);
                break;
        }

        return () => {
            clearTimeout(timer);
        };
    }, [stage, questionScan, answerScan, IDLE_TIME, QUESTION_DISPLAY_TIME, ANSWER_BOXES_DISPLAY_TIME, CONNECTION_DISPLAY_TIME]);


    // --- Framer Motion Variants (保持不變) ---
    const itemVariants: Variants = {
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 10 },
        },
        ready: { 
            opacity: 1,
            scale: 1,
            transition: { when: "afterChildren", staggerChildren: 0.1 }
        }
    };

    const labelVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "tween", duration: 0.3, delay: 0.1 }
        },
    };

    return (
        <div className={clsx("relative max-w-4xl",className)}>

            {/* 圖片 */}
            <img
                src={imageUrl}
                alt="Highlighted elements"
                className="w-full h-auto rounded-lg shadow-2xl"
            />

            {/* 高亮層 (問題/答案框) */}
            <AnimatePresence>
                {/* 只有在非 idle 階段才渲染整個高亮層容器 */}
                {stage !== 'idle' && (
                    <motion.div
                        key="qa-highlight-boxes" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        // 確保在回到 'idle' 時，題目框能平滑消失，時間使用 EXIT_ANIMATION_DURATION
                        exit={{ opacity: 0, transition: { duration: EXIT_ANIMATION_DURATION / 1000 } }} 
                        className="absolute inset-0"
                    >
                        {/* 1. 題目框 (Question Boxes): 在所有非 idle 階段都穩定存在，當父容器 exit 時一起消失 */}
                        {questionScan.map((highlight, index) => {
                            const borderColor = 'border-yellow-400';
                            const labelBgColor = 'bg-yellow-400';
                            
                            return (
                                <motion.div
                                    key={`q-${index}`} // 穩定的 key 確保元素在 stage 轉換時不被替換
                                    variants={itemVariants}
                                    initial="hidden" // 第一次進入時執行動畫
                                    animate="visible"
                                    className={`absolute border-2 rounded-md overflow-hidden ${borderColor}`}
                                    style={{
                                        top: `${highlight.top}%`,
                                        left: `${highlight.left}%`,
                                        width: `${highlight.width}%`,
                                        height: `${highlight.height}%`,
                                    }}
                                >
                                    {/* 標籤 (Label) */}
                                    <motion.div
                                        variants={labelVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className={`absolute bottom-0 right-0 p-1 lg:p-2 text-white font-bold text-[8px] lg:text-sm tracking-wider shadow-lg ${labelBgColor}`}
                                    >
                                        {highlight.labelText}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                        
                        {/* 2. 答案框 (Answer Boxes): 使用 AnimatePresence 獨立控制進入/退出 */}
                        <AnimatePresence>
                            {/* 只有在 'answer_boxes' 或 'connection' 階段才渲染答案框 */}
                            {(stage === 'answer_boxes' || stage === 'connection') && (
                                <>
                                    {answerScan.map((highlight, index) => {
                                        const borderColor = 'border-red-500';
                                        
                                        return (
                                            <motion.div
                                                key={`a-${index}`} // 確保答案框有自己的 key
                                                variants={itemVariants}
                                                initial="hidden" // 在 'answer_boxes' 階段進入時執行動畫
                                                animate="visible"
                                                exit="exit" // 在離開 'answer_boxes' 或 'connection' 時執行退出動畫
                                                className={`absolute border-2 rounded-md overflow-hidden ${borderColor}`}
                                                style={{
                                                    top: `${highlight.top}%`,
                                                    left: `${highlight.left}%`,
                                                    width: `${highlight.width}%`,
                                                    height: `${highlight.height}%`,
                                                }}
                                            />
                                        );
                                    })}
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* 連線層：只有在 'connection' 階段才渲染 */}
            <AnimatePresence>
                {stage === 'connection' && (
                    <ConnectionLines 
                        questionScan={questionScan} 
                        answerScan={answerScan} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedQAHighlights;
