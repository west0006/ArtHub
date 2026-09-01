import os
# 1. 模型国内镜像源
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
# 2. 禁用SSL验证（解决证书错误）
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["PYTHONHTTPSVERIFY"] = "0"
# 3. pip国内镜像（依赖安装）
os.environ["PIP_INDEX_URL"] = "https://pypi.tuna.tsinghua.edu.cn/simple"

import json
import time
import gradio as gr
import requests
import datetime
import numpy as np
import faiss
import xmltodict
import hashlib
from fastapi import FastAPI, Request, Query
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from ddgs import DDGS
from image_analyzer import ImageAnalyzer

# 创建全局分析器实例
image_analyzer = ImageAnalyzer(use_tencent=False, use_yolo=False, use_owlvit=True)

# 【必填配置区】
# 豆包API配置（真实密钥从环境变量读取，勿硬编码）
DOUBAO_API_KEY = os.getenv("DOUBAO_API_KEY", "")
DOUBAO_MODEL = "doubao-seed-2-0-pro-260215"
# DOUBAO_EMBEDDING_MODEL = "doubao-embedding-text-240715"  # 向量模型

# 工具方法
def get_absolute_path(relative_path):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    return os.path.join(project_root, relative_path)


# 豆包LLM核心模块
class DoubaoLLM:
    def __init__(self, api_key, model):
        self.api_key = api_key
        self.model = model
        self.url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

    def chat(self, prompt,retry=1):
        """对话接口"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,  # 数值越低人设越稳，越高越活泼
            "max_tokens": 1500
        }

        for i in range(retry+1):
            try:
                resp = requests.post(self.url, headers=headers, json=data, timeout=60)
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"].strip()
            except Exception as e:
                print(f"豆包API调用失败：{e}")
                if i==retry:
                    return "抱歉，刚才有点走神了，再说一遍好不好"
                time.sleep(1)



    """有钱买模型了再开
    def get_embedding(self, text):
        # 向量接口（用于真实RAG）
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": DOUBAO_EMBEDDING_MODEL,
            "input": text
        }
        try:
            resp = requests.post(self.embedding_url, headers=headers, json=data, timeout=30)
            resp.raise_for_status()
            return np.array(resp.json()["data"][0]["embedding"], dtype="float32")
        except Exception as e:
            print(f"向量生成失败：{e}")
             return np.random.rand(1536).astype("float32")"""


# 本地免费向量模型（核心替换）
class LocalEmbedding:
    def __init__(self, model_name="./models/all-MiniLM-L6-v2"):
        """
        可选模型：
        - "all-MiniLM-L6-v2" (默认，轻量最快)
        - "BAAI/bge-small-zh-v1.5" (中文最强)
        - "qwen/Qwen3-Embedding-0.6B" (阿里开源)
        """
        self.model = SentenceTransformer(model_name)
        # 自动获取向量维度
        self.dim = self.model.get_sentence_embedding_dimension()
        print(f"✅ 本地向量模型加载完成：{model_name}，维度：{self.dim}")

    def get_embedding(self, text):
        """本地生成向量，零成本、无API限制"""
        try:
            vec = self.model.encode(text, convert_to_numpy=True)
            return vec.astype("float32")
        except Exception as e:
            print(f"本地向量生成失败：{e}")
            return np.random.rand(self.dim).astype("float32")


# RAG知识库（适配本地向量）
class A_RAG:
    def __init__(self, embedding):
        self.embedding = embedding
        self.index = None
        self.docs = []  # 文档内容
        self.metadata = []  # 文档的元数据（如标题、类型、标签）
        self.dim = embedding.dim  # 自动适配模型维度

    def add_resources(self, resources):
        """
        resources: list of dict, 每个包含 'content' (文本), 'title', 'type' (素材/教程), 'tags' (列表)
        """
        if not resources:
            return
        texts = [r['content'] for r in resources]
        vecs = [self.embedding.get_embedding(text) for text in texts]
        vecs = np.array(vecs)

        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dim)
        self.index.add(vecs)
        self.docs = texts
        self.metadata = resources
        print(f"✅ 画师知识库加载完成，共{len(resources)}条资源")

    def keyword_search(self, query):
        """简单关键词匹配（在标题和标签中查找）"""
        query_lower = query.lower()
        results = []
        for res in self.metadata:
            # 检查标题和标签是否包含关键词
            if query_lower in res['title'].lower():
                results.append(res)
            else:
                for tag in res.get('tags', []):
                    if query_lower in tag.lower():
                        results.append(res)
                        break
        return results

    def vector_search(self, query, top_k=3):
        """向量相似度搜索（模糊搜索）"""
        if not self.index or len(self.docs) == 0:
            return []
        q_vec = self.embedding.get_embedding(query).reshape(1, -1)
        D, I = self.index.search(q_vec, top_k)
        return [self.metadata[i] for i in I[0] if i < len(self.metadata)]

    def search(self, query, use_vector_if_keyword_fails=True):
        """综合搜索：先用关键词，若无结果再用向量"""
        keyword_results = self.keyword_search(query)
        if keyword_results:
            return keyword_results
        elif use_vector_if_keyword_fails:
            return self.vector_search(query)
        else:
            return []

    def add_texts(self, texts):
        if not texts:
            return
        vecs = [self.embedding.get_embedding(text) for text in texts]
        vecs = np.array(vecs)
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dim)
        self.index.add(vecs)
        self.docs = texts
        print(f"✅ RAG知识库加载完成，共{len(texts)}条回忆")

    def query(self, question, top_k=2):
        if not self.index or len(self.docs) == 0:
            return "无专属回忆内容"
        q_vec = self.embedding.get_embedding(question).reshape(1, -1)
        D, I = self.index.search(q_vec, top_k)
        return "\n".join([self.docs[i] for i in I[0] if i < len(self.docs)])

# 工具调用
class Tools:
    def __init__(self, rag):
        self.rag = rag

    def get_time(self):
        return datetime.datetime.now().strftime("%Y年%m月%d日 %H:%M")

    def calculator(self, expr):
        """安全的计算器"""
        try:
            # 仅支持数字和基础运算符
            safe_expr = expr.replace(" ", "").replace("×", "*").replace("÷", "/")
            # 简单安全检查：只允许数字、运算符和括号
            if not all(c in "0123456789+-*/()." for c in safe_expr):
                return "表达式包含非法字符"
            return str(eval(safe_expr))
        except (SyntaxError, ValueError, TypeError) as e:
            print(f"计算错误：{e}")
            return "算错啦，试试简单的加减乘除吧~"

    def search_resources(self, query):
        """
        搜索素材或教程，由AI调用
        返回格式化的文本结果
        """
        results = self.rag.search(query)  # 使用全局rag实例
        if not results:
            return "没有找到相关资源，试试换个关键词吧。"
        output = "找到以下相关资源：\n"
        for r in results:
            output += f"\n【{r['type']}】{r['title']}\n  描述：{r['content'][:100]}...\n"
        return output

    def web_search(self, query: str, num_results: int = 5) -> str:
        """
        使用DuckDuckGo进行网络搜索。
        Args:
            query: 搜索关键词
            num_results: 期望返回的结果数量
        Returns:
            格式化的搜索结果字符串
        """
        try:
            # 执行搜索，获取标题和链接
            results = DDGS().text(query, max_results=num_results)
            if not results:
                return f"未找到关于“{query}”的搜索结果。"

            formatted_results = f"关于“{query}”的搜索结果：\n"
            for i, result in enumerate(results, 1):
                title = result.get('title', '无标题')
                link = result.get('href', '无链接')
                body = result.get('body', '无摘要')
                formatted_results += f"\n{i}. 标题：{title}\n   链接：{link}\n   摘要：{body}\n"
            return formatted_results
        except Exception as e:
            return f"搜索失败：{str(e)}"


# 构建智能体

class Agent01:
    def __init__(self, api_key, model,prompt_file,history_file="data/history.json"):
        self.llm = DoubaoLLM(api_key, model)
        self.embedding = LocalEmbedding(model_name="all-MiniLM-L6-v2")
        self.rag = A_RAG(self.embedding)
        self.tools = Tools(self.rag)
        self.prompt_file = prompt_file
        self.memory = []  # 对话长期记忆
        self.max_memory_len = 30  # 记忆长度，避免prompt过长

        self.system_prompt = self._load_system_prompt(prompt_file)
        self.history_file = history_file
        self.load_history()

    def _load_system_prompt(self, file_path):
        """从指定文件加载系统提示，若文件不存在则返回默认提示"""
        default_prompt = "你是一位专业的画师助手，名字叫「绘灵」。请帮助用户解决绘画相关问题。"  # 可自定义默认值
        try:
            full_path = get_absolute_path(file_path)
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            print(f"⚠️ 提示文件 {file_path} 未找到，使用默认提示。")
            return default_prompt
        except Exception as e:
            print(f"⚠️ 读取提示文件失败：{e}，使用默认提示。")
            return default_prompt

    def build_prompt(self, user_input):
        # 拼接历史对话记忆，自动截断过长内容
        if len(self.memory) > self.max_memory_len:
            self.memory = self.memory[-self.max_memory_len:]
        history = "\n".join(
            f"{'用户' if i%2==0 else 'Agent'}：{self.memory[i]}"
            for i in range(len(self.memory))
        )if self.memory else "暂无历史对话。"
        # 检索记忆/知识库内容
        knowledge = self.rag.query(user_input)

        # 拼接最终prompt
        final_prompt = f"""
{self.system_prompt}

【回忆/参考信息】
{knowledge}

【你们的过往对话】
{history}

用户现在对你说：{user_input}
""".strip()
        return final_prompt

    def load_history(self):
        try:
            full_path = get_absolute_path(self.history_file)
            with open(full_path, 'r', encoding='utf-8') as f:
                self.memory = json.load(f)
        except FileNotFoundError:
            self.memory = []
        except Exception as e:
            print(f"加载历史失败：{e}")
            self.memory = []

            # 截断至最大长度
        if len(self.memory) > self.max_memory_len:
            self.memory = self.memory[-self.max_memory_len:]

    def save_history(self):
        try:
            full_path = get_absolute_path(self.history_file)
            with open(full_path, 'w', encoding='utf-8') as f:
                json.dump(self.memory, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存历史失败：{e}")

    def run(self, user_input):
        """单次对话完整流程：思考→工具调用→回复→记忆存储"""
        # 构建prompt
        prompt = self.build_prompt(user_input)
        # 大模型思考
        ai_resp = self.llm.chat(prompt)

        # 判断是否需要调用工具
        if ai_resp.strip().startswith("{"):
            try:
                tool_data = json.loads(ai_resp)
                tool_name = tool_data.get("tool")
                params = tool_data.get("params", "")

                if tool_name == "web_search":
                    tool_result = self.tools.web_search(params)
                    final_prompt = f"基于以下搜索结果，用你画师助手的口吻和语气回复用户：\n{tool_result}"
                    ai_resp = self.llm.chat(final_prompt)
                elif tool_name == "search_resources":
                    tool_result = self.tools.search_resources(params)
                    final_prompt = f"工具返回结果：{tool_result}\n请根据这些结果用自然语言回复用户。"
                    ai_resp = self.llm.chat(final_prompt)
                elif tool_name == "get_time":
                    tool_result = self.tools.get_time()
                    ai_resp = f"当前时间是：{tool_result}"
                elif tool_name == "calculator":
                    tool_result = self.tools.calculator(params)
                    ai_resp = f"计算结果：{tool_result}"
                else:
                    ai_resp = "抱歉，我不理解这个工具调用。"
            except json.JSONDecodeError:
                print(f"工具调用JSON解析失败：{ai_resp}")
            except Exception as e:
                print(f"工具调用解析失败：{e}")

        # 存储对话记忆
        self.memory.append(user_input)
        self.memory.append(ai_resp)

        # 限制记忆长度
        if len(self.memory) > self.max_memory_len:
            self.memory = self.memory[-self.max_memory_len:]

        self.save_history()

        return ai_resp


# =============================================================

# 启动服务
app = FastAPI()

# 初始化智能体
agent = Agent01(DOUBAO_API_KEY, DOUBAO_MODEL, prompt_file="data/prompt.txt")

# 加载专属知识库/回忆
def load_texts_from_file(file_path):
    try:
        full_path = get_absolute_path(file_path)
        with open(full_path, 'r', encoding='utf-8') as f:
            texts = [line.strip() for line in f if line.strip()]
        return texts
    except FileNotFoundError:
        print(f"⚠️ 文件 {file_path} 未找到")
        return []
    except Exception as e:
        print(f"⚠️ 读取文件失败：{e}")
        return []


def load_resources_from_file(file_path):
    try:
        full_path = get_absolute_path(file_path)
        with open(full_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ 文件 {file_path} 未找到")
        return []
    except Exception as e:
        print(f"⚠️ 读取文件失败：{e}")
        return []

resources = load_resources_from_file("data/knowledge_resources.json")
agent.rag.add_resources(resources)

texts = load_texts_from_file("data/knowledge_texts.txt")
agent.rag.add_texts(texts)


"""console调试
def send_wx_msg(user_id, content):
    print(f"agent: {content}")

@app.post("/wechat")
async def wechat_receive(request: Request):
    try:
        xml_data = await request.body()
        xml_dict = xmltodict.parse(xml_data)["xml"]
        if xml_dict["MsgType"] != "text":
            return "success"
        user_id = xml_dict["FromUserName"]
        user_content = xml_dict["Content"]
        print(f"{user_id}: {user_content}")
        reply_content = agent.run(user_content)
        send_wx_msg(user_id, reply_content)
    except Exception as e:
        print(f"消息处理失败：{e}")
    return "success"

web调试
# 定义对话函数
def chat(message, history):
    reply = agent.run(message)
    return reply

# 创建 Gradio 聊天界面
demo = gr.ChatInterface(
    fn=chat,
    title="画师助手·绘灵",
    description="🎨 我是你的绘画灵感库和资源推荐官！有什么绘画上的问题需要帮忙吗？",
    # theme="soft"
)"""

# 微信小程序接入
class ChatRequest(BaseModel):
    message: str

# 基础对话
@app.post("/minichat")
async def api_chat(request: ChatRequest):
    user_content = request.message
    if not user_content:
        return {"reply": "消息不能为空"}

    try:
        print(f"API收到消息: {user_content}")
        reply_content = agent.run(user_content)
        return {"reply": reply_content}
    except Exception as e:
        print(f"对话接口异常：{e}")
        return {"reply": "抱歉，我有点卡壳了，再试一次吧~"}

# 图像分析
class ImageAnalysisRequest(BaseModel):
    image: str
    prompt: str = ""

@app.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest):
    try:
        image_bytes = base64.b64decode(request.image)
        analysis = image_analyzer.analyze_image(image_bytes)
        if "error" in analysis:
            return {"reply": f"图片分析失败：{analysis['error']}"}

        # 构造描述文本
        desc = "【图像分析结果】\n"
        desc += f"图像尺寸：{analysis['image_size']['width']}x{analysis['image_size']['height']}\n"
        desc += f"全局特征：平均亮度{analysis['global_color']['mean_brightness']:.1f}，对比度{analysis['global_color']['contrast']:.1f}，主色调BGR{analysis['global_color']['main_color_bgr']}\n"

        if analysis.get("tencent_labels"):
            labels = analysis["tencent_labels"]
            label_str = "、".join([f"{l['name']}({l['confidence']:.2f})" for l in labels[:5]])
            desc += f"腾讯云标签：{label_str}\n"

        if analysis["objects"]:
            desc += "检测到的物体：\n"
            for obj in analysis["objects"]:
                color = obj['color_features']
                hues = "、".join([f"色相{h['hue']}°({h['percentage']*100:.1f}%)" for h in color['dominant_hues']])
                desc += f"- {obj['name']}（置信度{obj['confidence']:.2f}）占比{obj['area_percentage']:.1f}%，主色相：{hues}，亮度{color['mean_brightness']:.1f}\n"
        else:
            desc += "未检测到明确物体。\n"

        # 拼接用户输入
        if request.prompt:
            user_message = f"用户说：{request.prompt}\n{desc}"
        else:
            user_message = f"用户上传了一张图片。\n{desc}"

        # 调用 agent.run 让 AI 结合历史上下文回复
        ai_reply = agent.run(user_message)
        return {"reply": ai_reply}

    except Exception as e:
        print(f"图像分析接口异常：{e}")
        return {"reply": "图片处理出错，请稍后重试。"}

# 健康检查接口（生产环境必备）
@app.get("/health", summary="健康检查")
async def health_check():
    return {"status": "ok", "service": "绘灵助手", "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}


# 启动入口
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # web测试
    # demo.launch(share=False)  # share=True 可以生成公网链接