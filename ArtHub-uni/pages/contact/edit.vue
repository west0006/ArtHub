<template>
  <view class="page-container profile-page">
    <view class="avatar-section" @tap="onChooseAvatar">
      <image class="avatar" :src="avatarUrl || '/static/images/t1.png'" mode="aspectFill" />
      <view class="avatar-edit-icon">
        <van-icon name="photograph" size="32rpx" color="#fff" />
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <view class="form-container">
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input class="form-input" placeholder="请输入昵称" :value="nickname" @input="onNicknameInput" maxlength="20" />
      </view>
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input class="form-input" placeholder="请输入手机号" :value="phone" type="number" @input="onPhoneInput"
          maxlength="11" />
      </view>
      <view class="form-item" v-if="userInfo.id">
        <text class="form-label">用户 ID</text>
        <input class="form-input" disabled :value="userInfo.id" />
      </view>
    </view>

    <view class="save-btn-container">
      <button class="save-btn" :class="{ active: canSave }" @tap="saveProfile" :disabled="!canSave">保存修改</button>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

  const store = useStore();
  const userInfo = ref<any>({});
  const originalNickname = ref('');
  const originalPhone = ref('');
  const avatarUrl = ref('');
  const nickname = ref('');
  const phone = ref('');
  const canSave = ref(false);

  onLoad(() => {
    const user = store.userInfo || {};
    userInfo.value = user;
    avatarUrl.value = user.avatarUrl || '';
    nickname.value = user.nickname || '';
    phone.value = user.phone || '';
    originalNickname.value = user.nickname || '';
    originalPhone.value = user.phone || '';
  });

  const onChooseAvatar = () => {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        uni.showLoading({ title: '上传中...' });
        setTimeout(() => {
          avatarUrl.value = res.tempFiles[0].tempFilePath;
          uni.hideLoading();
          uni.showToast({ title: '头像更新成功', icon: 'success' });
          checkCanSave();
        }, 1000);
      },
    });
  };
  const onNicknameInput = (e : any) => {
    nickname.value = e.detail.value;
    checkCanSave();
  };
  const onPhoneInput = (e : any) => {
    phone.value = e.detail.value;
    checkCanSave();
  };
  const checkCanSave = () => {
    canSave.value = nickname.value !== originalNickname.value || phone.value !== originalPhone.value || avatarUrl.value !== (userInfo.value.avatarUrl || '');
  };
  const saveProfile = async () => {
    if (!canSave.value) return;
    uni.showLoading({ title: '保存中...' });
    // 模拟保存
    setTimeout(() => {
      let updatedUser = { ...store.userInfo, nickname: nickname.value, avatarUrl: avatarUrl.value, phone: phone.value };
      store.setUser(updatedUser);
      uni.setStorageSync('userInfo', updatedUser);
      originalNickname.value = nickname.value;
      originalPhone.value = phone.value;
      canSave.value = false;
      uni.hideLoading();
      uni.showToast({ title: '保存成功', icon: 'success' });
    }, 800);
  };
</script>
<!-- 样式沿用 profile.wxss -->
<style>
  /* pages/editOrder/editOrder.wxss - 夸克粗边框圆角风 + 绿色点缀 */

  .page-container {
    background-color: #ffffff;
    /* 纯白背景 */
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* 导航头部 - 粗黑下边框 */
  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 32rpx;
    /* 略缩内边距更紧凑 */
    background-color: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
    /* 粗黑边框替代细线 */
    flex-shrink: 0;
  }

  .nav-back {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.5px;
  }

  .nav-actions {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  /* 滚动区域 */
  .form-scroll {
    flex: 1;

    padding: 24rpx 32rpx 32rpx;
    /* 统一外间距 */
  }

  /* 表单区块 - 粗黑边框卡片 */
  .form-section {
    background-color: #ffffff;
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    padding: 28rpx;
    margin-bottom: 32rpx;
    /* 区块间距 */
    box-sizing: border-box;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24rpx;
    border-left: 8rpx solid #2e7d32;
    /* 绿色强调条 */
    padding-left: 20rpx;
  }

  .form-item {
    margin-bottom: 28rpx;
    /* 项间距 */
  }

  .form-item:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    font-size: 26rpx;
    color: #5a5a5a;
    font-weight: 500;
    margin-bottom: 12rpx;
  }

  /* 输入框 - 粗边框 */
  .form-input {
    width: 100%;
    height: 80rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
    outline: none;
  }

  .form-input::placeholder {
    color: #8a8a8a;
  }

  .form-row {
    display: flex;
    gap: 20rpx;
  }

  .form-half {
    flex: 1;
  }

  /* 选择器显示值 */
  .picker-value {
    width: 100%;
    height: 80rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    line-height: 80rpx;
    font-weight: 500;
    box-sizing: border-box;
  }

  /* 文本域 */
  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
    outline: none;
  }

  .form-textarea::placeholder {
    color: #8a8a8a;
  }

  /* 图片网格 */
  .images-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .image-item {
    width: calc(33.333% - 11rpx);
    aspect-ratio: 1;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    overflow: hidden;
    box-sizing: border-box;
  }

  .reference-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 底部操作栏 - 粗边框分割 */
  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    padding: 24rpx 32rpx;
    border-top: 6rpx solid #1a1a1a;
    box-shadow: none;
    display: flex;
    gap: 20rpx;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .btn {
    flex: 1;
    height: 80rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    transition: none;
  }

  .btn.cancel {
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .btn.save {
    background-color: #2e7d32;
    /* 绿色保存按钮 */
    color: #ffffff;
  }

  .bottom-safe-area {
    height: env(safe-area-inset-bottom);
    background-color: transparent;
  }
</style>