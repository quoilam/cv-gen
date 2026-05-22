<template>
  <div class="flex h-full">
    <div
      id="toolbar"
      class="pane-container overflow-y-scroll hide-scrollbar bg-card border border-border/60
             rounded-l-xl ml-1 shadow-sm"
      lt-lg="bg-card rounded-none border-none shadow-none"
    >
      <UiAccordion type="multiple" :default-value="allGroups" class="p-2">
        <UiAccordionItem
          v-for="group in groups"
          :key="group.id"
          :value="group.id"
          :id="`group-${group.id}`"
          class="mb-1 border border-border/30 rounded-lg overflow-hidden last:mb-0"
        >
          <UiAccordionTrigger class="px-4 py-3.5 text-sm font-semibold tracking-wide bg-muted/20 hover:bg-muted/40 transition-colors">
            <div class="flex items-center gap-2.5">
              <span :class="group.icon" class="size-4.5 text-primary/70" />
              <span class="text-foreground/85">{{ group.label }}</span>
            </div>
          </UiAccordionTrigger>
          <UiAccordionContent class="px-0 pb-1">
            <template v-for="(toolId, idx) in group.tools" :key="toolId">
              <component :is="componentMap[toolId]" :id="`toolbar-${toolId}`" />
              <UiSeparator
                v-if="idx < group.tools.length - 1"
                class="w-[calc(100%-40px)] mx-auto opacity-50"
              />
            </template>
          </UiAccordionContent>
        </UiAccordionItem>
      </UiAccordion>
    </div>

    <!-- Sidebar icon rail -->
    <div
      flex="center col none gap-1"
      class="w-10 bg-muted/50 border border-border/40 border-l-0 rounded-r-xl mr-1"
      lt-lg="hidden"
    >
      <template v-for="group in groups" :key="group.id">
        <UiTooltipProvider :delay-duration="0">
          <UiTooltip>
            <UiTooltipTrigger as-child>
              <UiButton
                size="round"
                variant="ghost"
                class="text-muted-foreground hover:text-foreground hover:bg-muted"
                @click="toggleGroup(group.id)"
                :aria-label="group.label"
              >
                <span :class="[group.icon, 'size-4']" />
              </UiButton>
            </UiTooltipTrigger>
            <UiTooltipContent side="left">
              {{ group.label }}
            </UiTooltipContent>
          </UiTooltip>
        </UiTooltipProvider>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  EditorToolbarFile,
  EditorToolbarPaper,
  EditorToolbarThemeColor,
  EditorToolbarFontFamily,
  EditorToolbarFontSize,
  EditorToolbarMargins,
  EditorToolbarParagraphAndLine,
  EditorToolbarAi,
  EditorToolbarIcon,
  EditorToolbarGit,
  EditorToolbarSmartOnePage,
} from "#components";

const allGroups = ["file", "typography", "content", "version"];

const groups = [
  {
    id: "file",
    label: "文件",
    icon: "i-lucide:file-text",
    tools: ["file"]
  },
  {
    id: "photo",
    icon: "i-lucide:user-round",
    component: EditorToolbarPhoto
  },
  {
    id: "content",
    label: "内容",
    icon: "i-lucide:puzzle",
    tools: ["asset", "icon", "ai"]
  },
  {
    id: "version",
    label: "版本",
    icon: "i-lucide:git-branch",
    tools: ["git"]
  }
];

const componentMap: Record<string, any> = {
  file: EditorToolbarFile,
  paper_size: EditorToolbarPaper,
  theme_color: EditorToolbarThemeColor,
  font_family: EditorToolbarFontFamily,
  font_size: EditorToolbarFontSize,
  margins: EditorToolbarMargins,
  paragraph_and_line: EditorToolbarParagraphAndLine,
  smart_one_page: EditorToolbarSmartOnePage,
  asset: EditorToolbarAsset,
  icon: EditorToolbarIcon,
  ai: EditorToolbarAi,
  git: EditorToolbarGit
};

function toggleGroup(groupId: string) {
  const toolbar = document.querySelector<HTMLElement>("#toolbar");
  const item = document.getElementById(`group-${groupId}`);

  if (!toolbar || !item) return;

  const trigger = item.querySelector("button");
  if (trigger) trigger.click();

  toolbar.scrollTo({
    top: item.offsetTop - 48,
    behavior: "smooth"
  });
};

const { t } = useI18n();

const getTooltip = (id: string) => {
  const key = `toolbar.${id}`;
  return ["photo", "file", "correct_case", "font_family", "margins", "ai", "icon", "git", "smart_one_page"].includes(id)
    ? t(`${key}.title`)
    : t(key);
};
</script>
