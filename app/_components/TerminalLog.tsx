import React from 'react';
import { motion, Variants } from 'framer-motion';

// --- 1. 定義 Props 類型 ---
interface LogTerminalProps {
    logMessages: string[]; // 接收一個字串陣列作為日誌內容
}

// --- 2. Framer Motion Variants 定義 (與之前相同) ---

// 容器 (Container) 的 variants，用於控制其子元素 (LogLine) 的動畫
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            // staggerChildren: 子元素之間動畫開始的延遲時間
            staggerChildren: 0.5, // 每行日誌開始動畫的間隔時間
            delayChildren: 0.5,   // 第一個子元素開始動畫前的延遲時間
        },
    },
};

// LogLine 的 variants，用於控制其子元素 (Character) 的動畫
const lineVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.03, // 每個字符開始動畫的間隔時間 (0.03秒)
        },
    },
};

// 字符 (Character) 的 variants
const charVariants: Variants = {
    hidden: { opacity: 0, x: -5 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            damping: 12,
            stiffness: 200,
        },
    },
};

// --- 3. 元件定義 ---

const LogTerminal: React.FC<LogTerminalProps> = ({ logMessages }) => {
    return (
        // 外層容器，設定終端機風格
        <motion.div
            className="terminal-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                backgroundColor: '#1e1e1e', // 終端機背景色
                color: '#00ff41',           // 綠色文字
                padding: '20px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                minHeight: '250px',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)', // 增加微光效果
            }}
        >
            {logMessages.map((line, lineIndex) => (
                // 每一行日誌
                <motion.p
                    key={lineIndex}
                    className="log-line"
                    variants={lineVariants}
                    // 加入一個小小的進入縮放效果
                    whileInView={{ scale: 1, transition: { duration: 0.3 } }}
                    initial={{ scale: 0.98 }}
                    style={{ margin: '4px 0', lineHeight: '1.4' }}
                >
                    {/* 將每一行文字拆分成字符，用於打字效果 */}
                    {Array.from(line).map((char, charIndex) => (
                        // 每個字符
                        <motion.span
                            key={charIndex}
                            className="log-char"
                            variants={charVariants}
                            style={{ display: 'inline-block' }}
                        >
                            {char === ' ' ? '\u00a0' : char}
                        </motion.span>
                    ))}
                </motion.p>
            ))}
        </motion.div>
    );
};

export default LogTerminal;