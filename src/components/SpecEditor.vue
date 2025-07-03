<template>
  <div class="code-editor-wrapper">
    <KEmptyState
      v-if="isLoading"
      class="editor-container-state"
      message="Please wait while the api specification content is loading."
      title="API specification Editor"
    >
      <template #icon>
        <ProgressIcon decorative />
      </template>
    </KEmptyState>

    <div
      ref="containerRef"
      class="editor-container"
    />

    <KEmptyState
      v-show="!content"
      class="editor-container-state"
      message="Paste or load an OpenAPI or Async API file in YAML or JSON format (max size: 8MB)."
      title="API specification"
    >
      <template #icon>
        <CodeblockIcon decorative />
      </template>
    </KEmptyState>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, useTemplateRef, watch } from 'vue'
import { KEmptyState } from '@kong/kongponents'
import { CodeblockIcon, ProgressIcon } from '@kong/icons'
import useMonacoEditor from '@/composables/useMonacoEditor'
import { isJsonOrYaml } from '@/utils/oas'

// Props
const content = defineModel<string>({
  required: true,
})

const containerRef = useTemplateRef('containerRef')

const lang = ref<'json' | 'yaml'>('json')

const isLoading = computed(() => false)

watch(content, (newContent) => {
  lang.value = isJsonOrYaml(newContent)
}, { immediate: true })

const { formatDocument } = useMonacoEditor(containerRef, {
  language: lang.value,
  code: content,
  forceTheme: 'light',
  readOnly: false,
  onChanged: (newContent) => {
    content.value = newContent
  },
})

defineExpose({
  formatDocument,
})
</script>

<style lang="scss" scoped>
.code-editor-wrapper {
  overflow: hidden;
  position: relative;

  .editor-container {
    background-color: $kui-color-background;
    height: calc(100vh - (#{$toolbarHeight} + #{$headerHeight}));
  }
}

:deep(.monaco-editor) {
  // Customize monaco editor styles via `--vscode-` variables
  /* stylelint-disable */
  --vscode-editorLineNumber-activeForeground: #{$kui-color-text-primary};
  --vscode-editorLineNumber-foreground: #{$kui-color-text-neutral-weak};

  --vscode-editor-background: #{$kui-color-background};
  --vscode-editorGutter-background: #{$kui-color-background};
  --vscode-editorLineNumber-activeForeground: #{$kui-color-text-primary};
  // Suggestions
  --vscode-editorSuggestWidget-background: #{$kui-color-background};
  --vscode-editorSuggestWidget-border: #{$kui-color-border};
  // Context menu
  --vscode-menu-background: #{$kui-color-background};
  --vscode-menu-border: #{$kui-color-border};
  --vscode-menu-separatorBackground: #{$kui-color-border};
  // Other
  --vscode-focusBorder: #{$kui-color-text-neutral};
  --vscode-input-background: #{$kui-color-background};
  --vscode-sash-hoverBorder: #{$kui-color-border-primary};
  /* stylelint-enable */

  // Modify the editor's search box styles
  .find-widget {
    background: $kui-color-background;
    border-bottom: $kui-border-width-10 solid $kui-color-border-neutral-weaker;

    // the pane to resize the search box
    .monaco-sash {
      background-color: $kui-color-background-neutral-weaker;
    }

    // Modify the search input
    .monaco-inputbox {
      background-color: $kui-color-background !important;
      border: $kui-border-width-10 solid $kui-color-border-neutral-weaker !important;
    }
  }

  // warning marker
  .squiggly-warning {
    // ffc107 is the colour for warning markers
    background: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23ffc107'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left;
  }
}
</style>

<style lang="scss">
// can't move it to global.scss as the tokens would not be available
.editor-container-state {
  background: transparent;
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);

  :deep(.empty-state-content) {

    .empty-state-title,
    .empty-state-message {
      color: $kui-color-text-neutral !important;
    }
  }
}
</style>
