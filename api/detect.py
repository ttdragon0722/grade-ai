import time
from pathlib import Path

import cv2
import torch
import torch.backends.cudnn as cudnn
from numpy import random

from models.experimental import attempt_load
from utils.datasets import LoadImages
from utils.general import check_img_size, non_max_suppression, apply_classifier, \
    scale_coords, xyxy2xywh, set_logging, increment_path
from utils.plots import plot_one_box
from utils.torch_utils import select_device, load_classifier, time_synchronized, TracedModel

from ocr.handwrite import detect_handwrite
from view.bbox import BBox
from view.save import ImageSaver
from search.questionItemMatcher import QuestionItemMatcher
from ocr.item import extract_text_from_bbox

from detect_tesseract import TesseractOCRDetector


CLASS_TABLE = [
    "question",
    "answer",
    "article",
    "area",
    "diagram",
    "item"
]

def detect_images(
    source_path, 
    model, # <--- 接收已載入的模型物件
    device, # <--- 接收已選取的設備
    half, # <--- 接收 half precision 狀態
    imgsz, # <--- 接收圖片大小
):
    # Settings (Fixed as per request)
    conf_thres = 0.25
    iou_thres = 0.45
    save_img = True
    save_txt = False
    save_conf = False
    augment = False
    agnostic_nms = False
    trace = True
    project = 'data/detect'
    name = 'test_demo'
    exist_ok = True
    
    # Directories
    save_dir = Path(increment_path(Path(project) / name, exist_ok=exist_ok))
    (save_dir / 'labels' if save_txt else save_dir).mkdir(parents=True, exist_ok=True)
    ImageSaver.set_save_dir(save_dir)

    # Get names and colors
    names = model.module.names if hasattr(model, 'module') else model.names
    colors = [[random.randint(0, 255) for _ in range(3)] for _ in names]

    # Set Dataloader
    stride = int(model.stride.max()) # 重新獲取 stride
    dataset = LoadImages(source_path, img_size=imgsz, stride=stride)
    
    # Run inference
    results = []
    t0 = time.time()
    for path, img, im0s, vid_cap in dataset:
        img = torch.from_numpy(img).to(device)
        img = img.half() if half else img.float()
        img /= 255.0
        if img.ndimension() == 3:
            img = img.unsqueeze(0)

        # Inference
        with torch.no_grad():
            pred = model(img, augment=augment)[0]

        # ... (以下程式碼保持不變)
        pred = non_max_suppression(pred, conf_thres, iou_thres, agnostic=agnostic_nms)
        

        # Process detections
        for i, det in enumerate(pred):
            p = Path(path)
            im0 = im0s.copy()
            original = im0s.copy()
            
            # Additional image savers as in the original code
            original_img = ImageSaver(im0, p, "original")
            step1_img = ImageSaver(im0, p, "step1")
            step2_img = ImageSaver(im0, p, "step2")
            step3_img = ImageSaver(im0, p, "step3")
            
            save_path = str(save_dir / p.name)
            copy_save_path = str(save_dir / Path("copy-" + p.name))
            
            if len(det):
                det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0.shape).round()
                det_sorted = sorted(det, key=lambda box: (int(box[1]) + int(box[3])) // 2)

                data_list = []
                current_image_results = []
                for *xyxy, conf, cls in det_sorted:
                    x1, y1, x2, y2 = map(int, xyxy)
                    x_center = (x1 + x2) // 2
                    y_center = (y1 + y2) // 2
                    cls_value = int(cls.item())
                    
                    predicted_text = None
                    if cls_value == 1:
                        predicted_text, score = detect_handwrite(original, (x1, y1, x2, y2))
                        if predicted_text == "UNKNOWN":
                            predicted_text = None
                    
                    data_list.append((x1, y1, x2, y2, conf, cls_value))

                    # Append to results
                    current_image_results.append({
                        'class': CLASS_TABLE[cls_value],
                        'confidence': round(float(conf.item()), 2),
                        'bbox': [x1, y1, x2, y2],
                        'text': predicted_text,
                    })

                    # Add bbox to images for saving
                    label = f'{names[cls_value]} {conf:.2f}'
                    plot_one_box(xyxy, im0, label=label, color=colors[cls_value], line_thickness=2)
                    plot_one_box(xyxy, step1_img(), label=label, color=colors[cls_value], line_thickness=2)
                    cv2.circle(im0, (x_center, y_center), radius=5, color=(0, 0, 255), thickness=-1)
                    cv2.circle(im0, (x1, y1), radius=5, color=(0, 255, 255), thickness=-1)

                    if cls_value in [0, 1, 5]:
                        cv2.circle(im0s, (x_center, y_center), radius=5, color=(255, 0, 0), thickness=-1)
                        cv2.circle(step2_img(), (x_center, y_center), radius=5, color=(255, 0, 0), thickness=-1)
                        plot_one_box(xyxy, im0s, label=label, color=colors[cls_value], line_thickness=2)
                        plot_one_box(xyxy, step3_img(), label=label, color=colors[cls_value], line_thickness=2)
                    
                    if predicted_text:
                        font = cv2.FONT_HERSHEY_SIMPLEX
                        font_scale = 2
                        thickness = 3
                        text_color = (255, 255, 255)
                        bg_color = (0, 0, 0)
                        
                        (text_w, text_h), baseline = cv2.getTextSize(predicted_text, font, font_scale, thickness)
                        text_x = x_center - text_w // 2
                        text_y = y_center + text_h // 2
                        cv2.rectangle(im0, (text_x - 5, text_y - text_h - 5), (text_x + text_w + 5, text_y + 5), bg_color, -1)
                        cv2.putText(im0, predicted_text, (text_x, text_y), font, font_scale, text_color, thickness, lineType=cv2.LINE_AA)

                # Matching logic
                matcher = QuestionItemMatcher(data_list, question_class=0, item_class=5, max_distance=None)
                matcher_answer = QuestionItemMatcher(data_list, question_class=1, item_class=5, max_distance=None)
                groups = matcher.match()
                groups_answer = matcher_answer.match()
                valid_items = set()

                for q_idx, item_indices in groups.items():
                    question = BBox(data_list[q_idx])
                    for i_idx in item_indices:
                        item = BBox(data_list[i_idx])
                        ocr_text = extract_text_from_bbox(original, item[:4])
                        cv2.line(im0s, question.center, item.center, (0, 0, 255), 2)
                        cv2.line(step2_img(), question.center, item.center, (0, 0, 255), 2)
                        valid_items.add(i_idx)

                for a_idx, i_indices in groups_answer.items():
                    answer = BBox(data_list[a_idx])
                    for i_idx in i_indices:
                        if i_idx in valid_items:
                            item = BBox(data_list[i_idx])
                            cv2.line(im0s, answer.center, item.center, (255, 0, 0), 2)
                            cv2.line(step2_img(), answer.center, item.center, (0, 0, 255), 2)

                results.append({
                    'image_path': str(p),
                    'detections': current_image_results
                })

            # Save results
            if save_img:
                original_img.save()
                step1_img.save()
                step2_img.save()
                step3_img.save()
                cv2.imwrite(save_path, im0)
                cv2.imwrite(copy_save_path, im0s)
                print(f"The image with the result is saved in: {save_path}")

    print(results)
    print(f'Done. ({time.time() - t0:.3f}s)')
    return True

import re
def grade_results(mapped_results, correct_answers):
    """
    對物件偵測的結果進行批改，並計算總分。

    Args:
        mapped_results (dict): 偵測到的題號與作答配對結果，格式為 {"題號": "作答"}。
        correct_answers (dict): 正確答案和每題的分數，格式為 {"題號": {"score": 分數, "answer": "正確答案"}}。

    Returns:
        dict: 包含總分和每題批改細節的字典。
    """
    total_score = 0
    grading_details = {}

    for item_id, predicted_text in mapped_results.items():
        # Clean item_id to remove non-digit characters
        clean_item_id = re.sub(r'\D', '', item_id)
        if not clean_item_id:
            continue

        if clean_item_id in correct_answers:
            correct_entry = correct_answers[clean_item_id]
            correct_answer = correct_entry['answer']
            score = correct_entry['score']

            is_correct = (predicted_text.lower() == correct_answer.lower())
            
            if is_correct:
                total_score += score

            grading_details[clean_item_id] = {
                'predicted_answer': predicted_text,
                'correct_answer': correct_answer,
                'is_correct': is_correct,
                'score_awarded': score if is_correct else 0
            }
        else:
            # 處理在正確答案中找不到該題的情況
            grading_details[clean_item_id] = {
                'predicted_answer': predicted_text,
                'correct_answer': 'N/A',
                'is_correct': False,
                'score_awarded': 0,
                'note': '題號未在正確答案中找到'
            }

    return {
        'total_score': total_score,
        'details': grading_details
    }

def detect_images_v2(
    photo_paths,
    page_ids,
    model,
    device,
    half,
    imgsz,
    exam_id,
    correct_answers
):
    """
    V2 版本物件偵測函式，專為 API 呼叫設計。
    
    Args:
        photo_paths (list): 包含一個或多個圖片路徑的列表。
        page_ids (list): 包含每個圖片對應的 exam_page_id。
        model: 已載入的 YOLOv7 模型物件。
        device: 運行的設備 (例如 'cpu' 或 '0')。
        half (bool): 是否使用半精度浮點數 (FP16)。
        imgsz (int): 模型輸入圖片的尺寸。
        exam_id (str): 考試的唯一ID，用於建立結果儲存資料夾。
        correct_answers (dict): 包含正確答案的字典，用於批改功能。

    Returns:
        list: 包含每張圖片處理結果的列表，每個項目包括 page_id、grading_results 和 save_paths。
    """
    # Settings (固定參數)
    conf_thres = 0.25
    iou_thres = 0.45
    save_img = True
    save_txt = False
    save_conf = False
    augment = False
    agnostic_nms = False
    trace = True
    
    # 路徑
    project = 'data/'
    name = exam_id
    exist_ok = True
    
    # 建立結果儲存的目錄
    save_dir = Path(increment_path(Path(project) / name, exist_ok=exist_ok))
    (save_dir / 'labels' if save_txt else save_dir).mkdir(parents=True, exist_ok=True)
    ImageSaver.set_save_dir(save_dir)

    # 獲取類別名稱和顏色
    names = model.module.names if hasattr(model, 'module') else model.names
    colors = [[random.randint(0, 255) for _ in range(3)] for _ in names]

    # 設定資料載入器
    stride = int(model.stride.max())
    datasets = [LoadImages(path, img_size=imgsz, stride=stride) for path in photo_paths]
    
    # 執行推論
    results = []
    t0 = time.time()
    
    tesseractOcrEngine = TesseractOCRDetector()
    
    for page_id, dataset in zip(page_ids, datasets):
        for path, img, im0s, vid_cap in dataset:
            img = torch.from_numpy(img).to(device)
            img = img.half() if half else img.float()
            img /= 255.0
            if img.ndimension() == 3:
                img = img.unsqueeze(0)

            # 推論
            with torch.no_grad():
                pred = model(img, augment=augment)[0]

            # 應用非極大值抑制 (NMS)
            pred = non_max_suppression(pred, conf_thres, iou_thres, agnostic=agnostic_nms)
            
            # 處理偵測結果
            for i, det in enumerate(pred):
                p = Path(path)
                im0 = im0s.copy()
                original = im0s.copy()
                
                # Setup ImageSavers and collect paths
                save_paths = []
                bounding_box_image = ImageSaver(im0, p, "bounding_box")
                group_img = ImageSaver(im0, p, "group")
                step3_img = ImageSaver(im0, p, "step3")
                
                if len(det):
                    det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0.shape).round()
                    det_sorted = sorted(det, key=lambda box: (int(box[1]) + int(box[3])) // 2)

                    data_list = []
                    current_image_results = []
                    
                    for *xyxy, conf, cls in det_sorted:
                        x1, y1, x2, y2 = map(int, xyxy)
                        x_center = (x1 + x2) // 2
                        y_center = (y1 + y2) // 2
                        
                        cls_value = int(cls.item())
                        cls_name = CLASS_TABLE[cls_value]
                        
                        predicted_text = None
                        if cls_name == "answer":
                            predicted_text, score = detect_handwrite(original, (x1, y1, x2, y2))
                            if predicted_text == "UNKNOWN":
                                predicted_text = None
                        
                        data_list.append((x1, y1, x2, y2, conf, cls_value))
                        current_image_results.append({
                            'class': cls_name,
                            'confidence': round(float(conf.item()), 2),
                            'bbox': (x1, y1, x2, y2),
                            'text': predicted_text,
                        })

                        label = f'{names[cls_value]} {conf:.2f}'
                        plot_one_box(xyxy, im0, label=label, color=colors[cls_value], line_thickness=2)
                        cv2.circle(im0, (x_center, y_center), radius=5, color=(0, 0, 255), thickness=-1)
                        cv2.circle(im0, (x1, y1), radius=5, color=(0, 255, 255), thickness=-1)
                        plot_one_box(xyxy, bounding_box_image(), label=label, color=colors[cls_value], line_thickness=2)
                        
                        if cls_name in ["question", "answer", "item"]:
                            cv2.circle(im0s, (x_center, y_center), radius=5, color=(255, 0, 0), thickness=-1)
                            cv2.circle(group_img(), (x_center, y_center), radius=5, color=(255, 0, 0), thickness=-1)
                            plot_one_box(xyxy, im0s, label=label, color=colors[cls_value], line_thickness=2)
                            plot_one_box(xyxy, step3_img(), label=label, color=colors[cls_value], line_thickness=2)
                        
                        if predicted_text:
                            font = cv2.FONT_HERSHEY_SIMPLEX
                            font_scale = 2
                            thickness = 3
                            text_color = (255, 255, 255)
                            bg_color = (0, 0, 0)
                            
                            (text_w, text_h), baseline = cv2.getTextSize(predicted_text, font, font_scale, thickness)
                            text_x = x_center - text_w // 2
                            text_y = y_center + text_h // 2
                            cv2.rectangle(im0, (text_x - 5, text_y - text_h - 5), (text_x + text_w + 5, text_y + 5), bg_color, -1)
                            cv2.putText(im0, predicted_text, (text_x, text_y), font, font_scale, text_color, thickness, lineType=cv2.LINE_AA)

                    matcher = QuestionItemMatcher(data_list, question_class=0, item_class=5, max_distance=None)
                    matcher_answer = QuestionItemMatcher(data_list, question_class=1, item_class=5, max_distance=None)
                    groups = matcher.match()
                    groups_answer = matcher_answer.match()
                    item_ocr_results = {}
                    valid_items = set()

                    for q_idx, item_indices in groups.items():
                        question = BBox(data_list[q_idx])
                        for i_idx in item_indices:
                            item = BBox(data_list[i_idx])
                            x1, y1, x2, y2 = map(int, item[:4])
                            crop = original[y1:y2, x1:x2]
                            ocr_text = tesseractOcrEngine.detect(crop)
                            item_ocr_results[i_idx] = ocr_text.strip()

                            cv2.line(im0s, question.center, item.center, (0, 0, 255), 2)
                            cv2.line(group_img(), question.center, item.center, (0, 0, 255), 2)
                            valid_items.add(i_idx)

                    final_results = {}
                    for a_idx, i_indices in groups_answer.items():
                        answer = BBox(data_list[a_idx])
                        for i_idx in i_indices:
                            if i_idx in valid_items:
                                item_text = item_ocr_results.get(i_idx)
                                answer_result_dict = current_image_results[a_idx]
                                predicted_text = answer_result_dict['text']
                                
                                if item_text and predicted_text:
                                    final_results[item_text] = predicted_text
                                
                                item = BBox(data_list[i_idx])
                                cv2.line(im0s, answer.center, item.center, (255, 0, 0), 2)
                                cv2.line(group_img(), answer.center, item.center, (0, 0, 255), 2)
                    
                    # 在這裡呼叫新的批改函式
                    grading_results = grade_results(final_results, correct_answers)
                    print("Final Mapped Results:", final_results)
                    print("Grading Results:", grading_results)
                    
                    if save_img:
                        save_paths.append(bounding_box_image.save())
                        save_paths.append(group_img.save())
                        save_paths.append(step3_img.save())
                    
                    results.append({
                        'exam_page_id': page_id,
                        'grading_results': grading_results,
                        'save_paths': [p for p in save_paths if p] # Filter out None values
                    })
    print(f'Done. ({time.time() - t0:.3f}s)')
    print(results)
    return results
