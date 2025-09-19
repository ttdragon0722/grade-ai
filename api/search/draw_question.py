import cv2
import random
import pytesseract
import numpy as np
import matplotlib.pyplot as plt


def plot_one_box_with_connection(question, item, img, color=None, line_thickness=3, ocr_text=None):
    """
    繪製框與連線，並在 Item (右下角) 顯示 OCR 結果
    - Question：標示右下角 (x2, y2)
    - Item：標示左上角 (x1, y1)
    - 連線：從 Question (右下) 到 Item (左上)
    - OCR 文字顯示在 Item 的右下角，帶背景色
    """
    q_x1, q_y1, q_x2, q_y2, q_conf, q_cls = question
    i_x1, i_y1, i_x2, i_y2, i_conf, i_cls = item

    # 生成顏色
    color = color or [random.randint(0, 255) for _ in range(3)]
    tl = line_thickness or round(0.002 * (img.shape[0] + img.shape[1]) / 2) + 1  # 線條厚度

    # 繪製 Question (紅色框)
    cv2.rectangle(img, (q_x1, q_y1), (q_x2, q_y2), (0, 0, 255), thickness=tl, lineType=cv2.LINE_AA)

    # 繪製 Item (綠色框)
    cv2.rectangle(img, (i_x1, i_y1), (i_x2, i_y2), (0, 255, 0), thickness=tl, lineType=cv2.LINE_AA)

    # 連線 (紅色線)
    cv2.line(img, (q_x2, q_y2), (i_x1, i_y1), color, thickness=2)

    # 在 Item 的右下角顯示 OCR 結果
    if ocr_text:
        text_x = i_x2  # 文字起始點 X 座標（Item 右下角）
        text_y = i_y2  # 文字起始點 Y 座標（Item 右下角）
        
        font_scale = 0.7  # 字體大小
        font_thickness = 2
        font = cv2.FONT_HERSHEY_SIMPLEX

        # 計算文本寬度 & 高度
        (text_w, text_h), _ = cv2.getTextSize(ocr_text, font, font_scale, font_thickness)

        # 設定背景框 (稍微大一點以容納文字)
        bg_x1, bg_y1 = text_x, text_y - text_h - 5  # 背景左上角
        bg_x2, bg_y2 = text_x + text_w + 10, text_y + 5  # 背景右下角

        # 防止超出邊界
        img_h, img_w, _ = img.shape
        bg_x1 = max(0, min(bg_x1, img_w - text_w - 10))
        bg_y1 = max(0, min(bg_y1, img_h - text_h - 5))
        bg_x2 = min(img_w, bg_x2)
        bg_y2 = min(img_h, bg_y2)

        # 繪製背景色 (黃色)
        cv2.rectangle(img, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 255, 255), -1)

        # 繪製文字 (黑色)
        cv2.putText(img, ocr_text, (bg_x1 + 5, bg_y2 - 5), font, font_scale, (0, 0, 0), font_thickness, lineType=cv2.LINE_AA)

        
def extract_text_from_bbox(img, bbox):
    """ 從指定 BBox 區域內執行 OCR 辨識（針對數字強化） """
    x1, y1, x2, y2 = map(int, bbox)  # 取得座標
    roi = img[y1:y2, x1:x2]  # 裁切 BBox

    # 轉換為灰階
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) if len(roi.shape) == 3 else roi

    # **使用自適應二值化**（比固定閥值更適合不同光線）
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)

    # **去除雜訊**
    kernel = np.ones((2,2), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)  # 填補斷裂
    binary = cv2.medianBlur(binary, 3)  # 去除細小雜訊

    # **執行 OCR**
    custom_config = r'--oem 3 --psm 11 -c tessedit_char_whitelist=0123456789'
    text = pytesseract.image_to_string(binary, config=custom_config)

    return text.strip()

