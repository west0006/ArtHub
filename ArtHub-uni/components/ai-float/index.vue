<!-- components/ai-float/index.vue -->
<template>
  <view class="float-assistant" @tap="onIconTap">
    <image src="/static/images/t2.png" class="ai-icon" mode="aspectFill" />
    <view class="bubble" :class="{ show: showBubble }">
      <text>{{ bubbleText }}</text>
      <view class="bubble-arrow"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue';
  import { useStore } from '@/store';

  const store = useStore();
  const bubbleText = ref('');
  const showBubble = ref(false);
  const isFetchingAI = ref(false);
  const lastAiRequestTime = ref(0);
  let hideBubbleTimer : number | undefined;

  const AI_REQUEST_INTERVAL = 40000;
  const BUBBLE_DISPLAY_TIME = 7000;
  const serverUrl = 'https://acclimatable-subcardinal-charlesetta.ngrok-free.dev';

  // 显示气泡并自动隐藏
  const showBubbleWithTimeout = (text : string) => {
    if (hideBubbleTimer) clearTimeout(hideBubbleTimer);
    bubbleText.value = text;
    showBubble.value = true;
    hideBubbleTimer = setTimeout(() => {
      showBubble.value = false;
    }, BUBBLE_DISPLAY_TIME) as unknown as number;
  };

  // 本地规则气泡（根据路由和业务数据）
  const getLocalBubbleText = (route : string, pageData : Record<string, any>) : string => {
    // 注意：需与 pages.json 中定义的路径完全一致
    if (route === 'pages/order/calendar') {
      if (pageData.dead) return '⚠️ 有逾期订单';
      if (pageData.nearestOrderStartDays > 0) {
        return `📦 新订单将在${pageData.nearestOrderStartDays}天后开始`;
      } else if (pageData.deadlineDays > 0) {
        return `📦 当前未完成订单将在${pageData.deadlineDays}天后截止`;
      } else if (!pageData.deadlineDays && pageData.deadToday) {
        return '⚠️ 当前未完成订单将于今天截至，请尽快处理！';
      } else if (!pageData.dead && !pageData.nearestOrder) {
        return '✅ 所有订单已处理';
      }
    }
    if (route === 'pages/resource/list') {
      const newResources = pageData.newResources || 0;
      return newResources ? `🆕 新增 ${newResources} 个资源` : '📚 资源库已同步';
    }
    if (route === 'pages/income/index') {
      const monthIncome = pageData.monthIncome || 0;
      return `💰 本月收入 ${monthIncome} 元。`;
    }
    return '';
  };

  // 构造 AI 提示词
  const buildAIPrompt = (route : string, pageData : Record<string, any>) : string => {
    if (route === 'pages/order/calendar') {
      return `今日是否空闲:${pageData.currentStatus},距离当前最近未完成的订单的截稿日天数:${pageData.deadlineDays},是否之前有订单超时:${pageData.dead},有没有未完成的订单是在今日截稿:${pageData.deadToday},如果当前空闲,距离下一个订单开始日的天数:${pageData.nextOrderDays},基于以上信息,生成25字以内的分析或互动性的回复`;
    }
    if (route === 'pages/income') {
      return `本月收入：${pageData.monthIncome || 0}元，总收入：${pageData.totalIncome || 0}元，趋势：${pageData.incomeTrend || 0}%，收入明细：${pageData.incomeList},平均单价:${pageData.averageIncome},已完成订单数：${pageData.completedOrders},生成三十字内分析或鼓励。`;
    }
    if (route === 'pages/order/detail' || route === 'pages/order/edit') {
      return `当前查看订单详情，订单状态：${pageData.orderStatus}，客户：${pageData.orderData?.clientName}，橱窗名称：${pageData.orderData?.windowName},订单描述：${pageData.orderData?.description}，设定信息：${pageData.orderData?.settingInfo}，开始日期和截稿日期：${pageData.orderData?.startDate},${pageData.orderData?.deadline}，请根据订单信息给出五十字内建议或提醒。`;
    }
    if (route === 'pages/order/add') {
      return `当前在新建订单页面，订单描述：${pageData.description}，设定信息：${pageData.settingInfo}，开始日期和截稿日期：${pageData.startDate},${pageData.deadline}，请根据订单信息给出五十字内建议或提醒。`;
    }
    return '';
  };

  // 调用 AI 生成气泡
  const generateAiBubble = (pageData : Record<string, any>, prompt : string) => {
    if (isFetchingAI.value) return;
    isFetchingAI.value = true;
    uni.request({
      url: `${serverUrl}/minichat`,
      method: 'POST',
      data: { message: prompt, is_save: false },
      timeout: 40000,
      success: (res : any) => {
        if (res.statusCode === 200 && res.data?.reply) {
          showBubbleWithTimeout(res.data.reply);
        }
      },
      fail: (err) => {
        console.error('AI请求失败', err);
      },
      complete: () => {
        isFetchingAI.value = false;
        lastAiRequestTime.value = Date.now();
      },
    });
  };

  // 监听 Store 快照变化，触发气泡更新
  watch(
    () => store.pageSnapshot,
    (snapshot) => {
      if (!snapshot.route) return;

      // 1. 立即显示本地气泡
      const localText = getLocalBubbleText(snapshot.route, snapshot.data);
      if (localText) {
        showBubbleWithTimeout(localText);
      }

      // 2. 判断是否触发 AI 请求
      if (!isFetchingAI.value && (Date.now() - lastAiRequestTime.value >= AI_REQUEST_INTERVAL)) {
        const prompt = buildAIPrompt(snapshot.route, snapshot.data);
        if (prompt) {
          generateAiBubble(snapshot.data, prompt);
        }
      }
    },
    { immediate: true }
  );

  const onIconTap = () => {
    // 根据实际 AI 聊天页面路径调整
    uni.navigateTo({ url: '/pages/agent' });
  };

  onUnmounted(() => {
    if (hideBubbleTimer) clearTimeout(hideBubbleTimer);
  });
</script>

<style scoped>
  .float-assistant {
    position: fixed;
    right: 30rpx;
    bottom: 150rpx;
    width: 100rpx;
    height: 100rpx;
    border-radius: 8rpx;
    background-color: #2e7d32;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .float-assistant:active {
    transform: scale(0.95) translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .ai-icon {
    width: 60rpx;
    height: 60rpx;
    border-radius: 4rpx;
  }

  .bubble {
    position: absolute;
    right: 120rpx;
    top: 50%;
    transform: translateY(-50%);
    background-color: #ffffff;
    border-radius: 8rpx;
    padding: 20rpx 32rpx;
    max-width: 580rpx;
    font-size: 26rpx;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  }

  .bubble.show {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }

  .bubble-arrow {
    position: absolute;
    right: -20rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 20rpx solid #ffffff;
    border-top: 16rpx solid transparent;
    border-bottom: 16rpx solid transparent;
    z-index: 2;
  }

  .bubble-arrow::after {
    content: '';
    position: absolute;
    left: -24rpx;
    top: -16rpx;
    width: 0;
    height: 0;
    border-left: 22rpx solid #1a1a1a;
    border-top: 18rpx solid transparent;
    border-bottom: 18rpx solid transparent;
    z-index: -1;
  }

  .bubble-arrow::before {
    content: '';
    position: absolute;
    left: -22rpx;
    top: -15rpx;
    width: 0;
    height: 0;
    border-left: 20rpx solid #cccccc;
    border-top: 15rpx solid transparent;
    border-bottom: 15rpx solid transparent;
    z-index: -1;
  }

  @media (prefers-color-scheme: dark) {
    .float-assistant {
      background-color: #2e7d32;
      border-top-color: #5a5a5a;
      border-left-color: #5a5a5a;
      border-right-color: #000000;
      border-bottom-color: #000000;
    }

    .bubble {
      background-color: #2d2d2d;
      border-top-color: #5a5a5a;
      border-left-color: #5a5a5a;
      border-right-color: #000000;
      border-bottom-color: #000000;
      color: #f0f0f0;
    }

    .bubble-arrow {
      border-left-color: #2d2d2d;
    }

    .bubble-arrow::before {
      border-left-color: #5a5a5a;
    }

    .bubble-arrow::after {
      border-left-color: #000000;
    }
  }
</style>