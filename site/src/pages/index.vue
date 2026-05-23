<template>
  <ClientOnly>
    <div id="dashboard-page" class="flex flex-col">
      <SharedHeader />

      <div class="workspace max-w-7xl mx-auto flex flex-col" p="x-5 y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">我的简历</h1>
            <p class="text-sm text-muted-foreground mt-1">
              管理您的所有简历，数据安全保存在本地
            </p>
          </div>
          <DashboardFile @update="refresh" />
        </div>

        <UiScrollArea class="flex-1">
          <div class="gap-5 pb-6" flex="~ wrap">
            <DashboardNewResume />

            <template v-if="status === 'success'">
              <DashboardResumeItem
                v-for="resume in resumes"
                :key="resume.id"
                :resume="resume"
                @update="refresh"
              />
            </template>
            <template v-else>
              <div v-for="i in 4" :key="i" class="w-60 h-[360px]">
                <UiSkeleton class="w-[220px] h-[315px] bg-muted rounded-lg mx-auto" />
                <UiSkeleton class="w-32 h-4 bg-muted rounded mx-auto mt-3" />
                <UiSkeleton class="w-24 h-3 bg-muted rounded mx-auto mt-2" />
              </div>
            </template>
          </div>
        </UiScrollArea>
      </div>
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import type { DbResume } from "~/utils/storage";

const { getResumes } = useResume();

const {
  data: resumes,
  refresh,
  status
} = useAsyncData<DbResume[]>("resume-list", () => getResumes(), {
  server: false,
  immediate: false,
  default: () => []
});

onMounted(refresh);
</script>
