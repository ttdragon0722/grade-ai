# model_loader.py
import torch
from pathlib import Path

from models.experimental import attempt_load
from utils.torch_utils import select_device, TracedModel
from utils.general import check_img_size

# 這是你從程式碼中提取出來的初始化邏輯
def initialize_model(weights_path: str):
    """
    載入並暖機模型，返回模型物件。
    """
    device_str = ''
    imgsz = 640
    trace = True
    
    # 選擇設備
    device = select_device(device_str)
    half = device.type != 'cpu'

    # 載入模型
    model = attempt_load(weights_path, map_location=device)
    stride = int(model.stride.max())
    imgsz = check_img_size(imgsz, s=stride)

    if trace:
        model = TracedModel(model, device, imgsz)

    if half:
        model.half()

    # 模型暖機
    print("Executing model warm-up...")
    if device.type != 'cpu':
        dummy_input = torch.zeros(1, 3, imgsz, imgsz).to(device).type_as(next(model.parameters()))
        with torch.no_grad():
            model(dummy_input)
    print("Model warm-up complete!")
    
    return {
        "model": model,
        "device": device,
        "half": half,
        "imgsz": imgsz
    }