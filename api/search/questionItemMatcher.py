import torch

class QuestionItemMatcher:
    def __init__(self, data_list, question_class, item_class, max_distance=None):
        """
        初始化
        :param data_list: 物件偵測的結果 (完整 bbox)
        :param question_class: Question 的 class 值
        :param item_class: Item 的 class 值
        :param max_distance: 最大匹配距離 (可選)
        """
        self.data = torch.tensor(data_list, dtype=torch.float32)  # 轉換為 Tensor
        self.question_class = question_class
        self.item_class = item_class
        self.max_distance = max_distance  # None = 不限制距離

    def match(self):
        """
        找出最近的 Question → Item 配對
        :return: {question_idx: item_idx} 的對應關係
        """
        questions = []
        items = []

        # 分類 Question 和 Item
        for idx, (x1, y1, x2, y2, conf, cls) in enumerate(self.data):
            if int(cls) == self.question_class:
                questions.append((idx, x1, y1, x2, y2))  # 使用左上角 (x1, y1)
            elif int(cls) == self.item_class:
                cx, cy = (x1 + x2) / 2, (y1 + y2) / 2  # Item 使用中心點
                items.append((idx, cx, cy))

        # 建立最近匹配
        matched_pairs = {}
        for q_idx, q_x1, q_y1, _, _ in questions:
            min_dist = float("inf")
            best_match = None

            for i_idx, i_cx, i_cy in items:
                dist = ((q_x1 - i_cx) ** 2 + (q_y1 - i_cy) ** 2) ** 0.5  # 計算歐式距離
                
                if self.max_distance is None or dist <= self.max_distance:
                    if dist < min_dist:
                        min_dist = dist
                        best_match = i_idx  # 只保留最近的一個 Item

            if best_match is not None:
                matched_pairs[q_idx] = [best_match]  # 一對一關係

        return matched_pairs
