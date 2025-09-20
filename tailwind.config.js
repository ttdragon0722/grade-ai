/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
    darkMode: "class", // 啟用 class 控制暗色
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // 根據你的專案路徑調整
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
