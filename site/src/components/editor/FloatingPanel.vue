<template>
  <div class="editor-floating-panel">
    <!-- Panel -->
    <Transition name="panel-pop">
      <div v-if="open" ref="panelRef" class="floating-card">
        <!-- Tab bar -->
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'file' }"
            aria-label="文件"
            @click="activeTab = 'file'"
          >
            <span class="i-tabler:file-text size-4" />
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'appearance' }"
            aria-label="外观"
            @click="activeTab = 'appearance'"
          >
            <span class="i-tabler:palette size-4" />
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'asset' }"
            aria-label="照片"
            @click="activeTab = 'asset'"
          >
            <span class="i-ri:image-line size-4" />
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'icon' }"
            aria-label="图标"
            @click="activeTab = 'icon'"
          >
            <span class="i-tabler:icons size-4" />
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'layout' }"
            aria-label="排版"
            @click="activeTab = 'layout'"
          >
            <span class="i-tabler:layout size-4" />
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'info' }"
            aria-label="语法说明"
            @click="activeTab = 'info'"
          >
            <span class="i-tabler:info-circle size-4" />
          </button>
        </div>

        <div class="tab-divider" />

        <!-- Tab content -->
        <div class="tab-content">
          <EditorPanelsFilePanel v-if="activeTab === 'file'" />
          <EditorPanelsAppearancePanel v-else-if="activeTab === 'appearance'" />
          <EditorPanelsAssetPanel v-else-if="activeTab === 'asset'" />
          <EditorPanelsIconPanel v-else-if="activeTab === 'icon'" />
          <EditorPanelsLayoutPanel v-else-if="activeTab === 'layout'" />
          <EditorPanelsInfoPanel v-else-if="activeTab === 'info'" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });
const activeTab = ref("file");
const panelRef = ref<HTMLElement>();

onClickOutside(panelRef, () => {
  open.value = false;
});
</script>

<style scoped>
/* Card */
.floating-card {
  position: fixed;
  right: 12px;
  bottom: 12px;
  width: 280px;
  max-height: 480px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

/* Tab bar */
.tab-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 4px 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition:
    background 100ms,
    color 100ms;
}

.tab-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.tab-btn.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

/* Divider */
.tab-divider {
  height: 1px;
  background: hsl(var(--border));
  margin: 4px 0 0;
  flex-shrink: 0;
}

/* Content */
.tab-content {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

/* Transitions */
.panel-pop-enter-active {
  transition: all 150ms ease-out;
}
.panel-pop-leave-active {
  transition: all 100ms ease-in;
}
.panel-pop-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
.panel-pop-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
