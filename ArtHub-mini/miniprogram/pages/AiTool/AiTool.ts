
// 定义消息数据类型
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  showActions?: boolean;
}

interface UserInfo {
  avatarUrl?: string;
  nickName?: string;
}

Page({
  data: {
    // 消息列表
    messages: [] as Message[],
    // 输入消息
    inputMessage: '',
    // 滚动位置
    scrollTop: 0,
    // AI 正在思考
    isAIThinking: false,
    // 显示快捷提示
    showQuickTips: true,
    // 显示操作面板
    showActionSheet: false,
    // 当前时间
    currentTime: '',
    //历史记录上限
    MAX_HISTORY_MESSAGES : 50,
    // 用户信息
    userInfo: {} as UserInfo,
    // AI 服务接口地址
    serverUrl: 'https://acclimatable-subcardinal-charlesetta.ngrok-free.dev'
  },

  onLoad() {
    this.initChat();
    // this.loadUserInfo();
  },

  onReady() {
    // 页面渲染完成后滚动到底部
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  },

  // 初始化聊天
  initChat(): void {
    // 设置当前时间
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    this.setData({
      currentTime: timeString
    });

    // 尝试加载历史消息
    this.loadHistoryMessages();
  },

  // 加载用户信息
  // loadUserInfo(): void {
  //   // 模拟用户数据，实际应从全局状态或接口获取
  //   const userInfo: UserInfo = {
  //     avatarUrl: '/images/avatar-demo.jpg',
  //     nickName: '创意设计师'
  //   };
    
  //   this.setData({ userInfo });
  // },

  // 加载历史消息
  loadHistoryMessages(): void {
    try {
      const history = wx.getStorageSync('aiChatHistory');
      if (history) {
        this.setData({
          messages: history
        });
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  },

  // 保存消息到本地
  saveMessages(): void {
    try {
      wx.setStorageSync('aiChatHistory', this.data.messages);
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  },

  // 输入消息
  onInputMessage(e: WechatMiniprogram.Textarea): void {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  // 发送消息
  onSendMessage(): void {
    const message = this.data.inputMessage.trim();
    if (!message) return;

    // 添加用户消息
    this.addMessage('user', message);
    
    // 清空输入框
    this.setData({
      inputMessage: '',
      showQuickTips: false
    });

    // 调用 AI 回复
    this.generateAIResponse(message);
  },

  // 添加快捷提示
  onQuickTip(e: WechatMiniprogram.TouchEvent): void {
    const tip = e.currentTarget.dataset.tip;
    this.setData({
      inputMessage: tip
    });
    this.onSendMessage();
  },

  // 添加消息
  addMessage(role: 'user' | 'ai', content: string): void {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      time: timeString,
      showActions: role === 'ai'
    };

    let updatedMessages = [...this.data.messages, newMessage];

    if (updatedMessages.length > this.data.MAX_HISTORY_MESSAGES) {
      updatedMessages = updatedMessages.slice(-this.data.MAX_HISTORY_MESSAGES);
    }

    this.setData({messages: updatedMessages},()=>{
    // 保存消息
    this.saveMessages();
    // 滚动到底部
    this.scrollToBottom();
    });     
  },

  // 触发 AI 回复（设置思考状态并发送请求）
  generateAIResponse(userMessage: string): void {
    this.setData({ isAIThinking: true });
    this.sendToAI(userMessage);
  },

  // 发送消息到 AI 服务
  sendToAI(message: string): void {
    const that = this;
    wx.request({
      url: that.data.serverUrl + '/minichat',  // 拼接完整接口地址
      method: 'POST',
      data: {
        message: message,
        is_save:true
      },
      header: {
        'content-type': 'application/json'
      },
      timeout: 60000, //超时
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.reply) {
          // 假设返回格式为 { "reply": "AI回复内容" }
          that.addMessage('ai', res.data.reply);
        } else {
          console.error('服务器返回错误', res);
          that.addMessage('ai', '抱歉，服务器返回了错误，请稍后重试。');
        }
      },
      fail(err) {
        console.error('网络请求失败', err);
        that.addMessage('ai', '网络请求失败，请检查网络连接后重试。');
      },
      complete() {
        that.setData({ isAIThinking: false });
      }
    });
  },

  // 复制消息
  onCopyMessage(e: WechatMiniprogram.TouchEvent): void {
    const content = e.currentTarget.dataset.content;
    
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 重新生成消息
  onRegenerateMessage(e: WechatMiniprogram.TouchEvent): void {
    const messageId = e.currentTarget.dataset.id;
    const messages = this.data.messages;
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1].content;
      
      // 移除原来的AI回复
      messages.splice(messageIndex, 1);
      this.setData({ messages });
      
      // 重新生成回复
      this.setData({ isAIThinking: true });
      this.sendToAI(userMessage);
    }
  },

  // 显示更多操作
  onShowMoreActions(): void {
    this.setData({
      showActionSheet: true
    });
  },

  // 关闭操作面板
  onCloseActionSheet(): void {
    this.setData({
      showActionSheet: false
    });
  },

  // 上传图片
onUploadImage(): void {
  this.onCloseActionSheet();
  
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      const userPrompt = this.data.inputMessage; // 获取当前输入框内容
      
      wx.showLoading({ title: '分析图片中...' });
      
      // 读取图片为 base64
      wx.getFileSystemManager().readFile({
        filePath: tempFilePath,
        encoding: 'base64',
        success: (fileRes) => {
          const base64Data = fileRes.data as string;
          
          // 调用后端图像分析接口
          wx.request({
            url: `${this.data.serverUrl}/analyze-image`,
            method: 'POST',
            data: {
              image: base64Data,
              prompt: userPrompt
            },
            timeout: 60000,
            success: (apiRes) => {
              wx.hideLoading();
              if (apiRes.statusCode === 200 && apiRes.data && apiRes.data.reply) {
                // 清空输入框
                this.setData({ inputMessage: '' });
                
                // 添加用户消息（显示用户输入 + [图片]）
                const userMsg = userPrompt 
                  ? `${userPrompt} ${tempFilePath}` 
                  : '图片';
                this.addMessage('user', userMsg);
                
                // 添加 AI 回复
                this.addMessage('ai', apiRes.data.reply);
              } else {
                wx.showToast({ title: '分析失败', icon: 'none' });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('请求失败', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '图片读取失败', icon: 'none' });
        }
      });
    },
    fail: (err) => {
      console.error('选择图片失败', err);
    }
  });
},

  // 从素材库选择
  onSelectFromLibrary(): void {
    this.onCloseActionSheet();
    
    wx.showToast({
      title: '跳转至素材库',
      icon: 'none'
    });
    
    // 实际开发中跳转到素材库页面
    // wx.navigateTo({
    //   url: '/pages/Slib/Slib'
    // });
  },

  // 语音输入
  onVoiceInput(): void {
    this.onCloseActionSheet();
    
    wx.showToast({
      title: '语音输入功能开发中',
      icon: 'none'
    });
  },

  // 清空历史
  onClearHistory(): void {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有聊天记录吗？此操作不可撤销。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [],
            showQuickTips: true
          });
          
          // 清除本地存储
          try {
            wx.removeStorageSync('aiChatHistory');
          } catch (error) {
            console.error('清除存储失败:', error);
          }
          
          wx.showToast({
            title: '已清空记录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 滚动处理
  onScroll(e: WechatMiniprogram.ScrollView): void {
    // 可以在这里实现滚动到顶部加载更多历史消息
  },

  // 滚动到底部
  scrollToBottom(): void {
    setTimeout(() => {
      this.setData({
        scrollTop: 99999
      });
    }, 100);
  },

  // 返回上一页
  onNavigateBack(): void {
    wx.navigateBack();
  }
});