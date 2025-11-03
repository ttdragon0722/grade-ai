"use client";
import React from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const dataItems = [
    { name: "上課", value: 4.13, color: "#6BA8A9" },
    { name: "批改作業及評估學生", value: 2.7, color: "#E6B655" },
    { name: "備課", value: 1.2, color: "#A77464" },
    { name: "處理學生問題及訓導", value: 0.91, color: "#8E9AAF" },
];

const chartData = {
    labels: dataItems.map(item => item.name),
    datasets: [
        {
            data: dataItems.map(item => item.value),
            backgroundColor: dataItems.map(item => item.color),
            hoverOffset: 10,
        },
    ],
};

const chartOptions = {
    responsive: true,
    animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1200,
        easing: "easeOutCubic" as const,
    },
    plugins: {
        legend: {
            position: "bottom" as const,
            labels: { color: "#333" }, // 白色背景下要深色文字
        },
        tooltip: {
            backgroundColor: "#1f2937",
            titleColor: "#f9fafb",
            bodyColor: "#f9fafb",
            borderRadius: 8,
        },
    },
};

const total = dataItems.reduce((sum, item) => sum + item.value, 0);

export default function WorkHoursChart() {
    return (
        <div className="w-full p-6 rounded-2xl bg-white text-black py-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">工作時數統計</h2>


            <div className="flex flex-col-reverse md:flex-row justify-center items-center w-full gap-5">
                <div className="w-80 h-80">
                    <Pie data={chartData} options={chartOptions} />
                </div>
                <div className="w-full max-w-md">
                    <div>相關研究發現，批改工作佔用過多時間<br/>
                        嚴重壓縮教師教學與備課，需透過減負措施或科技輔助改善</div>
                    <table className="w-full text-left border-collapse my-5">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="pb-2">工作項目</th>
                                <th className="pb-2 text-right">時數 (小時)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataItems.map((item, i) => (
                                <tr key={i} className="border-b border-gray-200 hover:bg-gray-100 transition">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-right">{item.value.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="font-semibold text-lg text-teal-500">
                                <td className="pt-3">總數</td>
                                <td className="pt-3 text-right">{total.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="text-right text-[10px]">資料來源：李傑江、胡少偉、梁偉才、鄧兆鴻，《小學教師工作量研究》，香港初等教育研究學會</div>
                </div>
            </div>
        </div>

    );
}
