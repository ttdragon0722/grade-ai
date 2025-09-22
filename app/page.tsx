"use client";
import Image from "next/image";

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // 每個子元素延遲 0.2 秒
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

function ListExample() {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="space-y-4"
    >
      {["A", "B", "C"].map((text) => (
        <motion.li
          key={text}
          variants={item}
          className="p-4 bg-purple-500 text-white rounded-lg"
        >
          {text}
        </motion.li>
      ))}
    </motion.ul>
  );
}

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 pb-20 gap-16 sm:p-20">
      <ListExample />
    </div>
  );
}
