<template>
  <div>
    <!-- Not configured state -->
    <div v-if="!configured">
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">仓库地址</label>
          <UiInput v-model="repoUrl" placeholder="https://github.com/user/resumes.git" class="mt-1" />
        </div>
        <div>
          <label class="text-sm font-medium">访问令牌</label>
          <UiInput v-model="token" type="password" placeholder="ghp_xxxxxxxxxxxx" class="mt-1" />
        </div>
      </div>
      <div v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</div>
      <UiButton class="mt-3 w-full" :disabled="syncing" @click="handleConnect">
        <span v-if="syncing" i-svg-spinners:3-dots-fade mr-1 />
        {{ syncing ? '连接中...' : '连接' }}
      </UiButton>
    </div>

    <!-- Connected state -->
    <div v-else>
      <div class="flex items-center gap-2 text-sm text-green-600 mb-3">
        <span i-line-md:confirm />
        已连接
      </div>
      <UiButton variant="outline" class="w-full" @click="handleDisconnect">
        断开连接
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
const git = useGit();
const { configured, syncing, error } = git;

const repoUrl = ref("");
const token = ref("");

async function handleConnect() {
  if (!repoUrl.value || !token.value) return;
  await git.configure({ repoUrl: repoUrl.value, token: token.value });
  if (!error.value) {
    await git.clone();
  }
}

function handleDisconnect() {
  git.disconnect();
}
</script>
