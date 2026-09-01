<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app';
  import { useStore } from '@/store/index';

  const userStore = useStore();

  onLaunch(async () => {
    await userStore.checkLoginStatus();
  });
</script>

<style>
  /* 全局样式从 uni.scss 引入，无需重复 */
</style>