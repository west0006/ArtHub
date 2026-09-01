import secrets
import string


def generate_secure_token(length: int = 32) -> str:
    """
    生成安全的随机 Token（由字母+数字组成）
    :param length: Token 长度，默认32位（推荐），可根据需求调整
    :return: 随机 Token 字符串
    """
    # 定义 Token 包含的字符集：大小写字母 + 数字
    alphabet = string.ascii_letters + string.digits
    # 使用 secrets 生成加密安全的随机字符串（比 random 模块更安全）
    token = ''.join(secrets.choice(alphabet) for _ in range(length))
    return token


def generate_aes_key_for_wechat(length: int = 43) -> str:
    """
    生成适配企业微信的43位AES密钥（符合微信官方要求）
    :param length: 密钥长度，固定43位（微信EncodingAESKey要求）
    :return: 43位随机字符串（字母+数字+符号，符合微信规范）
    """
    # 微信EncodingAESKey要求：43位字符，包含字母、数字、符号
    # 选择安全且兼容的字符集（避免特殊符号导致解析错误）
    alphabet = string.ascii_letters + string.digits + "+/"  # 兼容base64的字符集
    if length != 43:
        raise ValueError("企业微信AES密钥必须是43位字符长度")

    # 生成加密安全的43位随机字符串
    aes_key = ''.join(secrets.choice(alphabet) for _ in range(length))
    return aes_key


# 生成示例
if __name__ == "__main__":
    # 生成 32 位随机 Token
    token = generate_secure_token(32)
    # 生成   AES 密钥
    aes_key_43 = generate_aes_key_for_wechat(43)

    print("=== 生成结果 ===")
    print(f"安全 Token（32位）: {token}")
    print(f"AES（43位）: {aes_key_43}")