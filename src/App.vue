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
        <p>
          API documentation demo
        </p>
      </div>
      <div class="header-actions">
        <button
          appearance="tertiary"
          class="create-developer-portal"
          data-testid="create-developer-portal"
        >
          Create developer portal
        </button>
        <KTooltip text="View on GitHub">
          <KExternalLink
            class="github-link"
            hide-icon
            href="https://github.com/Kong/spec-renderer"
          >
            <img
              alt="GitHub logo"
              src="/github-logo.svg"
            >
          </KExternalLink>
        </KTooltip>
      </div>
    </header>
    <Splitpanes class="spec-container default-theme">
      <Pane
        class="pane-left"
        max-size="70"
        min-size="10"
      >
        <SpecToolbar class="editor-toolbar">
          <template #left>
            <h2 class="toolbar-title">
              API specification
            </h2>
          </template>
          <template #right>
            <KButton
              appearance="secondary"
              class="file-input-button"
              size="small"
              @click="dropzoneClick"
            >
              <UploadIcon decorative />
              <span>
                Upload or drop spec file
              </span>
            </KButton>
            <input
              ref="fileInput"
              accept=".json, .yaml, .yml"
              class="file-input"
              type="file"
              @change="fileUploaded"
            >
          </template>
        </SpecToolbar>
        <SpecEditor
          :key="fileKey"
          v-model="code"
        />
      </Pane>
      <Pane class="spec-renderer-pane">
        <SpecToolbar>
          <template #left>
            <h2 class="toolbar-title">
              Preview
            </h2>
          </template>
          <template #right>
            <SettingsModal />
          </template>
        </SpecToolbar>
        <SpecRenderer
          class="spec-renderer"
          :control-address-bar="true"
          document-scrolling-container=".spec-renderer-pane"
          :spec="specText"
          v-bind="options"
        />
      </Pane>
    </Splitpanes>
    <DropzoneModal v-if="isOverDropZone" />
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer/dist/style.css'
import 'splitpanes/dist/splitpanes.css'
import { ref, useTemplateRef } from 'vue'
import { refDebounced, useDropZone } from '@vueuse/core'
import { SpecRenderer } from '@kong/spec-renderer'
import { KongGradientIcon, UploadIcon } from '@kong/icons'
import { KUI_ICON_SIZE_50 } from '@kong/design-tokens'
import { Splitpanes, Pane } from 'splitpanes'
import DropzoneModal from './components/DropzoneModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import sampleSpec from './assets/sample-spec.json'
import useApiDocOptions from '@/composables/useApiDocOptions'
import SpecEditor from '@/components/SpecEditor.vue'
import SpecToolbar from '@/components/SpecToolbar.vue'

const code = ref(JSON.stringify(sampleSpec, null, 2))
const specText = refDebounced(code, 700)

const dropZoneRef = useTemplateRef('dropzone')
const fileInputRef = useTemplateRef('fileInput')
const fileKey = ref(0)

const { options } = useApiDocOptions()

const dropzoneClick = () => {
  fileInputRef.value?.click()
}

const fileUploaded = () => {
  const file = fileInputRef.value?.files?.item(0)
  if (file) {
    onDrop([file])
  }
}

const onDrop = (files: File[] | null) => {
  const file = files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = (e) => {
      if (e.target?.result) {
        code.value = e.target.result.toString()
        fileKey.value += 1 // Force re-render of the editor
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
</script>

<style lang="scss" scoped>
.spec-renderer-playground {
  background: $kui-color-background-inverse;
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

      p {
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-regular;
        margin-left: $kui-space-60;
      }

      @media (max-width: $kui-breakpoint-mobile) {
        p {
          display: none;
        }
      }
    }

    .header-actions {
      align-items: center;
      display: inline-flex;
      gap: $kui-space-60;

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

      .create-developer-portal {
        @include default-button-reset;
        background-color: $kui-color-background-transparent;
        border: $kui-border-width-20 solid $kui-color-border-inverse;
        border-radius: $kui-border-radius-30;
        color: $kui-color-text-inverse;
        cursor: pointer;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
        padding: $kui-space-30 $kui-space-50;
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

  .spec-renderer-pane {
    background: $kui-color-background !important;
  }

  .editor-toolbar {
    border-top-left-radius: $kui-border-radius-50;

    .file-input {
      position: absolute;
      visibility: hidden;
    }
  }

  .toolbar-title {
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-30;
    // truncate text
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .file-input-button {
    // hide text in small screens
    span {
      @media (max-width: $kui-breakpoint-mobile) {
        display: none;
      }
    }
  }
}

.pane-left {
  border-right: $kui-border-width-10 solid $kui-color-border;
  margin-left: $kui-space-60;
  overflow: hidden !important;
}
</style>
