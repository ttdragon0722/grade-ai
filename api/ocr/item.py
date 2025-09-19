import os
import cv2
import pytesseract
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def preprocess_image(img):
    """對圖片進行灰階 + 二值化處理"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    return binary

def extract_exam_number(img):
    """使用 Tesseract OCR 辨識考卷上的數字"""
    text = pytesseract.image_to_string(img, config='--psm 7 --oem 3 -c tessedit_char_whitelist=0123456789')
    return text.strip()

def extract_text_from_bbox(img, bbox, save_dir="items", file_prefix="item"):
    """ 從指定 BBox 區域內執行 OCR 辨識，並將擷取的區域存到資料夾 """
    x1, y1, x2, y2 = map(int, bbox)  # 取得座標
    roi = img[y1:y2, x1:x2]  # 裁切 BBox

    # 確保資料夾存在
    os.makedirs(save_dir, exist_ok=True)

    # 儲存擷取到的區域（原始）
    raw_save_path = os.path.join(save_dir, f"{file_prefix}_{x1}_{y1}_{x2}_{y2}_raw.png")
    cv2.imwrite(raw_save_path, roi)

    # 預處理影像
    # processed_img = preprocess_image(roi)

    # 儲存處理後的影像
    processed_save_path = os.path.join(save_dir, f"{file_prefix}_{x1}_{y1}_{x2}_{y2}_processed.png")
    # cv2.imwrite(processed_save_path, processed_img)

    # 執行 OCR
    text = extract_exam_number(roi)

    return text.strip()
