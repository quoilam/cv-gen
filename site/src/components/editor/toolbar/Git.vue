<template>
  <EditorToolbarBox :text="$t('toolbar.git.title')" icon="i-lucide:git-branch">
    <EditorGitSettings />
    <UiSeparator class="my-2" />
    <EditorGitHistory />
  </EditorToolbarBox>
</template>
