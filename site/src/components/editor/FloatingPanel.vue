<template>
  <div class="editor-floating-panel">
    <!-- Trigger dot -->
    <button
      v-show="!isOpen"
      class="floating-trigger"
      aria-label="打开编辑面板"
      @click="isOpen = true"
    >
      <span class="i-tabler:dots size-5" />
    </button>

    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="isOpen" class="floating-backdrop" @click="isOpen = false" />
    </Transition>

    <!-- Panel -->
    <Transition name="panel-pop">
      <div v-if="isOpen" class="floating-card">
        <!-- Tab bar -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            :aria-label="tab.label"
            @click="activeTab = tab.id"
          >
            <span :class="[tab.icon, 'size-4']" />
          </button>
        </div>

        <div class="tab-divider" />

        <!-- Tab content -->
        <div class="tab-content">
          <FilePanel v-if="activeTab === 'file'" />
          <AppearancePanel v-else-if="activeTab === 'appearance'" />
          <AssetPanel v-else-if="activeTab === 'asset'" />
          <LayoutPanel v-else-if="activeTab === 'layout'" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false);
const activeTab = ref("file");

const tabs = [
  { id: "file", label: "文件", icon: "i-lucide:file-text" },
  { id: "appearance", label: "外观", icon: "i-lucide:palette" },
  { id: "asset", label: "资源", icon: "i-lucide:image" },
  { id: "layout", label: "排版", icon: "i-lucide:layout" },
];
</script>

<style scoped>
.editor-floating-panel {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 50;
}

/* Trigger button */
.floating-trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 150ms, transform 150ms, box-shadow 150ms, background 150ms;
  opacity: 0.7;
}

.floating-trigger:hover {
  opacity: 1;
  background: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  border-color: hsl(var(--accent));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: scale(1.1);
}

/* Backdrop */
.floating-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

/* Card */
.floating-card {
  position: absolute;
  right: 0;
  bottom: 16px;
  width: 280px;
  max-height: 480px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  transition: background 100ms, color 100ms;
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
