<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps } from "radix-vue";
import { cn } from "~/utils/shadcn";

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="
        cn(
          'flex flex-1 items-center justify-between py-2 text-sm font-medium transition-all hover:underline [&[data-state=open]>span.chevron>svg]:rotate-180',
          props.class
        )
      "
    >
      <slot />
      <span class="chevron shrink-0 text-muted-foreground transition-transform duration-200">
        <span class="i-lucide:chevron-down size-4" />
      </span>
    </AccordionTrigger>
  </AccordionHeader>
</template>
