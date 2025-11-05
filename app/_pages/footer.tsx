import React, { useState } from "react";

interface FooterProps {
    year?: number;
}

export default function Footer({ year = new Date().getFullYear() }: FooterProps) {
    const [open, setOpen] = useState(false);

    const references: string[] = [
        "Lee, K.-K., Wu, S.-W., Leung, W.-C., Tang, S.-H.: A Study on the Workload of Hong Kong Primary School Teachers. The Hong Kong Primary Education Research Association, Hong Kong ( )",
        "WongKinYiu/yolov7, https://github.com/WongKinYiu/yolov7, last accessed 2023/11/25.",
        "Yao, X., Sun, H., Li, S., Lu, W.: Invoice Detection and Recognition System Based on Deep Learning. Comput. Intell. Neurosci. 2022, Article 8032726 (2022). https://doi.org/10.1155/2022/8032726",
        "Sugiyono, A.Y., Adrio, K., Tanuwijaya, K., Suryaningrum, K.M.: Extracting Information from Vehicle Registration Plate using OCR Tesseract. Computer Science Department, Bina Nusantara University, Jakarta, Indonesia (2023).",
        "HumanSignal/labelImg, https://github.com/HumanSignal/labelImg, last accessed 2023/09/23.",
        "Yang, S., Xiao, W., Zhang, M., Guo, S., Zhao, J., Shen, F.: Image Data Augmentation for Deep Learning: A Survey. arXiv preprint arXiv:2204.08610 [cs.CV] (2022). https://doi.org/10.48550/arXiv.2204.08610",
        "Wojke, N., Bewley, A., Paulus, D., Simple Online and Realtime Tracking with a Deep Association Metric. arXiv preprint arXiv:1703.07402 [cs.CV] (2017). https://arxiv.org/abs/1703.07402",
        "TensorFlow CNN tutorial, https://www.tensorflow.org/tutorials/images/cnn, last accessed 2024/08/16.",
        "Lee, Kit-kong, Siu-wai Wu, Wai-choi Leung, and Siu-hung Tang. n.d. A Study on the Workload of Hong Kong Primary School Teachers. The Hong Kong Primary Education Research Association."
    ];

    return (
        <footer className="relative bg-gray-50 text-gray-800 border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="text-sm space-y-1">
                        <p>© {year} 國立台中科技大學 資訊與流通學院 專題成果展</p>
                        <p>聯絡信箱：<a href="mailto:a0909956502@gmail.com">a0909956502@gmail.com</a></p>
                        <p className="text-xs text-gray-500">僅供學術/展示用途，非商業營運。</p>

                        <div className="mt-3 text-sm">
                            <p className="font-medium">指導老師：</p>
                            <ul className="list-disc list-inside ml-2">
                                <li>黃祈勝</li>
                                <li>劉嘉雯</li>
                            </ul>
                            <p className="font-medium mt-2">組員：</p>
                            <ul className="list-disc list-inside ml-2">
                                <li>資工五甲</li>
                                <li>賴家煜</li>
                                <li>黃馨蝶</li>
                            </ul>
                            <p className="font-medium mt-2">組別：</p>
                            <p className="ml-2">智慧運算創新應用（日間部）</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end">
                        <button
                            onClick={() => setOpen(!open)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm shadow-sm hover:shadow focus:outline-none"
                        >
                            {open ? "隱藏參考文獻" : "顯示參考文獻"}
                            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 11-1.414 1.414L10 5.414 5.707 9.707A1 1 0 114.293 8.293l5-5A1 1 0 0110 3z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {open && (
                            <div className="mt-4 w-full md:w-96 bg-white border rounded-md p-4 text-xs text-gray-700 shadow">
                                <h4 className="font-medium mb-2">參考文獻（References）</h4>
                                <ol className="list-decimal list-inside space-y-1">
                                    {references.map((r, i) => (
                                        <li key={i} className="break-words">{r}</li>
                                    ))}
                                </ol>
                                <p className="mt-3 text-xs text-gray-500">建議：若為正式學術報告，請採用統一引用格式（如 APA / IEEE）並在報告內標示對應出處。</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>若需引用或使用本系統資料，請聯絡負責人信箱。</p>
                </div>
            </div>
        </footer>
    );
}