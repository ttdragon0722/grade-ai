from tensorflow.keras.models import load_model
import numpy as np
import os 
import cv2


HANDWRITE_MAP = ["A","B","C","D","E","F","O","X"]

handwrite_model = load_model("weights/ocr_best.keras")
handwrite_model.summary()
input_shape = handwrite_model.input_shape  # 例如 (None, 32, 32, 1)
print("模型輸入形狀:", input_shape)

confidence_threshold = 0.85

def detect_handwrite(img, bbox):
    """
    從圖片 bbox 區域裁切影像，並使用模型進行預測。
    - bbox: (x1, y1, x2, y2) 表示 BBox 範圍
    - img: 原始輸入圖像 (BGR)
    - model: 已加載的 Keras 模型
    - confidence_threshold: 設定信心分數閾值，低於該值則回傳 UNKNOWN
    """
    x1, y1, x2, y2 = map(int, bbox)  # 取得 BBox 座標
    roi = img[y1:y2, x1:x2]  # 裁切該區域

    # **確保 ROI 不為空**
    if roi.size == 0:
        return "EMPTY", 0.0

    os.makedirs("runs/output", exist_ok=True)

    # **轉換為灰階**
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) if len(roi.shape) == 3 else roi

    # **獲取模型預期的輸入尺寸**
    target_size = handwrite_model.input_shape[1:3]  # 例如 (64, 64)
    
    # **調整大小**
    resized = cv2.resize(gray, target_size, interpolation=cv2.INTER_LINEAR)

    # **標準化 (0~1) 並轉換形狀**
    normalized = resized.astype("float32") / 255.0
    input_data = np.expand_dims(normalized, axis=(0, -1))  # 增加 batch 軸 & channel 軸

    # **儲存處理後的影像**
    save_path = os.path.join("runs/output", f"bbox_{x1}_{y1}_{x2}_{y2}.png")
    cv2.imwrite(save_path, (normalized * 255).astype("uint8"))  # 轉回 0~255 並存檔
    print(f"Saved cropped image: {save_path}")

    # **執行模型預測**
    prediction = handwrite_model.predict(input_data)  # 輸出 shape: (1, num_classes)
    prediction = prediction[0]  # 取出 batch 維度，變成 (num_classes,)

    # **取得最大機率的類別索引與信心值**
    predicted_class = np.argmax(prediction)  # 取得最可能的類別索引
    confidence_score = float(np.max(prediction))  # 取得對應的機率（信心分數）

    # **確保索引不超過類別數量**
    if predicted_class >= len(HANDWRITE_MAP):
        return "UNKNOWN", confidence_score
    
    predicted_label = HANDWRITE_MAP[predicted_class]  # 取得對應類別名稱

    # **如果信心分數低於設定閾值，則回傳 UNKNOWN**
    if confidence_score < confidence_threshold:
        return "UNKNOWN", confidence_score

    return predicted_label, confidence_score  # 回傳類別名稱 + 信心分數
