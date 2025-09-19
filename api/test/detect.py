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


CLASS_TABLE = [
    "question",
    "answer",
    "article",
    "area",
    "diagram",
    "item"
]

def detect_images(source_path, weights_path='yolov7.pt'):
    # Settings (Fixed as per request)
    imgsz = 640
    conf_thres = 0.25
    iou_thres = 0.45
    device_str = ''
    save_img = True
    save_txt = False
    save_conf = False
    augment = False
    agnostic_nms = False
    trace = True
    project = 'data/detect'
    name = 'algorithm'
    exist_ok = True
    
    # Directories
    save_dir = Path(increment_path(Path(project) / name, exist_ok=exist_ok))
    (save_dir / 'labels' if save_txt else save_dir).mkdir(parents=True, exist_ok=True)
    ImageSaver.set_save_dir(save_dir)

    # Initialize
    set_logging()
    device = select_device(device_str)
    half = device.type != 'cpu'

    # Load model
    model = attempt_load(weights_path, map_location=device)
    stride = int(model.stride.max())
    imgsz = check_img_size(imgsz, s=stride)

    if trace:
        model = TracedModel(model, device, imgsz)

    if half:
        model.half()

    # Second-stage classifier (Disabled by default)
    classify = False
    if classify:
        modelc = load_classifier(name='resnet101', n=2)
        modelc.load_state_dict(torch.load('weights/resnet101.pt', map_location=device)['model']).to(device).eval()

    # Set Dataloader
    dataset = LoadImages(source_path, img_size=imgsz, stride=stride)

    # Get names and colors
    names = model.module.names if hasattr(model, 'module') else model.names
    colors = [[random.randint(0, 255) for _ in range(3)] for _ in names]

    # Run inference
    if device.type != 'cpu':
        model(torch.zeros(1, 3, imgsz, imgsz).to(device).type_as(next(model.parameters())))
    
    results = []
    t0 = time.time()
    for path, img, im0s, vid_cap in dataset:
        img = torch.from_numpy(img).to(device)
        img = img.half() if half else img.float()
        img /= 255.0
        if img.ndimension() == 3:
            img = img.unsqueeze(0)

        # Inference
        t1 = time_synchronized()
        with torch.no_grad():
            pred = model(img, augment=augment)[0]
        t2 = time_synchronized()

        # Apply NMS
        pred = non_max_suppression(pred, conf_thres, iou_thres, agnostic=agnostic_nms)
        t3 = time_synchronized()

        # Apply Classifier (if enabled)
        if classify:
            pred = apply_classifier(pred, modelc, img, im0s)
        
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

    print(f'Done. ({time.time() - t0:.3f}s)')
    return results

if __name__ == '__main__':
    # Example usage
    source_folder = r'C:\coding\coding\yolo\grade-ai\data\demo.jpg'
    weights_file = r"C:\coding\coding\yolo\grade-ai\api\weights\yolobest.pt"
    
    # Run the new function
    detected_results = detect_images_only(source_folder, weights_file)
    
    # Print or process the returned results
    for result in detected_results:
        print(f"Results for image: {result['image_path']}")
        for detection in result['detections']:
            print(f"  - Class: {detection['class']}, Conf: {detection['confidence']:.2f}, BBox: {detection['bbox']}, Text: {detection['text']}")