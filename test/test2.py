import onnxruntime as ort
import numpy as np
import cv2
import matplotlib.pyplot as plt

def infer_and_draw_results(onnx_file_path: str, input_image_path: str, output_image_path: str, class_names: list):
    """
    使用 ONNX 模型對單張圖像進行推論，並將檢測結果繪製在圖像上。
    
    Args:
        onnx_file_path (str): ONNX 模型檔案的路徑。
        input_image_path (str): 輸入圖像檔案的路徑。
        output_image_path (str): 輸出結果圖像檔案的路徑。
        class_names (list): 模型的類別名稱列表。
    """
    try:
        session = ort.InferenceSession(onnx_file_path, providers=['CPUExecutionProvider'])
    except Exception as e:
        print(f"Error loading ONNX model: {e}")
        return

    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    input_width, input_height = input_shape[3], input_shape[2]
    
    try:
        original_image = cv2.imread(input_image_path)
        if original_image is None:
            print(f"Error: Could not read image from {input_image_path}")
            return
    except Exception as e:
        print(f"Error reading image: {e}")
        return
        
    original_height, original_width, _ = original_image.shape
    resized_image = cv2.resize(original_image, (input_width, input_height))
    rgb_image = cv2.cvtColor(resized_image, cv2.COLOR_BGR2RGB)
    
    input_data = rgb_image.astype(np.float32) / 255.0
    input_data = np.transpose(input_data, (2, 0, 1))
    input_data = np.expand_dims(input_data, axis=0)

    try:
        outputs = session.run(None, {input_name: input_data})
    except Exception as e:
        print(f"Error during ONNX inference: {e}")
        return

    # --- 關鍵修正部分：處理 YOLOv5 ONNX 多個輸出 ---
    
    # 將所有輸出特徵圖的預測合併成一個單一的陣列
    all_predictions = np.concatenate([o.reshape(-1, o.shape[-1]) for o in outputs], axis=0)
    
    # 設定信心度與 IOU 閾值
    conf_thres = 0.25
    iou_thres = 0.45
    
    # 過濾低信心度的預測
    predictions = all_predictions[all_predictions[:, 4] > conf_thres]
    
    if len(predictions) == 0:
        print("沒有檢測到任何物件。")
        cv2.imwrite(output_image_path, original_image)
        return

    # 獲取邊界框、信心度、類別 ID
    boxes = predictions[:, :4]
    scores = predictions[:, 4]
    # 這裡的類別分數在索引 5 到最後
    class_ids = predictions[:, 5:].argmax(axis=1)

    # 將 YOLO 的中心點格式 (x, y, w, h) 轉換為 (x1, y1, x2, y2)
    boxes_xyxy = np.copy(boxes)
    boxes_xyxy[:, 0] = boxes[:, 0] - boxes[:, 2] / 2
    boxes_xyxy[:, 1] = boxes[:, 1] - boxes[:, 3] / 2
    boxes_xyxy[:, 2] = boxes[:, 0] + boxes[:, 2] / 2
    boxes_xyxy[:, 3] = boxes[:, 1] + boxes[:, 3] / 2
    
    # 執行 NMS
    indices = cv2.dnn.NMSBoxes(boxes_xyxy.tolist(), scores.tolist(), conf_thres, iou_thres)
    
    if len(indices) == 0:
        print("NMS 後沒有物件。")
        cv2.imwrite(output_image_path, original_image)
        return

    # 繪製最終結果
    final_indices = indices.flatten()
    
    for i in final_indices:
        x1, y1, x2, y2 = boxes_xyxy[i].astype(int)
        conf = scores[i]
        class_id = class_ids[i]

        # 將座標縮放回原始圖像尺寸
        x_scale = original_width / input_width
        y_scale = original_height / input_height
        
        x1_scaled = int(x1 * x_scale)
        y1_scaled = int(y1 * y_scale)
        x2_scaled = int(x2 * x_scale)
        y2_scaled = int(y2 * y_scale)
        
        # 繪製邊界框和標籤
        label = class_names[class_id]
        color = plt.colormaps.get_cmap('hsv')(class_id)
        color = [int(c * 255) for c in color[:3]]
        
        cv2.rectangle(original_image, (x1_scaled, y1_scaled), (x2_scaled, y2_scaled), color, 2)
        cv2.putText(original_image, f"{label}: {conf:.2f}", (x1_scaled, y1_scaled - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    try:
        cv2.imwrite(output_image_path, original_image)
        print(f"推論結果已儲存至 {output_image_path}")
    except Exception as e:
        print(f"Error saving image: {e}")

# 執行函數
onnx_file_path = "api/model/best.onnx"
input_image_path = "data/demo.jpg"
output_image_path = "data/output_result.jpg"
CLASS_NAMES = [
    "question",
    "answer",
    "article",
    "area",
    "diagram",
    "item"
]

infer_and_draw_results(onnx_file_path, input_image_path, output_image_path, CLASS_NAMES)