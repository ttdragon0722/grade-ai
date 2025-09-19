class Colorset:
    """ OpenCV 使用的 BGR 顏色集合 """
    Red = (0, 0, 255)
    Green = (0, 255, 0)
    Blue = (255, 0, 0)
    Yellow = (0, 255, 255)
    Cyan = (255, 255, 0)
    Magenta = (255, 0, 255)
    White = (255, 255, 255)
    Black = (0, 0, 0)
    Gray = (128, 128, 128)
    Orange = (0, 165, 255)
    Purple = (128, 0, 128)
    Pink = (203, 192, 255)
    
    
# 測試
print(Colorset.Red)      # (0, 0, 255)  → 紅色
print(Colorset.Green)    # (0, 255, 0)  → 綠色
print(Colorset.Blue)     # (255, 0, 0)  → 藍色
print(Colorset.Yellow)   # (0, 255, 255)  → 黃色