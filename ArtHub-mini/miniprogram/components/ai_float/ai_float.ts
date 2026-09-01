type FloatAssistantData = {
  bubbleText: string;
  showBubble: boolean;           // 控制气泡显示/隐藏
  currentPage: string;
  lastDataSnapshot: string;
  isFetchingAI: boolean;
  timer?: number;
  localBubbleTimer?: number;      // 本地气泡刷新定时器
  hideBubbleTimer?: number;       // 隐藏气泡定时器
  // aiRequestCounter: number;      // 计数，用于控制AI触发频率
  lastAiRequestTime: number;     // 上次AI请求时间戳
  serverUrl:string
};

const AI_REQUEST_INTERVAL = 40000;      // 最小请求间隔
// const AI_REQUEST_COUNTER_THRESHOLD = 3; // 每3次轮询触发一次AI
const LOCAL_BUBBLE_INTERVAL = 30000; // 本地气泡刷新间隔
const BUBBLE_DISPLAY_TIME = 7000;    // 气泡显示时长

Component<FloatAssistantData>({
  data: {
    bubbleText: '',
    showBubble: false,
    currentPage: '',
    lastDataSnapshot: '',
    isFetchingAI: false,
    aiRequestCounter: 0,
    lastAiRequestTime: 0,
    serverUrl: 'https://acclimatable-subcardinal-charlesetta.ngrok-free.dev',
  },
  lifetimes: {
    attached() {
      this.startPageCheck();
      this.startLocalBubbleTimer();
    },
    detached() {
      if (this.data.timer) clearInterval(this.data.timer);
      if (this.data.localBubbleTimer) clearInterval(this.data.localBubbleTimer);
      if (this.data.hideBubbleTimer) clearTimeout(this.data.hideBubbleTimer);
    }
  },
  methods: {
    // 定期检查页面变化（也可由页面主动通知，此处用轮询简化）
    startPageCheck() {
      const timer = setInterval(() => {
        const pages = getCurrentPages();
        // console.log(pages)

        if (pages.length) {
          const page = pages[pages.length - 1];//页面定位
            
          const route = page.route;
          const pageData = page.data;
          const snapshot = JSON.stringify(pageData); // 简单序列化用于比较

          if (route !== this.data.currentPage|| snapshot !== this.data.lastDataSnapshot) {
            this.setData({ 
              currentPage: route ,
              lastDataSnapshot: snapshot ,
            });
            this.updateBubble(route, pageData);
          }
        }
      }, 5000); 
      this.setData({timer})
    },

    // 启动本地气泡定时刷新
    startLocalBubbleTimer() {
      const timer = setInterval(() => {
        // 只在没有AI请求时才刷新本地气泡，避免覆盖AI结果
        if (!this.data.isFetchingAI && this.data.currentPage) {
          const pages = getCurrentPages();
          if (pages.length) {
            const page = pages[pages.length - 1];
            const text = this.getLocalBubbleText(page.route, page.data);
            if (text) {
              this.showBubbleWithTimeout(text);
            }
          }
        }
      }, LOCAL_BUBBLE_INTERVAL);
      this.setData({ localBubbleTimer: timer });
    },

    // 显示气泡
    showBubbleWithTimeout(text: string) {
      if (this.data.hideBubbleTimer) clearTimeout(this.data.hideBubbleTimer);
      this.setData({ bubbleText: text, showBubble: true });
      const hideTimer = setTimeout(() => {
        this.setData({ showBubble: false });
      }, BUBBLE_DISPLAY_TIME);
      this.setData({ hideBubbleTimer: hideTimer });
    },

    // 更新气泡（页面变化时触发）
    updateBubble(route: string, pageData: any) {
      // 先显示本地即时信息
      const localText = this.getLocalBubbleText(route, pageData);
      if (localText) {
        this.showBubbleWithTimeout(localText);
      }

      // 判断是否触发AI（根据页面类型和频率）
      if (this.shouldTriggerAI(route)) {
        const prompt = this.buildAIPrompt(route, pageData);
        if (prompt) {
          this.generateAiBubble(pageData, prompt);
        }
      }
    },

    // 判断是否触发AI请求（仅受时间间隔限制）
    shouldTriggerAI(route: string): boolean {
      if (this.data.isFetchingAI) return false;
      const now = Date.now();
      return (now - this.data.lastAiRequestTime) >= AI_REQUEST_INTERVAL;
    },

    // 构造AI提示词（根据页面路由）
    buildAIPrompt(route: string, pageData: any): string {
      if (route === 'pages/home/home') {
        return `今日是否空闲:${pageData.currentStatus},距离当前最近未完成的订单的截稿日天数:${pageData.deadlineDays},是否之前有订单超时:${pageData.dead},有没有未完成的订单是在今日截稿:${pageData.deadToday},如果当前空闲,距离下一个订单开始日的天数:${pageData.nextOrderDays},基于以上信息,生成25字以内的分析或互动性的回复`;
      }
      // if (route === 'pages/studios/studios') {
      //   // TODO: 根据实际数据结构补充
      //   return `资源库页面，新增资源数：${pageData.newResources || 0}，总资源数：${pageData.totalResources || 0}，生成一句分析或推荐。`;
      // }
      if (route === 'pages/income/income') {
        // TODO: 补充收入页数据
        return `本月收入：${pageData.monthIncome || 0}元，总收入：${pageData.totalIncome || 0}元，趋势：${pageData.incomeTrend || 0}%，收入明细：${pageData.incomeList},平均单价:${pageData.averageIncome},已完成订单数：${pageData.completedOrders},生成三十字内分析或鼓励。`;
      }
      if (route === 'pages/detail/detail' || route === 'pages/edit/edit') {
        return `当前查看订单详情，订单状态：${pageData.orderStatus}，客户：${pageData.orderData.clientName}，橱窗名称：${pageData.orderData.windowName},订单描述：${pageData.orderData.description}，设定信息：${pageData.orderData.settingInfo}，开始日期和截稿日期：${pageData.orderData.startDate,pageData.orderData.deadline}，请根据订单信息给出五十字内建议或提醒。`;
      }
      if (route === 'pages/add/add' ) {
        return `当前在新建订单页面，订单描述：${pageData.description}，设定信息：${pageData.settingInfo}，开始日期和截稿日期：${pageData.startDate,pageData.deadline}，请根据订单信息给出五十字内建议或提醒。`;
      }
      return '';
    },
    
    // 本地规则生成气泡
    getLocalBubbleText(route: string, pageData: any): string {
      if (route === 'pages/home/home') {
        
        if (pageData.dead) return `⚠️ 有逾期订单`;
        if(pageData.nearestOrderStartDays>0){
          return `📦 新订单将在${pageData.nearestOrderStartDays}天后开始`
        }
        else if (pageData.deadlineDays>0){
          return `📦 当前未完成订单将在${pageData.deadlineDays}天后截止`
        }
        else if(!pageData.deadlineDays&&pageData.deadToday){
          return '⚠️ 当前未完成订单将于今天截至，请尽快处理！'
        }
        else if(!pageData.dead&&!pageData.nearestOrder){
          return `✅ 所有订单已处理`;
        };
        
      }
      if (route === 'pages/studios/studios') {
        const newResources = pageData.newResources || 0;
        return newResources ? `🆕 新增 ${newResources} 个资源` : '📚 资源库已同步';
      }
      if (route === 'pages/income/income') {
        const monthIncome = pageData.monthIncome || 0;
        return `💰 本月收入 ${monthIncome} 元。`;
      }
      if (route === 'pages/detail/detail' || route === 'pages/orderView/orderView') {
        // 详情页可显示订单状态
        if (pageData.status) return `订单状态：${pageData.status}`;
        return '';
      }
      return '';
    },

    // 调用AI生成气泡,大约消耗40s
    generateAiBubble(pageData:any,prompt:string) {
      if (this.data.isFetchingAI) return; // 避免重复请求
      this.setData({ isFetchingAI: true });

      wx.request({
        url: `${this.data.serverUrl}/minichat`,
        method: 'POST',
        data: { message: prompt , is_save:false},
        timeout: 40000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.reply) {
            this.showBubbleWithTimeout(res.data.reply);
            // this.setData({ lastAiRequestTime: Date.now() });
          } else {
            // this.setData({ bubbleText: '' });
          }
        },
        fail: (err) => {
          console.error('AI请求失败', err);
          
        },
        complete: () => {
          this.setData({ isFetchingAI: false , lastAiRequestTime: Date.now()});
        }
      });
    },

    onIconTap() {
     wx.navigateTo({url:"/pages/AiTool/AiTool"})
    }
  }
});