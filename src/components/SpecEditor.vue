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
import { onBeforeUnmount, ref, computed, watchEffect, useTemplateRef } from 'vue'
import type * as Monaco from 'monaco-types'
import { useMonaco } from '@guolao/vue-monaco-editor'
import { KEmptyState } from '@kong/kongponents'
import { CodeblockIcon, ProgressIcon } from '@kong/icons'

// Props
const content = defineModel<string>({
  required: true,
})

const { monacoRef, unload, isLoadFailed } = useMonaco()

const containerRef = useTemplateRef('containerRef')

const editorInstance = ref<Monaco.editor.IStandaloneCodeEditor | null>(null)

const lang = ref<'json' | 'yaml'>('json')

const defaultEditorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs',
  automaticLayout: true,
  minimap: { enabled: false },
  formatOnType: true,
  formatOnPaste: true,
  wordWrap: 'bounded',
  tabSize: 2,
  insertSpaces: true,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  suggestOnTriggerCharacters: true,
  quickSuggestions: { other: true, comments: false, strings: true },
  snippetSuggestions: 'inline',
  fixedOverflowWidgets: true,
  lineNumbers: 'on',
  renderWhitespace: 'boundary',
  glyphMargin: false,
  suggest: {
    showWords: false, // Prevent showing word suggestions that exist in the document
  },
  scrollBeyondLastLine: false,
  roundedSelection: false,
  colorDecorators: true,
  folding: true, // Enable code folding for MDC block components
  detectIndentation: false, // Important as to not override tabSize
  trimAutoWhitespace: true,
  find: {
    addExtraSpaceOnTop: false, // we need this set to false to get the correct absolute position, otherwise when the search box opens the content shifts
  },
}

const isLoading = computed(() => !monacoRef.value || isLoadFailed.value)

// monaco setup
const stop = watchEffect(async () => {
  setupEditor()
})

// clean up on unmount
onBeforeUnmount(() => {
  if (!monacoRef.value) {
    unload()
  }
})

async function setupEditor() {
  if (!monacoRef.value || !containerRef.value) return

  const editor = monacoRef.value.editor.create(containerRef.value, {
    ...defaultEditorOptions,
    value: content.value,
    language: lang.value,
  })

  const model = editor.getModel()
  if (!model) return

  editorInstance.value = editor

  const updateLanguage = () => {
    const value = editor.getValue()
    lang.value = value.trim().startsWith('{') || value.trim().startsWith('[') ? 'json' : 'yaml'
    monacoRef.value?.editor.setModelLanguage(model, lang.value)
    content.value = value
  }

  // Set the initial language based on the content
  updateLanguage()

  editor.onDidChangeModelContent(updateLanguage)
  editor.onDidPaste(updateLanguage)

  // stop the watcher after setup
  stop()
}
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
</style>

<style lang="scss">
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
