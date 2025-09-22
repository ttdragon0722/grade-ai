import pytesseract
import numpy as np
import cv2
import os
from PIL import Image

# 如果你在 Windows 上，可能需要指定 Tesseract 的路徑
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

import re

def clean_ocr_text(text: str) -> str:
    """
    OCR 後處理：
    - 移除小數點 `.`
    - `%` 換成 `8`
    - 移除字母（如 h, a, b...）
    - 保留數字
    """
    # 1. 把 % 換成 8
    text = text.replace("%", "8")

    # 2. 移除小數點
    text = text.replace(".", "")

    # 3. 移除英文字母（只保留數字和替換後的 8）
    text = re.sub(r"[A-Za-z]", "", text)

    # 4. 移除多餘空白
    text = text.strip()

    return text

class TesseractOCRDetector:
    """
    一個用於辨識圖像區塊中文字的 OCR 偵測器。
    基於 Tesseract 引擎，並在辨識前進行圖片預處理。
    """
    def __init__(self):
        """
        初始化 OCR 引擎。
        """
        print("初始化 Tesseract OCR 引擎...")
        try:
            # 檢查 Tesseract 是否已安裝並可執行
            pytesseract.get_tesseract_version()
            print("Tesseract 引擎初始化完成。")
        except pytesseract.TesseractNotFoundError:
            raise RuntimeError("Tesseract 引擎未找到。請確認已安裝 Tesseract-OCR。")
            
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        對圖片進行灰階和二值化處理，增強文字與背景的對比。
        :param image: 原始圖片 (NumPy array)。
        :return: 預處理後的圖片 (NumPy array)。
        """
        # 將圖片轉為灰階
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 進行二值化處理
        _, binary_image = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        
        return binary_image

    def detect(self, cropped_image: np.ndarray) -> str:
        """
        接收一個 YOLO 裁切出的圖像區塊 (NumPy array)，並辨識其中的文字。
        :param cropped_image: 包含文字的圖像區塊，格式為 NumPy array。
        :return: 辨識出的文字字串，如果沒有辨識到則返回空字串。
        """
        if cropped_image is None or cropped_image.size == 0:
            return ""

        # 先進行圖片預處理
        processed_image = self.preprocess_image(cropped_image)
        
        # 將 OpenCV 圖片 (NumPy array) 轉換成 PIL Image 物件
        pil_image = Image.fromarray(processed_image)

        # 使用 pytesseract 進行辨識
        # config='--psm 6' 表示將圖片視為單一文字行
        try:
            text = text = pytesseract.image_to_string(
                pil_image, 
                config='--psm 11 '
            ).strip()
            return clean_ocr_text(text)
        except pytesseract.TesseractError:
            print("Tesseract 處理圖片時發生錯誤。")
            return ""
