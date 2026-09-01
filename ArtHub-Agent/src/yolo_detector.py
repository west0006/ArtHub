from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Dict, Any

class YOLODetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf_threshold: float = 0.5):
        """
        初始化YOLO检测器
        :param model_path: 模型文件路径，默认自动下载yolov8n.pt
        :param conf_threshold: 置信度阈值
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold

    def detect_objects(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        对图像进行物体检测，返回每个物体的信息（标签、置信度、边界框）
        """
        # 将字节数据转为numpy数组
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        # 推理
        results = self.model(img, verbose=False)  # verbose=False 减少日志输出

        objects = []
        for box in results[0].boxes:
            conf = float(box.conf[0].item())
            if conf < self.conf_threshold:
                continue
            cls_id = int(box.cls[0].item())
            class_name = self.model.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            objects.append({
                "name": class_name,
                "confidence": conf,
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2,
                "width": x2 - x1,
                "height": y2 - y1
            })

        return objects

    def get_image_size(self, image_bytes: bytes) -> tuple:
        """获取图像尺寸 (height, width)"""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img.shape[:2]  # (height, width)