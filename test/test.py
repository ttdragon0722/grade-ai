import numpy as np
import cv2
import onnxruntime as ort

def preprocess(image, input_shape):
    """將圖片調整為模型所需的輸入格式。"""
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, input_shape)
    image = np.transpose(image, (2, 0, 1))
    image = np.expand_dims(image, axis=0)
    image = image.astype(np.float32) / 255.0
    return image
def postprocess(predictions, original_shape, conf_thres=0.25, iou_thres=0.45):
    """
    最終修正版後處理函數，處理 ONNX 模型原始輸出。
    """
    # 輸出是 (1, N, 85)，我們取 [0]
    output = predictions[0]

    # 將原始輸出張量分為不同的部分
    # output shape: (num_anchors, 85)
    box_coords = output[:, :4]
    obj_confs = output[:, 4]
    class_scores = output[:, 5:]

    # 應用 Sigmoid 函數來獲得機率值
    obj_confs = 1 / (1 + np.exp(-obj_confs))
    class_scores = 1 / (1 + np.exp(-class_scores))

    # 計算最終信心度 = 物體信心度 * 類別信心度
    scores = obj_confs[:, np.newaxis] * class_scores

    # 取得每個框的最大信心度及其對應的類別 ID
    max_scores = np.max(scores, axis=1)
    class_ids = np.argmax(scores, axis=1)

    # 過濾低於信心度閾值的偵測框
    valid_dets_indices = max_scores > conf_thres
    
    # 使用布林索引來取得有效的預測
    final_boxes = box_coords[valid_dets_indices]
    final_scores = max_scores[valid_dets_indices]
    final_class_ids = class_ids[valid_dets_indices]

    # 執行 NMS
    final_detections = []
    
    unique_classes = np.unique(final_class_ids)
    for cls in unique_classes:
        cls_indices = np.where(final_class_ids == cls)
        cls_boxes = final_boxes[cls_indices]
        cls_scores = final_scores[cls_indices]
        
        # 轉換座標格式
        x_center = cls_boxes[:, 0]
        y_center = cls_boxes[:, 1]
        width = cls_boxes[:, 2]
        height = cls_boxes[:, 3]
        
        x1 = x_center - width / 2
        y1 = y_center - height / 2
        x2 = x_center + width / 2
        y2 = y_center + height / 2
        
        indices = cv2.dnn.NMSBoxes(
            bboxes=list(np.stack([x1, y1, x2, y2], axis=1)),
            scores=list(cls_scores),
            score_threshold=conf_thres,
            nms_threshold=iou_thres
        )
        
        if len(indices) > 0:
            for i in indices:
                box_idx = i[0] if isinstance(i, np.ndarray) else i
                final_detections.append({
                    "box": [float(x1[box_idx]), float(y1[box_idx]), float(x2[box_idx]), float(y2[box_idx])],
                    "confidence": float(cls_scores[box_idx]),
                    "class_id": int(cls),
                })
    
    # 將座標調整回原始圖片尺寸
    img_h, img_w = original_shape[:2]
    scale_w = img_w / 640
    scale_h = img_h / 640
    
    for det in final_detections:
        box = det['box']
        box[0] *= scale_w
        box[1] *= scale_h
        box[2] *= scale_w
        box[3] *= scale_h
    
    return final_detections

def draw_detections_and_save(image_path, detections, output_path, class_names):
    """在圖片上畫出偵測結果並儲存。"""
    # 載入原始圖片
    img = cv2.imread(image_path)
    if img is None:
        return
        
    for det in detections:
        x1, y1, x2, y2 = [int(i) for i in det['box']]
        conf = det['confidence']
        cls_id = det['class_id']
        
        # 取得類別名稱
        label = f"{class_names[cls_id]}: {conf:.2f}"
        
        # 畫出矩形框
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # 取得文字大小並畫上背景
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(img, (x1, y1 - h - 5), (x1 + w, y1), (0, 255, 0), -1)
        
        # 畫出標籤文字
        cv2.putText(img, label, (x1, y1 - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    # 儲存繪製好的圖片
    cv2.imwrite(output_path, img)
    print(f"繪製好的圖片已儲存至：{output_path}")

def run_inference(onnx_path, image_path):
    """執行推論並返回偵測結果。"""
    session = ort.InferenceSession(onnx_path, providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    
    original_image = cv2.imread(image_path)
    if original_image is None:
        raise FileNotFoundError(f"找不到圖片檔案: {image_path}")

    original_shape = original_image.shape
    input_tensor = preprocess(original_image, (640, 640))
    outputs = session.run(None, {input_name: input_tensor})
    predictions = outputs[0][0]
    detections = postprocess(predictions, original_shape)
    
    return detections, original_image

if __name__ == '__main__':
    onnx_file_path = "api/model/best.onnx"
    input_image_path = "data/demo.jpg"
    output_image_path = "data/output_result.jpg"

    # !!! 請將下面的 class_names 替換成你自己的類別名稱清單 !!!
    # 確保順序與你訓練時的類別 ID 一致
    CLASS_NAMES = [
        "question",
        "answer",
        "article",
        "area",
        "diagram",
        "item"
    ]


    try:
        results, original_img = run_inference(onnx_file_path, input_image_path)
        
        if results:
            print(f"在 {input_image_path} 中偵測到 {len(results)} 個物體：")
            for det in results:
                print(det)
            
            # 呼叫繪圖函數
            draw_detections_and_save(input_image_path, results, output_image_path, CLASS_NAMES)
        else:
            print("沒有偵測到任何物體。")
            
    except FileNotFoundError as e:
        print(e)
    except Exception as e:
        print(f"執行錯誤: {e}")