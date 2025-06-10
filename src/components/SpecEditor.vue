<template>
  <div class="code-editor-wrapper">
    <div
      ref="containerRef"
      class="editor-container"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref, watchEffect, useTemplateRef } from 'vue'
import type * as Monaco from 'monaco-types'
import { useMonaco } from '@guolao/vue-monaco-editor'

// Props
const specYaml = defineModel<string>({
  required: true,
})

const { monacoRef, unload } = useMonaco()

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
    value: specYaml.value,
    language: lang.value,
  })

  const model = editor.getModel()
  if (!model) return

  editorInstance.value = editor

  const updateLanguage = () => {
    const value = editor.getValue()
    lang.value = value.trim().startsWith('{') || value.trim().startsWith('[') ? 'json' : 'yaml'
    monacoRef.value?.editor.setModelLanguage(model, lang.value)
    specYaml.value = value
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
    height: 100vh;
  }
}
</style>
