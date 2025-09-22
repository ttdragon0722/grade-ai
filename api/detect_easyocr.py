import easyocr
import numpy as np
import cv2
import os

class OCRDetector:
    """
    一個用於辨識圖像區塊中文字的 OCR 偵測器。
    在辨識前會自動進行圖片預處理，以提高準確率。
    """
    def __init__(self, languages=['en'], gpu=True):
        """
        初始化 OCR 引擎。
        :param languages: 欲辨識的語言列表，如 ['en']。
        :param gpu: 如果有 NVIDIA 顯卡，設定為 True 以啟用 GPU 加速。
        """
        print("初始化 EasyOCR 引擎...")
        self.reader = easyocr.Reader(languages, gpu=gpu)
        print("EasyOCR 引擎初始化完成。")

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        對圖片進行灰階和二值化處理，增強文字與背景的對比。
        :param image: 原始圖片 (NumPy array)。
        :return: 預處理後的圖片 (NumPy array)。
        """
        # 1. 將圖片轉為灰階
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. 進行二值化處理，讓文字更突出
        # 使用 OTSU 方法自動尋找最佳閾值，效果通常比手動設定更好
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

        # 在辨識前先進行圖片預處理
        processed_image = self.preprocess_image(cropped_image)

        # 使用 EasyOCR 對處理後的圖像進行辨識
        results = self.reader.readtext(processed_image)
        
        recognized_text = ""
        if results:
            # 取得辨識結果中，信賴度最高的第一個文字
            # results 的結構是 [(bbox, text, prob), ...]
            recognized_text = results[0][1].strip()

        return recognized_text

# --- 主要執行部分 ---
if __name__ == '__main__':
    image_folder = 'items'
    
    if not os.path.isdir(image_folder):
        print(f"錯誤：找不到資料夾 '{image_folder}'。")
        os.makedirs(image_folder, exist_ok=True)
        print(f"已建立測試資料夾 '{image_folder}'。")
        
        # 建立幾張模擬圖片
        dummy_image1 = np.zeros((60, 200, 3), dtype=np.uint8)
        cv2.putText(dummy_image1, 'Question 1.', (5, 45), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.imwrite(os.path.join(image_folder, 'test_img_1.jpg'), dummy_image1)

        dummy_image2 = np.zeros((60, 200, 3), dtype=np.uint8)
        cv2.putText(dummy_image2, 'Problem 2.', (5, 45), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.imwrite(os.path.join(image_folder, 'test_img_2.png'), dummy_image2)
        print("已在資料夾中建立測試圖片。")

    ocr_detector = OCRDetector()

    for filename in os.listdir(image_folder):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            image_path = os.path.join(image_folder, filename)
            image = cv2.imread(image_path)
            
            if image is not None:
                detected_string = ocr_detector.detect(image)
                
                if detected_string:
                    print(f"檔案 '{filename}' 辨識到的文字是：'{detected_string}'")
                else:
                    print(f"檔案 '{filename}' 無法辨識出文字，請檢查圖片品質。")
            else:
                print(f"無法讀取檔案 '{filename}'，可能不是有效的圖片。")