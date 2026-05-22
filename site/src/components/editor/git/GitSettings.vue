<template>
  <div class="p-3 space-y-3">
    <template v-if="!configured">
      <input
        v-model="repoUrl"
        type="text"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="https://github.com/user/resumes.git"
      />
      <input
        v-model="token"
        type="password"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="GitHub Personal Access Token"
      />
      <UiButton size="sm" class="w-full" :disabled="syncing" @click="doConnect">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ syncing ? $t("git.connecting") : $t("git.connect") }}
      </UiButton>
    </template>

    <template v-else>
      <div class="flex items-center gap-2">
        <span
          class="size-2 rounded-full shrink-0"
          :class="{
            'bg-green-500': syncStatus === 'synced' || syncStatus === 'idle',
            'bg-yellow-500 animate-pulse': syncStatus === 'syncing',
            'bg-red-500': syncStatus === 'error',
          }"
        />
        <span class="text-sm">
          {{ statusText }}
        </span>
        <UiButton
          size="xs"
          variant="ghost"
          class="ml-auto"
          :disabled="syncStatus === 'syncing'"
          @click="doPull"
        >
          <span i-lucide:refresh-cw class="size-3.5" />
        </UiButton>
      </div>

      <div v-if="syncStatus === 'error' && error" class="text-xs text-destructive">
        {{ error }}
      </div>

      <div class="flex gap-2">
        <UiButton size="xs" variant="outline" :disabled="syncing" @click="doPush">
          <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ $t("git.sync_now") }}
        </UiButton>
        <UiButton size="xs" variant="ghost" class="text-destructive" @click="doDisconnect">
          {{ $t("git.disconnect") }}
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const git = useGit();
const { configured, syncStatus, error } = git;

const repoUrl = ref("");
const token = ref("");

const syncing = computed(() => syncStatus.value === "syncing");

const statusText = computed(() => {
  switch (syncStatus.value) {
    case "synced": return "已同步";
    case "syncing": return "同步中...";
    case "error": return "同步失败";
    default: return "就绪";
  }
});

const doConnect = async () => {
  try { await git.configure({ repoUrl: repoUrl.value, token: token.value }); } catch {}
};

const doPull = async () => { try { await git.pull(); } catch {} };
const doPush = async () => { try { await git.push(); } catch {} };

const doDisconnect = () => { git.disconnect(); };
</script>
