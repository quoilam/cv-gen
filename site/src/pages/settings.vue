<template>
  <div id="settings-page" class="flex flex-col">
    <SharedHeader />
    <div class="workspace max-w-3xl mx-auto overflow-y-auto" p="x-5 y-8">
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">设置</h1>
        <p class="text-sm text-muted-foreground mt-1">配置 Git 同步和 AI 助手</p>
      </div>

      <div class="space-y-5">
        <!-- Git Configuration Card -->
        <div class="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-border/40">
            <div class="flex items-center gap-3">
              <div class="size-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex-center">
                <span i-lucide:git-branch class="size-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 class="font-semibold text-base">Git 配置</h2>
                <p class="text-xs text-muted-foreground">连接 Git 仓库以自动备份和版本管理</p>
              </div>
            </div>
          </div>
          <div class="px-6 py-5">
            <SettingsGitConfig />
          </div>
        </div>

        <!-- LLM Configuration Card -->
        <div class="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-border/40">
            <div class="flex items-center gap-3">
              <div class="size-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex-center">
                <span i-lucide:sparkles class="size-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 class="font-semibold text-base">AI 配置</h2>
                <p class="text-xs text-muted-foreground">配置 AI 提供商以使用智能写作和优化功能</p>
              </div>
            </div>
          </div>
          <div class="px-6 py-5">
            <SettingsLLMConfig />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>
