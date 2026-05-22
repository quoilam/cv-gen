<template>
  <div class="p-3">
    <div v-if="history.length === 0" class="text-sm text-muted-foreground text-center py-4">
      {{ $t("git.no_history") }}
    </div>

    <div v-for="commit in history" :key="commit.oid" class="border-b py-2 last:border-b-0">
      <div class="text-sm font-medium truncate">{{ commit.message }}</div>
      <div class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
        <span class="font-mono">{{ commit.oid.slice(0, 7) }}</span>
        <span>{{ new Date(commit.timestamp * 1000).toLocaleString() }}</span>
      </div>
      <UiButton size="xs" variant="ghost" class="mt-1" @click="doCheckout(commit.oid)">
        {{ $t("git.view") }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGit } from "~/composables/git";

const git = useGit();
const { history } = git;

const doCheckout = async (oid: string) => {
  try {
    await git.checkoutVersion(oid);
  } catch {}
};
</script>
