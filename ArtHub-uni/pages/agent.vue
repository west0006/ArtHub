<template>
  <view class="ai-chat-page">
    <!-- 导航 -->
    <view class="nav-header">
      <view class="nav-back" @tap="onNavigateBack">
        <van-icon name="arrow-left" size="32rpx" color="#333333" />
      </view>
      <text class="nav-title">花菜</text>
      <view class="nav-actions">
        <van-icon name="delete-o" size="32rpx" color="#333333" @tap="onClearHistory" />
      </view>
    </view>

    <scroll-view class="chat-container" scroll-y scroll-with-animation :scroll-top="scrollTop" @scroll="onScroll">
      <!-- 欢迎消息 -->
      <block v-if="messages.length === 0">
        <view class="message-group ai-message">
          <view class="message-content">
            <text class="message-sender">花菜</text>
            <view class="message-bubble ai-bubble">
              <text class="message-text">您好！我是您的AI创作助手，我可以为您提供：\n\n• 创作灵感与设计方向建议\n• 色彩搭配和构图建议\n• 素材和教程推荐\n•
                关键词扩展搜索\n\n请告诉我您需要什么帮助？</text>
            </view>
            <text class="message-time">{{ currentTime }}</text>
          </view>
        </view>
      </block>

      <!-- 消息列表 -->
      <block v-for="item in messages" :key="item.id">
        <view class="message-group" :class="item.role === 'user' ? 'user-message' : 'ai-message'">
          <view class="message-content" :class="item.role === 'user' ? 'user-content' : ''">
            <text class="message-sender">{{ item.role === 'user' ? '我' : '花菜' }}</text>
            <view class="message-bubble" :class="item.role === 'user' ? 'user-bubble' : 'ai-bubble'">
              <text class="message-text">{{ item.content }}</text>
              <view v-if="item.role === 'ai' && item.showActions" class="message-actions">
                <view class="action-btn" @tap="onCopyMessage" :data-content="item.content">
                  <van-icon name="copy" size="28rpx" color="#666666" />
                  <text>复制</text>
                </view>
                <view class="action-btn" @tap="onRegenerateMessage" :data-id="item.id">
                  <van-icon name="replay" size="28rpx" color="#666666" />
                  <text>重新生成</text>
                </view>
              </view>
            </view>
            <text class="message-time">{{ item.time }}</text>
          </view>
        </view>
      </block>

      <!-- 输入指示器 -->
      <block v-if="isAIThinking">
        <view class="message-group ai-message">
          <view class="message-content">
            <text class="message-sender">花菜</text>
            <view class="message-bubble ai-bubble">
              <view class="typing-indicator">
                <view class="typing-dot"></view>
                <view class="typing-dot"></view>
                <view class="typing-dot"></view>
              </view>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>

    <!-- 快捷提示 -->
    <view class="quick-tips" v-if="showQuickTips && messages.length === 0">
      <view class="tips-title">快捷提问</view>
      <view class="tips-grid">
        <view class="tip-card" @tap="onQuickTip" data-tip="给我一些插画创作的灵感">
          <van-icon name="photo-o" size="40rpx" color="#0A6E51" />
          <text>插画灵感</text>
        </view>
        <view class="tip-card" @tap="onQuickTip" data-tip="推荐适合水彩画的配色方案">
          <van-icon name="photo-o" size="40rpx" color="#0A6E51" />
          <text>色彩搭配</text>
        </view>
        <view class="tip-card" @tap="onQuickTip" data-tip="如何设计一个吸引人的角色形象">
          <van-icon name="user-circle-o" size="40rpx" color="#0A6E51" />
          <text>角色设计</text>
        </view>
        <view class="tip-card" @tap="onQuickTip" data-tip="推荐一些平面设计教程">
          <van-icon name="bookmark-o" size="40rpx" color="#0A6E51" />
          <text>教程推荐</text>
        </view>
      </view>
    </view>

    <view class="bottom-safe-area" style="height: 233rpx;"></view>

    <!-- 输入区域 -->
    <view class="input-section">
      <view class="input-container">
        <textarea class="message-input" placeholder="输入您的问题..." :value="inputMessage" @input="onInputMessage"
          @confirm="onSendMessage" maxlength="500" cursor-spacing="20" :adjust-position="false"
          :show-confirm-bar="false"></textarea>
        <view class="input-actions">
          <van-icon v-if="!inputMessage" name="add-o" size="40rpx" color="#666666" @tap="onShowMoreActions" />
          <van-icon v-else name="passed" size="40rpx" color="#0A6E51" @tap="onSendMessage" />
        </view>
      </view>
      <view class="bottom-safe-area" style="height: 18rpx;"></view>
    </view>

    <van-popup :show="showActionSheet" position="bottom" round @close="onCloseActionSheet">
      <view class="action-sheet">
        <view class="sheet-title">更多操作</view>
        <view class="sheet-actions">
          <view class="sheet-item" @tap="onUploadImage">
            <van-icon name="photograph" size="40rpx" color="#0A6E51" />
            <text>上传图片参考</text>
          </view>
          <view class="sheet-item" @tap="onSelectFromLibrary">
            <van-icon name="photo-o" size="40rpx" color="#0A6E51" />
            <text>从素材库选择</text>
          </view>
          <view class="sheet-item" @tap="onVoiceInput">
            <van-icon name="volume-o" size="40rpx" color="#0A6E51" />
            <text>语音输入</text>
          </view>
        </view>
        <view class="sheet-cancel" @tap="onCloseActionSheet">取消</view>
      </view>
    </van-popup>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useStore } from '@/store';

  const store = useStore();

  interface Message {
    id : string;
    role : 'user' | 'ai';
    content : string;
    time : string;
    showActions ?: boolean;
  }

  const messages = ref<Message[]>([]);
  const inputMessage = ref('');
  const scrollTop = ref(0);
  const isAIThinking = ref(false);
  const showQuickTips = ref(true);
  const showActionSheet = ref(false);
  const currentTime = ref('');
  const serverUrl = 'https://acclimatable-subcardinal-charlesetta.ngrok-free.dev';
  const MAX_HISTORY_MESSAGES = 50;

  const initChat = () => {
    const now = new Date();
    currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const history = uni.getStorageSync('aiChatHistory');
    if (history) {
      messages.value = history;
      scrollToBottom();
    }
  };

  const saveMessages = () => {
    try {
      uni.setStorageSync('aiChatHistory', messages.value);
    } catch (e) {
      console.error('保存消息失败', e);
    }
  };

  const onInputMessage = (e : any) => {
    inputMessage.value = e.detail.value;
  };

  const onSendMessage = () => {
    const message = inputMessage.value.trim();
    if (!message) return;
    addMessage('user', message);
    inputMessage.value = '';
    showQuickTips.value = false;
    generateAIResponse(message);
  };

  const onQuickTip = (e : any) => {
    const tip = e.currentTarget.dataset.tip;
    inputMessage.value = tip;
    onSendMessage();
  };

  const addMessage = (role : 'user' | 'ai', content : string) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newMessage : Message = {
      id: Date.now().toString(),
      role,
      content,
      time: timeString,
      showActions: role === 'ai',
    };
    messages.value.push(newMessage);
    if (messages.value.length > MAX_HISTORY_MESSAGES) {
      messages.value = messages.value.slice(-MAX_HISTORY_MESSAGES);
    }
    saveMessages();
    scrollToBottom();
  };

  const generateAIResponse = (userMessage : string) => {
    isAIThinking.value = true;
    uni.request({
      url: `${serverUrl}/minichat`,
      method: 'POST',
      data: { message: userMessage, is_save: true },
      timeout: 60000,
      success(res : any) {
        if (res.statusCode === 200 && res.data && res.data.reply) {
          addMessage('ai', res.data.reply);
        } else {
          addMessage('ai', '抱歉，服务器返回了错误，请稍后重试。');
        }
      },
      fail() {
        addMessage('ai', '网络请求失败，请检查网络连接后重试。');
      },
      complete: () => {
        isAIThinking.value = false;
      },
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollTop.value = 99999;
    }, 100);
  };

  const onScroll = () => { };

  const onCopyMessage = (e : any) => {
    const content = e.currentTarget.dataset.content;
    uni.setClipboardData({
      data: content,
      success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' }),
    });
  };

  const onRegenerateMessage = (e : any) => {
    const id = e.currentTarget.dataset.id;
    const index = messages.value.findIndex(msg => msg.id === id);
    if (index > 0) {
      const userMsg = messages.value[index - 1].content;
      messages.value.splice(index, 1);
      isAIThinking.value = true;
      uni.request({
        url: `${serverUrl}/minichat`,
        method: 'POST',
        data: { message: userMsg, is_save: false },
        timeout: 60000,
        success(res : any) {
          if (res.statusCode === 200 && res.data && res.data.reply) {
            addMessage('ai', res.data.reply);
          }
        },
        fail() {
          addMessage('ai', '网络错误');
        },
        complete: () => {
          isAIThinking.value = false;
        },
      });
    }
  };

  const onShowMoreActions = () => {
    showActionSheet.value = true;
  };
  const onCloseActionSheet = () => {
    showActionSheet.value = false;
  };

  const onUploadImage = () => {
    onCloseActionSheet();
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        uni.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: (fileRes) => {
            uni.request({
              url: `${serverUrl}/analyze-image`,
              method: 'POST',
              data: { image: fileRes.data, prompt: inputMessage.value },
              timeout: 60000,
              success: (apiRes : any) => {
                if (apiRes.statusCode === 200 && apiRes.data && apiRes.data.reply) {
                  inputMessage.value = '';
                  addMessage('user', tempFilePath);
                  addMessage('ai', apiRes.data.reply);
                } else {
                  uni.showToast({ title: '分析失败', icon: 'none' });
                }
              },
              fail: () => uni.showToast({ title: '网络错误', icon: 'none' }),
            });
          },
          fail: () => uni.showToast({ title: '图片读取失败', icon: 'none' }),
        });
      },
    });
  };

  const onSelectFromLibrary = () => {
    onCloseActionSheet();
    uni.showToast({ title: '跳转至素材库', icon: 'none' });
  };
  const onVoiceInput = () => {
    onCloseActionSheet();
    uni.showToast({ title: '语音输入功能开发中', icon: 'none' });
  };
  const onClearHistory = () => {
    uni.showModal({
      title: '确认清空',
      content: '确定要清空所有聊天记录吗？此操作不可撤销。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          messages.value = [];
          showQuickTips.value = true;
          uni.removeStorageSync('aiChatHistory');
          uni.showToast({ title: '已清空记录', icon: 'success' });
        }
      },
    });
  };

  const onNavigateBack = () => uni.navigateBack();

  onMounted(() => {
    initChat();
  });
</script>

<style scoped>
  /* pages/ai-chat/index.wxss - 夸克立体粗边框 + 绿色点缀 */

  .ai-chat-page {
    height: 100vh;
    position: relative;
    background-color: #ffffff;
    /* 纯白背景 */
  }

  /* 导航栏 - 粗黑下边框 */
  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 32rpx 24rpx;
    background-color: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
    /* 粗黑分割线 */
  }

  .nav-back,
  .nav-actions {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  .nav-title-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4rpx;
  }

  .nav-subtitle {
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 聊天容器 */
  .chat-container {
    flex: 1;
    width: 740rpx;
    margin: 4rpx;
    padding-bottom: 254rpx;
    background-color: #ffffff;
    /* 纯白背景，原灰底改白 */
  }

  /* 消息组 */
  .message-group {
    display: flex;
    margin-bottom: 40rpx;
  }

  .user-message {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 8rpx;
    /* 直角微圆角 */
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    margin: 0 20rpx;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .user-avatar {
    width: 100%;
    height: 100%;
    border-radius: 6rpx;
  }

  .message-content {
    flex: 1;
    max-width: 70%;
  }

  .user-content {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .message-sender {
    font-size: 24rpx;
    font-weight: 500;
    color: #5a5a5a;
    margin-bottom: 12rpx;
  }

  /* 消息气泡 - 立体边框 */
  .message-bubble {
    padding: 24rpx;
    border-radius: 8rpx;
    /* 统一小圆角 */
    position: relative;
    word-break: break-word;
    background-color: #ffffff;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .ai-bubble {
    border-top-left-radius: 4rpx;
    /* 保留指向感，缩小圆角 */
  }

  .user-bubble {
    background-color: #2e7d32;
    /* 绿色背景 */
    /* 立体边框适配：上左用亮绿，下右用黑色 */
    border-top-color: #4caf50;
    border-left-color: #4caf50;
    border-right-color: #1a1a1a;
    border-bottom-color: #1a1a1a;
    border-top-right-radius: 4rpx;
  }

  .message-text {
    font-size: 28rpx;
    line-height: 1.6;
    color: #1a1a1a;
  }

  .user-bubble .message-text {
    color: #ffffff;
  }

  .message-time {
    font-size: 20rpx;
    color: #8a8a8a;
    /* 更淡的文字 */
    margin-top: 12rpx;
    display: block;
  }

  /* 消息操作 - 粗分割线 */
  .message-actions {
    display: flex;
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 3rpx solid #1a1a1a;
    /* 粗分割 */
  }

  .action-btn {
    display: flex;
    align-items: center;
    margin-right: 32rpx;
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .action-btn text {
    margin-left: 8rpx;
  }

  /* 输入指示器 */
  .typing-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20rpx 0;
  }

  .typing-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background-color: #1a1a1a;
    /* 深色点 */
    margin: 0 6rpx;
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes typing {

    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }

    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 快捷提示 */
  .quick-tips {
    background-color: #ffffff;
    padding: 32rpx;
    border-top: 6rpx solid #1a1a1a;
    /* 粗分割 */
  }

  .tips-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24rpx;
    border-left: 8rpx solid #2e7d32;
    /* 绿色强调条 */
    padding-left: 16rpx;
  }

  .tips-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  /* 快捷卡片 - 立体边框 */
  .tip-card {
    flex: 1;
    min-width: calc(50% - 10rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx 24rpx;
    background-color: #ffffff;
    border-radius: 8rpx;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
    transition: none;
  }

  .tip-card:active {
    background-color: #f5f5f5;
    transform: translateY(2rpx);
    border-top: 3rpx solid #1a1a1a;
    border-left: 3rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .tip-card text {
    font-size: 24rpx;
    color: #1a1a1a;
    margin-top: 16rpx;
    font-weight: 600;
  }

  /* 输入区域 - 粗分割线 */
  .input-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    border-top: 6rpx solid #1a1a1a;
    padding: 16rpx 32rpx 24rpx;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
    box-sizing: border-box;
  }

  /* 输入框容器 - 立体边框 */
  .input-container {
    display: flex;
    align-items: flex-end;
    background-color: #ffffff;
    border-radius: 8rpx;
    padding: 20rpx 24rpx;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .message-input {
    flex: 1;
    min-height: 40rpx;
    max-height: 160rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    line-height: 1.4;
  }

  .placeholder {
    color: #8a8a8a;
  }

  .input-actions {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 16rpx;
  }

  /* 操作面板 */
  .action-sheet {
    padding: 40rpx 32rpx;
    background-color: #ffffff;
  }

  .sheet-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 40rpx;
    border-left: 8rpx solid #2e7d32;
    padding-left: 16rpx;
    text-align: left;
  }

  .sheet-actions {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 32rpx;
  }

  /* 选项 - 立体边框 */
  .sheet-item {
    display: flex;
    align-items: center;
    padding: 32rpx;
    border-radius: 8rpx;
    background-color: #ffffff;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
  }

  .sheet-item text {
    font-size: 28rpx;
    color: #1a1a1a;
    margin-left: 24rpx;
    font-weight: 600;
  }

  /* 取消按钮 - 立体边框 */
  .sheet-cancel {
    padding: 32rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    background-color: #ffffff;
    border-radius: 8rpx;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
  }

  .sheet-cancel:active {
    transform: translateY(2rpx);
    border-top: 3rpx solid #1a1a1a;
    border-left: 3rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  /* 底部安全区 */
  .bottom-safe-area {
    height: 40rpx;
    background-color: transparent;
  }
</style>