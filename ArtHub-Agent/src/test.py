import requests
import xmltodict

url = "http://localhost:8000/wechat"
xml_data = """
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[三得利大王]]></FromUserName>
    <CreateTime>12345678</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[你过得还好吗]]></Content>
    <MsgId>1234567890</MsgId>
</xml>
"""
headers = {"Content-Type": "application/xml"}
response = requests.post(url, data=xml_data.encode("utf-8"), headers=headers)
print(response.text)