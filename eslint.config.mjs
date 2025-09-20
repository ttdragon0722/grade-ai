import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "quotes": ["error", "double"], // 強制使用雙引號
      "no-unused-vars": ["warn", , { "varsIgnorePattern": "^EObjectFit$" }], // 警告沒使用的變數
      "semi": ["error", "always"], // 結尾補上分號
    },
  },
];

export default eslintConfig;
