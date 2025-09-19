from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
import time
from pathlib import Path
import shutil

# 從你的自訂模組中匯入初始化函數
from model_loader import initialize_model
from detect import detect_images

# 全域變數來儲存模型和相關配置
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動事件
    print("Application startup...")
    
    # 載入並暖機模型
    weights_file = Path("weights/yolobest.pt")
    model_data = initialize_model(str(weights_file))
    
    # 將模型和相關資料儲存到 app_state
    app_state["model"] = model_data["model"]
    app_state["device"] = model_data["device"]
    app_state["half"] = model_data["half"]
    app_state["imgsz"] = model_data["imgsz"]
    
    yield
    
    # 關閉事件
    print("Application shutdown...")
    # 在這裡可以釋放資源，例如關閉資料庫連線等

# 2. 創建 FastAPI 應用程式，並傳入 lifespan
app = FastAPI(lifespan=lifespan)

@app.get("/")
def root():
    return {"root": "HelloWorld"}

@app.get("/test_demo")
def test_demo():
    return detect_images(
        "data/demo.jpg",
        app_state["model"],
        app_state["device"],
        app_state["half"],
        app_state["imgsz"],
        ""
    )

@app.get("/haha")
async def haha():
    return "HAHA"

