<template>
  <div
    ref="dropzone"
    class="spec-renderer-playground"
  >
    <header class="editor-header">
      <div class="header-title">
        <KongGradientIcon
          decorative
          :size="KUI_ICON_SIZE_50"
        />
        <h1>Kong</h1>
      </div>
      <div class="header-actions">
        <button
          class="upload-spec-file"
          type="button"
          @click="dropzoneClick()"
        >
          Upload or drop spec file
        </button>
        <input
          ref="fileInput"
          accept=".json, .yaml, .yml"
          style="position: absolute; visibility: hidden;"
          type="file"
          @change="fileUploaded"
        >
        <SettingsModal @update-settings="updateSettings" />
        <a
          class="github-link"
          href="https://github.com/Kong/spec-renderer"
          rel="noopener noreferrer"
          target="_blank"
          title="Kong Spec Renderer repository"
        >
          <img
            alt="GitHub logo"
            src="/github-logo.svg"
          >
        </a>
      </div>
    </header>
    <splitpanes class="spec-container default-theme">
      <pane
        max-size="70"
        min-size="10"
      >
        <Editor
          v-model:value="code"
          :language="editorLanguage"
          :options="MONACO_EDITOR_OPTIONS"
          theme="vs-dark"
          @mount="handleMount"
        />
      </pane>
      <pane class="spec-renderer-pane">
        <SpecRenderer
          class="spec-renderer"
          :control-address-bar="true"
          document-scrolling-container=".spec-renderer-pane"
          :spec="specText"
          v-bind="specSettings"
        />
      </pane>
    </splitpanes>
    <DropzoneModal v-if="isOverDropZone" />
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer/dist/style.css'
import 'splitpanes/dist/splitpanes.css'
import { ref, shallowRef, useTemplateRef } from 'vue'
import { refDebounced, useDropZone } from '@vueuse/core'
import { SpecRenderer } from '@kong/spec-renderer'
import { KongGradientIcon } from '@kong/icons'
import { KUI_ICON_SIZE_50 } from '@kong/design-tokens'
import type { VueMonacoEditorEmitsOptions } from '@guolao/vue-monaco-editor'
import { Editor } from '@guolao/vue-monaco-editor'
import { Splitpanes, Pane } from 'splitpanes'
import DropzoneModal from './components/DropzoneModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import sampleSpec from './assets/sample-spec.json'

const MONACO_EDITOR_OPTIONS = {
  theme: 'vs-dark',
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  minimap: { enabled: false },
}

const editorLanguage = ref('json')
const code = ref(JSON.stringify(sampleSpec, null, 2))
const specText = refDebounced(code, 700)
const editor = shallowRef()

const dropZoneRef = useTemplateRef('dropzone')
const fileInputRef = useTemplateRef('fileInput')

const specSettings = ref<Record<string, boolean>>({})

const updateLanguage = () => {
  if (code.value.length < 1) return

  // simplest hack to detect if we have JSON or YAML
  if (code.value.startsWith('{') || code.value.startsWith('[')) {
    editorLanguage.value = 'json'
  } else {
    editorLanguage.value = 'yaml'
  }
}

const handleMount: VueMonacoEditorEmitsOptions['mount'] = (editorInstance) => {
  editor.value = editorInstance

  // auto-detect language when new code is pasted
  editor.value.onDidPaste(updateLanguage)
}

const dropzoneClick = () => {
  fileInputRef.value?.click()
}

const fileUploaded = () => {
  const file = fileInputRef.value?.files?.item(0)
  if (file) {
    onDrop([file])
  }
}

function onDrop(files: File[] | null) {
  const file = files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = (e) => {
      if (e.target?.result) {
        code.value = e.target.result.toString()
        updateLanguage()
      }
    }
  }
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/x-yaml', 'application/json'],
  multiple: false,
  // whether to prevent default behavior for unhandled events
  preventDefaultForUnhandled: false,
})

const updateSettings = (settings: Record<string, boolean>) => {
  specSettings.value = settings
}
</script>

<style lang="scss" scoped>
.spec-renderer-playground {
  font-family: 'Inter', Helvetica, Arial, sans-serif;
  $header-height: $kui-space-120;

  * {
    box-sizing: border-box;
    margin: 0;
  }

  .editor-header {
    align-items: center;
    background-color: $kui-color-background-inverse;
    color: $kui-color-text-inverse;
    display: flex;
    height: $header-height;
    justify-content: space-between;
    padding: $kui-space-20 $kui-space-60;


    .header-title {
      align-items: center;
      display: inline-flex;
      gap: $kui-space-30;

      h1 {
        font-size: $kui-font-size-50;
        line-height: $kui-line-height-50;
      }
    }

    .header-actions {
      align-items: center;
      display: inline-flex;
      gap: $kui-space-40;

      .language-selector {
        :deep(.trigger-button) {
          border: $kui-border-width-10 solid $kui-color-border;
          color: $kui-color-text-inverse;
          font-family: $kui-font-family-code;
          font-size: $kui-font-size-20;
          line-height: $kui-line-height-20;
          padding: $kui-space-20 $kui-space-30;
        }
      }

      .upload-spec-file {
        @include default-button-reset;
        background-color: $kui-color-background-transparent;
        border: $kui-border-width-10 solid $kui-color-border;
        border-radius: $kui-border-radius-20;
        color: $kui-color-text-inverse;
        cursor: pointer;
        font-size: $kui-font-size-30;
        padding: $kui-space-20 $kui-space-40;
        transition: background-color 0.2s ease-in-out,
          color 0.2s ease-in-out,
          border-color 0.2s ease-in-out;

        &:hover:not(:disabled):not(:focus):not(:active) {
          background-color: $kui-color-background-primary-weakest;
          color: $kui-color-text-primary-stronger;
        }
      }
    }

    .github-link {
      img {
        height: $kui-icon-size-40;
        vertical-align: bottom;
        width: $kui-icon-size-40;
      }
    }
  }

  .spec-container.default-theme {
    height: calc(100dvh - #{$header-height});
    width: 100dvw;

    .splitpanes__pane {
      background-color: $kui-color-background-transparent;
      overflow: auto;
    }
  }
}
</style>
