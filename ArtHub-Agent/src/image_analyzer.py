import cv2
import numpy as np
from typing import Dict, Any, List
import base64
import os
import logging
from yolo_detector import YOLODetector
from owlvit_detector import OwlViTDetector

logger = logging.getLogger("image_analyzer")

# 腾讯云相关导入（如果有）
try:
    from tencentcloud.common import credential
    from tencentcloud.common.profile.client_profile import ClientProfile
    from tencentcloud.common.profile.http_profile import HttpProfile
    from tencentcloud.tiia.v20190529 import tiia_client, models
    TENCENT_AVAILABLE = True
except ImportError as e:
    logger.warning("腾讯云 SDK 导入失败: %s", e)
    TENCENT_AVAILABLE = False

# 腾讯云配置（真实密钥从环境变量读取，勿硬编码）
TENCENT_SECRET_ID = os.getenv("TENCENT_SECRET_ID", "")
TENCENT_SECRET_KEY = os.getenv("TENCENT_SECRET_KEY", "")
TENCENT_REGION = os.getenv("TENCENT_REGION", "ap-beijing")

class ImageAnalyzer:
    # 项目根 = 本文件所在目录的上一级（ArtHub-Agent/）
    _PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def __init__(self, use_tencent: bool = True, use_yolo: bool = True,use_owlvit: bool = True):
        self.use_tencent = use_tencent
        self.use_yolo = use_yolo
        self.use_owlvit = use_owlvit

        if use_yolo:
            model_path = os.path.join(self._PROJECT_ROOT, "models", "yolov8n.pt")
            self.yolo = YOLODetector(model_path=model_path, conf_threshold=0.2)

        if use_owlvit:
            self.owlvit = OwlViTDetector(conf_threshold=0.3)

        if use_tencent:
            if not TENCENT_AVAILABLE:
                raise ImportError("tencentcloud-sdk-python 未安装")
            self.secret_id = TENCENT_SECRET_ID
            self.secret_key = TENCENT_SECRET_KEY
            self.region = TENCENT_REGION
            cred = credential.Credential(self.secret_id, self.secret_key)
            http_profile = HttpProfile()
            http_profile.endpoint = "tiia.tencentcloudapi.com"
            client_profile = ClientProfile()
            client_profile.httpProfile = http_profile
            self.client = tiia_client.TiiaClient(cred, self.region, client_profile)

    def extract_color_features_from_roi(self, roi_img: np.ndarray) -> Dict[str, Any]:
        """从OpenCV图像区域提取颜色特征"""
        if roi_img.size == 0:
            # 保持返回结构与正常情况一致，调用方无需空指针特判
            return {
                "dominant_hues": [],
                "mean_brightness": 0.0,
                "contrast": 0.0,
                "main_color_bgr": [0, 0, 0],
                "hist_gray": [],
            }

        hsv = cv2.cvtColor(roi_img, cv2.COLOR_BGR2HSV)
        # 色相直方图
        hist_h = cv2.calcHist([hsv], [0], None, [180], [0, 180])
        if hist_h.sum() > 0:
            hist_h = hist_h / hist_h.sum()
        else:
            hist_h = np.zeros_like(hist_h)
        top_h_indices = np.argsort(hist_h)[-3:][::-1]
        dominant_hues = []
        for idx in top_h_indices:
            if hist_h[idx] > 0.05:
                dominant_hues.append({
                    "hue": int(idx),
                    "percentage": float(hist_h[idx])
                })

        # 灰度
        gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
        hist_gray = cv2.calcHist([gray], [0], None, [256], [0, 256])
        hist_gray = hist_gray.flatten() / hist_gray.sum()
        mean_brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        # 主色调
        mean_bgr = cv2.mean(roi_img)[:3]
        main_color_bgr = [int(x) for x in mean_bgr]

        return {
            "dominant_hues": dominant_hues,
            "mean_brightness": mean_brightness,
            "contrast": contrast,
            "main_color_bgr": main_color_bgr,
            "hist_gray": hist_gray.tolist()  # 可选
        }

    # def detect_objects_with_yolo(self, image_bytes: bytes) -> List[Dict[str, Any]]:
    #     """使用YOLO检测物体"""
    #     if not self.use_yolo:
    #         return []
    #     return self.yolo.detect_objects(image_bytes)

    def detect_tencent_labels(self, image_bytes: bytes) -> Dict[str, Any]:
        """使用腾讯云获取图像标签"""
        if not self.use_tencent:
            return {"success": False, "error": "腾讯云未启用"}
        try:
            req = models.DetectLabelRequest()
            req.ImageBase64 = base64.b64encode(image_bytes).decode('utf-8')
            resp = self.client.DetectLabel(req)
            labels = []
            for item in resp.Labels:
                labels.append({
                    "name": item.Name,
                    "confidence": item.Confidence,
                    "category": getattr(item, 'Category', '')
                })
            logger.debug("腾讯云标签返回: %s", labels)
            return {"success": True, "labels": labels}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _iou(self, box1, box2):
        """计算两个边界框的 IOU (Intersection over Union)"""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter_area = max(0, x2 - x1) * max(0, y2 - y1)
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union_area = box1_area + box2_area - inter_area
        return inter_area / union_area if union_area > 0 else 0

    def _merge_objects(self, yolo_objs: List[Dict], gd_objs: List[Dict], iou_threshold=0.5) -> List[Dict]:
        """
        合并 YOLO 和 GroundingDINO 的检测结果。
        策略：以 YOLO 结果为基础，将 GroundingDINO 中与所有 YOLO 框 IOU 均小于阈值的物体加入。
        如果两个检测器检测到同一物体（IOU 超过阈值），保留置信度较高的那个（或合并标签）。
        """
        merged = []
        # 先将 YOLO 结果全部加入
        for y_obj in yolo_objs:
            merged.append(y_obj.copy())

        # 处理 GroundingDINO 的结果
        for gd_obj in gd_objs:
            gd_box = (gd_obj['x1'], gd_obj['y1'], gd_obj['x2'], gd_obj['y2'])
            overlap = False
            for m_obj in merged:
                m_box = (m_obj['x1'], m_obj['y1'], m_obj['x2'], m_obj['y2'])
                if self._iou(gd_box, m_box) > iou_threshold:
                    overlap = True
                    # 如果 GroundingDINO 的置信度更高，可以更新标签（可选）
                    # 这里简单跳过，不处理重复
                    break
            if not overlap:
                merged.append(gd_obj.copy())
        return merged

    def analyze_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """综合分析：YOLO + GroundingDINO + 区域颜色 + 可选腾讯云"""
        # 1. 解码图像
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "无法解码图像"}
        height, width = img.shape[:2]
        total_pixels = height * width

        # 2. 物体检测
        yolo_objects = []
        if self.use_yolo:
            try:
                yolo_objects = self.yolo.detect_objects(image_bytes)
            except Exception as e:
                logger.warning("YOLO 检测失败: %s", e)
        owlvit_objects = []
        if self.use_owlvit:
            try:
                owlvit_objects = self.owlvit.detect_objects(image_bytes)
            except Exception as e:
                logger.warning("OWL-ViT 检测失败: %s", e)

        # 3. 合并检测结果（YOLO 为基础，OWL-ViT 补充）
        combined_objects = self._merge_objects(yolo_objects, owlvit_objects)

        # 4. 对每个合并后的物体进行区域颜色分析
        detailed_objects = []
        for obj in combined_objects:
            x1, y1, x2, y2 = obj["x1"], obj["y1"], obj["x2"], obj["y2"]
            # 将坐标裁剪到图像边界，防止负坐标/越界导致切片异常
            x1, y1 = max(0, int(x1)), max(0, int(y1))
            x2, y2 = min(width, int(x2)), min(height, int(y2))
            if x2 <= x1 or y2 <= y1:
                continue
            roi = img[y1:y2, x1:x2]
            color_features = self.extract_color_features_from_roi(roi)
            area = (x2 - x1) * (y2 - y1)
            detailed_objects.append({
                "name": obj["name"],
                "confidence": obj["confidence"],
                "location": [x1, y1, x2, y2],
                "area_percentage": area / total_pixels * 100,
                "color_features": color_features
            })

        # 5. 腾讯云标签（可选）
        tencent_labels = {"success": False}
        if self.use_tencent:
            tencent_labels = self.detect_tencent_labels(image_bytes)
            logger.debug("腾讯云结果: %s", tencent_labels)

        # 6. 全局颜色特征
        global_color = self.extract_color_features_from_roi(img)

        result = {
            "global_color": global_color,
            "objects": detailed_objects,
            "image_size": {"width": width, "height": height}
        }
        if self.use_tencent and tencent_labels.get("success"):
            result["tencent_labels"] = tencent_labels["labels"]

        return result