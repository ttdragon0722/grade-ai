from pathlib import Path
import cv2

class ImageSaver:
    global_save_dir = None  # 靜態變數，所有實例共用

    @staticmethod
    def set_save_dir(directory):
        """設定全域存儲目錄，所有實例都會使用此目錄"""
        ImageSaver.global_save_dir = Path(directory)
        ImageSaver.global_save_dir.mkdir(parents=True, exist_ok=True)  # 確保目錄存在
        print(f"🌍 全域儲存目錄設定為：{ImageSaver.global_save_dir}")

    def __init__(self, img, p, prefix="copy"):
        """
        初始化 ImageSaver，準備影像存儲
        - img: 影像 (numpy array)
        - p: 原始檔案路徑 (Path 物件)
        - prefix: 儲存影像的前綴
        """
        if ImageSaver.global_save_dir is None:
            raise ValueError("❌ 請先使用 ImageSaver.set_save_dir() 設定存儲目錄！")

        self.im1 = img.copy()  # 儲存影像副本
        self.img_name = p.name  # 提取檔案名稱
        self.save_path = ImageSaver.global_save_dir / f"{prefix}_{self.img_name}"

    def __call__(self):
        """當物件被呼叫時，回傳影像陣列 (im1)"""
        return self.im1

    def save(self):
        """儲存影像到指定目錄"""
        cv2.imwrite(str(self.save_path), self.im1)
        print(f"✅ 影像已儲存： {self.save_path}")
        return str(self.save_path)
