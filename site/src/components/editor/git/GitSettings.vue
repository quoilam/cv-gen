<template>
  <div class="p-3 space-y-2">
    <div v-if="!configured">
      <input
        v-model="repoUrl"
        type="text"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="https://github.com/user/resumes.git"
      />
      <input
        v-model="token"
        type="password"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background mt-2"
        placeholder="GitHub Personal Access Token"
      />
      <UiButton size="sm" class="w-full mt-2" :disabled="syncing" @click="doConnect">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ syncing ? $t("git.connecting") : $t("git.connect") }}
      </UiButton>
    </div>

    <div v-else>
      <div class="text-sm text-green-600 mb-2">{{ $t("git.connected") }}</div>
      <UiButton size="sm" variant="outline" class="w-full" :disabled="syncing" @click="doSync">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ $t("git.sync") }}
      </UiButton>
    </div>

    <div v-if="error" class="text-xs text-destructive">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useGit } from "~/composables/git";

const git = useGit();
const { configured, syncStatus, error } = git;

const syncing = computed(() => syncStatus.value === "syncing");
const repoUrl = ref("");
const token = ref("");

const doConnect = async () => {
  try {
    await git.configure({ repoUrl: repoUrl.value, token: token.value });
  } catch {}
};

const doSync = async () => {
  try {
    await git.push();
  } catch {}
};
</script>
