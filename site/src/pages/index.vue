<template>
  <div id="landing-page" class="min-h-screen flex flex-col">
    <SharedHeader />

    <!-- Hero Section -->
    <section class="relative flex-1 flex flex-col items-center justify-center px-5 py-20">
      <!-- Background decorations -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          class="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                 bg-primary/5 rounded-full blur-[120px]"
        />
        <div
          class="absolute top-40 left-1/4 w-[400px] h-[300px]
                 bg-blue-400/5 rounded-full blur-[100px]"
        />
        <div
          class="absolute bottom-20 right-1/4 w-[350px] h-[250px]
                 bg-indigo-300/5 rounded-full blur-[80px]"
        />
      </div>

      <div class="relative z-10 text-center max-w-3xl mx-auto">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8
                 rounded-full bg-primary/10 text-primary text-sm font-medium
                 border border-primary/20"
        >
          <span class="i-lucide:sparkles size-3.5" />
          开源免费 · 隐私优先
        </div>

        <!-- Hero Title -->
        <h1
          class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6"
        >
          用 Markdown 写<span class="text-primary">简历</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          一款简洁强大的在线简历制作工具，让您轻松创建和管理简历。
          数据保存在本地，绝不收集您的任何信息。
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <UiButton
            :as="NuxtLink"
            to="/dashboard"
            size="lg"
            class="text-base h-12 px-8 font-medium shadow-lg shadow-primary/25
                   hover:shadow-xl hover:shadow-primary/30 transition-shadow"
          >
            <span class="i-lucide:pen-line size-4.5 mr-2" />
            开始制作简历
          </UiButton>
          <UiButton
            as="a"
            href="https://github.com/quoilam/cv-gen"
            target="_blank"
            variant="outline"
            size="lg"
            class="text-base h-12 px-6 font-medium"
          >
            <span i-tabler:brand-github class="size-4.5 mr-2" />
            GitHub
          </UiButton>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="relative px-5 pb-24">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            为什么选择 <SharedBrandName />
          </h2>
          <p class="text-muted-foreground">专注于写作体验，让简历回归内容本身</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="(feat, idx) in features"
            :key="feat.title"
            class="group relative bg-card rounded-xl border border-border/60 p-6
                   hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5
                   transition-all duration-300"
            :style="{ transitionDelay: `${idx * 50}ms` }"
          >
            <div
              :class="[
                'size-10 rounded-lg flex-center mb-4 transition-colors duration-300',
                feat.bgClass
              ]"
            >
              <span :class="[feat.icon, 'size-5 text-white']" />
            </div>
            <h3 class="font-semibold text-base mb-2 tracking-tight">{{ feat.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border/60 px-5 py-8 text-center">
      <p class="text-sm text-muted-foreground">
        Built with <span class="i-lucide:heart size-3.5 inline-block text-red-400 align-middle mx-0.5" /> by
        <a
          href="https://github.com/quoilam/cv-gen"
          target="_blank"
          class="font-medium text-foreground hover:text-primary transition-colors"
        >quoilam</a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";

const features = [
  {
    title: "Markdown 写作",
    desc: "使用熟悉的 Markdown 语法撰写简历内容，实时预览，所见即所得。支持 LaTeX 数学公式和交叉引用。",
    icon: "i-lucide:file-text",
    bgClass: "bg-blue-500"
  },
  {
    title: "隐私优先",
    desc: "所有数据保存在浏览器本地，无需注册登录，无用户追踪，无广告。您的简历只属于您自己。",
    icon: "i-lucide:shield-check",
    bgClass: "bg-emerald-500"
  },
  {
    title: "多格式导出",
    desc: "一键导出为 PDF、HTML、DOCX 等格式。支持 A4 和 Letter 纸张，自动分页和一页自适应。",
    icon: "i-lucide:download",
    bgClass: "bg-violet-500"
  },
  {
    title: "高度可定制",
    desc: "自由调整字体、字号、边距、行距、主题色。内置多款优质字体，支持中英文混排。",
    icon: "i-lucide:palette",
    bgClass: "bg-amber-500"
  },
  {
    title: "智能工具",
    desc: "AI 辅助生成和优化简历内容。图标搜索、图片管理、Git 版本控制等实用功能。",
    icon: "i-lucide:wand-2",
    bgClass: "bg-rose-500"
  },
  {
    title: "版本控制",
    desc: "内置 Git 集成，自动保存修改历史，随时回退到任意版本。不再担心误操作丢失内容。",
    icon: "i-lucide:git-branch",
    bgClass: "bg-cyan-500"
  }
];
</script>
