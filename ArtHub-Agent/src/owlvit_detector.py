import torch
import cv2
import numpy as np
import logging
from PIL import Image
from transformers import OwlViTProcessor, OwlViTForObjectDetection

logger = logging.getLogger("owlvit_detector")

class OwlViTDetector:
    def __init__(self, conf_threshold=0.3):
        self.processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
        self.model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.model.to(self.device)
        self.model.eval()
        self.conf_threshold = conf_threshold
        # 定义要检测的物体（英文），可根据需要扩充
        self.texts = [["person", "animal", "plant", "building", "object",
                       "decoration", "tree", "flower", "sky", "water", "dragon",
                       "fairy", "elf", "castle", "sword", "magic", "armor", "robe",
                       "staff", "crystal", "fire", "cloud", "mountain", "river"]]


        # dummy_image = torch.randn(1, 3, 224, 224).to(self.device)
        # dummy_text = [["test"]]
        # with torch.no_grad():
        #     dummy_outputs = self.model(pixel_values=dummy_image, input_ids=torch.ones(1, 5).long().to(self.device))
        logger.debug("OWL-ViT 模型加载完成")


    def detect_objects(self, image_bytes):
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(img_rgb)
            orig_w, orig_h = pil_img.size

            inputs = self.processor(text=self.texts, images=pil_img, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)

            target_sizes = torch.tensor([[orig_h, orig_w]]).to(self.device)
            results = self.processor.post_process_grounded_object_detection(
                outputs, target_sizes=target_sizes, threshold=self.conf_threshold
            )[0]
            logger.debug("检测结果: boxes数量=%s", len(results['boxes']))

            objects = []
            for box, score, label_id in zip(results["boxes"], results["scores"], results["labels"]):
                label = self.texts[0][label_id]
                x1, y1, x2, y2 = box.tolist()
                objects.append({
                    "name": label,
                    "confidence": float(score),
                    "x1": int(x1), "y1": int(y1),
                    "x2": int(x2), "y2": int(y2),
                    "width": int(x2 - x1),
                    "height": int(y2 - y1)
                })
            # print(objects)
            return objects
        except Exception as e:
            logger.warning("OWL-ViT 检测失败: %s", e)
            import traceback
            traceback.print_exc()
            return []