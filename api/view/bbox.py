class BBox:
    def __init__(self, bbox):
        self.x1 = bbox[0]
        self.y1 = bbox[1]
        self.x2 = bbox[2]
        self.y2 = bbox[3]
        self.confidence = bbox[4] if len(bbox) > 4 else None  # 信心分數（可選）
        self.class_id = bbox[5] if len(bbox) > 5 else None  # 類別 ID（可選）

    def __repr__(self):
        return (f"BBox(x1={self.x1}, y1={self.y1}, x2={self.x2}, y2={self.y2}, "
                f"confidence={self.confidence}, class_id={self.class_id})")

    @property
    def center(self):
        """中心點座標"""
        return ((self.x1 + self.x2) // 2, (self.y1 + self.y2) // 2)

    @property
    def top_left(self):
        return (self.x1, self.y1)

    @property
    def top_right(self):
        return (self.x2, self.y1)

    @property
    def bottom_left(self):
        return (self.x1, self.y2)

    @property
    def bottom_right(self):
        return (self.x2, self.y2)

    def __getitem__(self, index):
        """支援 bbox[:4] 取得 (x1, y1, x2, y2)"""
        bbox_tuple = (self.x1, self.y1, self.x2, self.y2, self.confidence, self.class_id)
        return bbox_tuple[index] if isinstance(index, int) else bbox_tuple[:4]  # 預設回傳前四個
